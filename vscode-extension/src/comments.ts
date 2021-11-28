import { gql } from "@apollo/client/core";
import * as vscode from "vscode";
import { CommentController } from "vscode";
import {
  getApolloClientWithAuth,
  getOctokitUserInfo,
  GitHubCredentials,
} from "./credentials";
import {
  AddCommentMutation,
  AddCommentMutationVariables,
  AllThreadsQuery,
  AllThreadsQueryVariables,
  StartThreadMutation,
  StartThreadMutationVariables,
} from "./generated/user-hasura-types";
import {
  BlameHunk,
  blamehunksToBlamelines,
  BlameLine,
  blamelineToString,
} from "./git";
import { assert, notNull, SafeSet } from "./utils";

function gitHubAuthor(
  username: string,
  name: string | null | undefined
): vscode.CommentAuthorInformation {
  const avatarUrl = `https://avatars.githubusercontent.com/${username}?s=40`;
  return {
    iconPath: vscode.Uri.parse(avatarUrl),
    name:
      typeof name === "string" && name.length > 0
        ? `${name} (@${username})`
        : `@${username}`,
  };
}
function emailAuthor(email: string): vscode.CommentAuthorInformation {
  // TODO set up icon for email authors?
  return { name: email };
}

interface CFComment extends vscode.Comment {
  // Necessary to recover the thread id when adding a commenting to an existing
  // thread. VSCode's extension API make this kind of annoying. Adding it as a
  // field on the thread objects doesn't seem to work.
  cfThreadId: string;
}

export class CommentJefe {
  private context: vscode.ExtensionContext;
  private credentials: GitHubCredentials;
  private commentController: CommentController;

  // Note that VSCode also has its own internal notion of threadId, although
  // that's not part of the public interface.
  // (uri, cf_thread_id) -> CommentThread
  private cfThreadIdToCommentThread: Map<string, vscode.CommentThread> =
    new Map();

  constructor(
    context: vscode.ExtensionContext,
    credentials: GitHubCredentials,
    commentController: CommentController
  ) {
    this.context = context;
    this.credentials = credentials;
    this.commentController = commentController;
  }

  async trackDocument(uri: vscode.Uri, blamehunks: BlameHunk[]) {
    const { blamelineToCurrLine, currLineToBlameline } =
      blamehunksToBlamelines(blamehunks);

    // TODO make this a subscription
    const client = await this._getApolloClient();
    const variables: AllThreadsQueryVariables = {
      cond: {
        _or: new SafeSet(
          Array.from(currLineToBlameline.values(), (blameline) => ({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            commit_hash: { _eq: blameline.origCommitHash },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            file_path: { _eq: blameline.filepath },
          }))
        ).values(),
      },
    };
    console.log(variables.cond);
    const res = await client.query<AllThreadsQuery, AllThreadsQueryVariables>({
      query: gql`
        query AllThreads($cond: lines_bool_exp!) {
          lines(where: $cond) {
            commit_hash
            file_path
            line_number
            threads {
              id
              comments(order_by: { created_at: desc }) {
                id
                body
                author_github_node_id
                author_email
                github_user {
                  github_username
                  github_name
                }
              }
            }
          }
        }
      `,
      variables,
    });
    assert(res.error === undefined, "graphql errors");
    assert(res.errors === undefined, "graphql errors");
    for (const line of res.data.lines) {
      const orig: BlameLine = {
        origCommitHash: line.commit_hash,
        filepath: line.file_path,
        origLine: line.line_number,
      };

      // It's possible that we select a line that is not actually in this file
      // since we don't select on the line number for performance reasons.
      const currLine = blamelineToCurrLine.get(blamelineToString(orig));
      if (currLine === undefined) {
        continue;
      }

      // It may occasionally be the case that there is an entry in the `lines`
      // table that has no corresponding threads. This is somewhat
      // future-proofing ourselves against the case where we are doing
      // blamelines via the web interface.
      if (line.threads.length === 0) {
        continue;
      }

      assert(
        line.threads.length === 1,
        "there should be no more than one thread per line"
      );
      const thread = line.threads[0];
      assert(
        thread.comments.length >= 1,
        "there should be at least one comment in a thread"
      );

      // TODO: Use the `label` field for "code author", "contributor", etc.
      const comments: vscode.Comment[] = thread.comments.map((comment) => {
        const author = comment.github_user
          ? gitHubAuthor(
              comment.github_user.github_username,
              comment.github_user.github_name
            )
          : emailAuthor(notNull(comment.author_email));

        const newComment: CFComment = {
          author,
          // body: `id:${thread.id} ${comment.body}`,
          body: comment.body,
          mode: vscode.CommentMode.Preview,
          cfThreadId: thread.id,
        };
        return newComment;
      });

      const key = JSON.stringify([uri.toString(), thread.id]);
      const existingThread = this.cfThreadIdToCommentThread.get(key);
      // Note that we are putting the comment on just the first character of
      // the line for now. This does not seem to have any impact on the UI
      // presentation of the thread.
      const range = new vscode.Range(currLine - 1, 0, currLine - 1, 1);
      if (existingThread !== undefined) {
        // Updating the range is necessary to make sure the threads move to the
        // new correct lines if the document has been edited. VSCode doesn't
        // take care of that for us.
        existingThread.range = range;
        existingThread.comments = comments;
      } else {
        const newThread = this.commentController.createCommentThread(
          uri,
          range,
          comments
        );
        this.cfThreadIdToCommentThread.set(key, newThread);
      }
    }
  }

  async startThread(
    githubRemotes: string[],
    origCommitHash: string,
    filepath: string,
    origLine: number,
    reply: vscode.CommentReply
  ) {
    try {
      // Preemptively update the UI, then fix after completing the request.
      const userInfo = await getOctokitUserInfo(this.credentials);
      reply.thread.comments = [
        {
          author: gitHubAuthor(userInfo.data.login, userInfo.data.name),
          body: reply.text,
          mode: vscode.CommentMode.Preview,
        },
      ];

      const client = await this._getApolloClient();
      const res = await client.mutate<
        StartThreadMutation,
        StartThreadMutationVariables
      >({
        mutation: gql`
          mutation StartThread(
            $repoIds: [String!]!
            $commitHash: String!
            $filePath: String!
            $lineNumber: Int!
            $body: String!
          ) {
            StartThread(
              repoIds: $repoIds
              commitHash: $commitHash
              filePath: $filePath
              lineNumber: $lineNumber
              body: $body
            )
          }
        `,
        variables: {
          repoIds: githubRemotes,
          commitHash: origCommitHash,
          filePath: filepath,
          lineNumber: origLine,
          body: reply.text,
        },
      });
      assert(res.errors === undefined, "graphql errors");
      const newCFThreadId = notNull(res.data).StartThread;

      // Put this new thread into cfThreadIdToCommentThread
      const uriString = reply.thread.uri.toString();
      this.cfThreadIdToCommentThread.set(
        JSON.stringify([uriString, newCFThreadId]),
        reply.thread
      );

      // Actually add comment to the new thread with cfThreadId. We should already
      // have this document in our subscriptions, so it should also be taken care
      // of that way.
      const newComment: CFComment = {
        author: gitHubAuthor(userInfo.data.login, userInfo.data.name),
        body: reply.text,
        mode: vscode.CommentMode.Preview,
        cfThreadId: newCFThreadId,
      };
      reply.thread.comments = [newComment];
    } catch (err) {
      reply.thread.dispose();
      // Throw the error up the chain so that we can log it, etc.
      throw err;
    }
  }

  async addComment(reply: vscode.CommentReply) {
    assert(
      reply.thread.comments.length >= 1,
      "existing threads must have at least one comment"
    );
    const cfThreadId = (reply.thread.comments[0] as CFComment).cfThreadId;

    // Preemptively update the UI.
    const userInfo = await getOctokitUserInfo(this.credentials);
    const newComment: CFComment = {
      author: gitHubAuthor(userInfo.data.login, userInfo.data.name),
      body: reply.text,
      mode: vscode.CommentMode.Preview,
      cfThreadId,
    };
    reply.thread.comments = [...reply.thread.comments, newComment];

    // author_github_node_id is auto-filled with x-hasura-user-id, per the
    // hasura metadata config.
    const client = await this._getApolloClient();
    const res = await client.mutate<
      AddCommentMutation,
      AddCommentMutationVariables
    >({
      mutation: gql`
        mutation AddComment($body: String!, $threadId: uuid!) {
          insert_comments_one(object: { body: $body, thread_id: $threadId }) {
            id
          }
        }
      `,
      variables: { threadId: cfThreadId, body: reply.text },
    });
    assert(res.errors === undefined, "graphql errors");
    const newCommentId = notNull(notNull(res.data).insert_comments_one).id;
    console.log(`Added comment with id ${newCommentId}`);
  }

  private async _getApolloClient() {
    return await getApolloClientWithAuth(this.context, this.credentials);
  }
}
