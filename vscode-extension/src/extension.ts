// TODO
// - rendering existing threads
// - subscribing to thread updates

import { gql } from "@apollo/client/core";
import * as child_process from "child_process";
import * as util from "util";
import * as vscode from "vscode";
import {
  eraseCuddlefishSessionToken,
  getApolloClientWithAuth,
  getCuddlefishSessionTokenModal,
  getOctokitModal,
  GitHubCredentials,
} from "./credentials";
import {
  AllThreadsQuery,
  AllThreadsQueryVariables,
  StartThreadMutation,
  StartThreadMutationVariables,
} from "./generated/hasura-types";
import * as git from "./git";
import { BlameLine, blamelineToString } from "./git";
import {
  assert,
  assertNotNull,
  logErrors0,
  logErrors1,
  logErrors2,
  notNull,
} from "./utils";

const exec = util.promisify(child_process.exec);
// const fs = vscode.workspace.fs;

// function sleep(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// An ugly hack to work around https://github.com/microsoft/vscode/issues/135712
// Using vscode.Uri's as keys doesn't work, so we use `uri.toString()` instead.
const uriToDocument = new Map<string, vscode.TextDocument>();

// Check whether or not to allow commenting on a given document. Returns the
// repo root if commenting is allowed, and undefined if not.
async function isCommentingAllowed(
  document: vscode.TextDocument
): Promise<string | undefined> {
  // TODO: support adding comments on library code that is not necessarily in a
  // git repo, but is in node_modules, python site-packages, etc.

  // If it's not a local file, we can't comment on it. This also covers
  // the untitled file case which has scheme `untitled`.
  if (document.uri.scheme !== "file") {
    return undefined;
  }

  const repo = await git.repoRoot(document.uri);
  if (repo === undefined) {
    console.log(`Could not find a parent git repo for ${document.uri}`);
    return undefined;
  }

  // Note we don't check whether repos are public or private here. That's
  // handled when someone goes to start a new thread.

  // Note at some point we might as well remove this... it adds latency
  // and complicates the flow for getting people to use cuddlefish on
  // non-GitHub repos (eventually...).
  const githubRemotes = await git.getGitHubRemotes(repo);
  if (githubRemotes.size === 0) {
    // None of the remotes are GitHub remotes. Don't show any commenting
    // ranges for now.
    return undefined;
  }

  // Check if the file is tracked by git. If not, we should not allow
  // commenting.
  if (!(await git.isFileTracked(repo, document.uri.path))) {
    return undefined;
  }

  return repo;
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("Activating Cuddlefish Comments...");

  // Check that we have a working git installation.
  try {
    // TODO don't use exec here, prefer spawn.
    const { stdout } = await exec("git --version");
    console.log(`git version: ${stdout}`);
  } catch (e) {
    vscode.window.showErrorMessage(
      "Could not find a working git installation. Do you have git installed and in your PATH?"
    );
    console.error(e);
  }

  const credentials = new GitHubCredentials(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.login",
      logErrors0(async () => {
        // Scrap our current cuddlefish session token and get a new one.
        eraseCuddlefishSessionToken(context);
        await getCuddlefishSessionTokenModal(context, credentials);

        const octokit = await getOctokitModal(credentials);
        const userInfo = await octokit.users.getAuthenticated();
        vscode.window.showInformationMessage(
          `Logged in to Cuddlefish Comments via GitHub as @${userInfo.data.login}!`
        );
      })
    )
  );

  // Status bar
  let statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  statusBar.command = "cuddlefish-comments.login";
  statusBar.text = "$(comment-discussion) Cuddlefish";
  context.subscriptions.push(statusBar);
  statusBar.show();

  // Comment controller. The description shows up when there are multiple
  // comment providers for the same line and you have to choose between them.
  // See https://postimg.cc/WhntTs50.
  const commentController = vscode.comments.createCommentController(
    "cuddlefish-comments",
    "Cuddlefish Comments"
  );
  commentController.commentingRangeProvider = {
    provideCommentingRanges: logErrors2(
      async (
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
      ) => {
        // This gets called every single time a file is opened, even though the
        // comment threads on the file are cached by VSCode.
        console.log("provideCommentingRanges");

        const repo = await isCommentingAllowed(document);
        if (repo === undefined) {
          return [];
        }

        // TODO when files are opened:
        // - [ ] subscribe to hasura for updates

        const blameinfo = await git.blame(
          repo,
          document.fileName,
          document.getText(),
          undefined
        );

        // Subtract one to account for the fact that VSCode is 0-indexed.
        // Subtract another one to account for the fact that hunksize 1
        // implies the range [17, 17], not [17, 18].
        const ranges = blameinfo.blamehunks
          .filter((hunk) => hunk.origCommitHash !== git.ZERO_HASH)
          .map(({ currStartLine, hunksize }) => [
            currStartLine - 1,
            currStartLine + hunksize - 2,
          ]);

        uriToDocument.set(document.uri.toString(), document);

        ////////////////////////////////////////////////////////////////////////
        const client = await getApolloClientWithAuth(context, credentials);
        const show = (x: any) => {
          console.log(x);
          return x;
        };
        const { blamelineToCurrLine, currLineToBlameline } =
          git.blamehunksToBlamelines(blameinfo.blamehunks);

        for (const [currLine, blamehunk] of currLineToBlameline.entries()) {
          console.log(`${currLine} ${JSON.stringify(blamehunk)}`);
        }

        const res = await client.query<
          AllThreadsQuery,
          AllThreadsQueryVariables
        >({
          query: gql`
            query AllThreads($cond: lines_bool_exp!) {
              lines(where: $cond) {
                commit
                file_path
                line_number
                threads {
                  id
                  comments(order_by: { created_at: desc }) {
                    id
                    body
                    author_github_node_id
                    github_user {
                      github_username
                      github_name
                    }
                  }
                }
              }
            }
          `,
          variables: {
            cond: {
              _or: show(
                Array.from(currLineToBlameline.values(), (blameline) => ({
                  commit: { _eq: blameline.origCommitHash },
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  file_path: { _eq: blameline.filepath },
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  line_number: { _eq: blameline.origLine },
                }))
              ),
            },
          },
        });
        console.log("querying threads");
        console.log(res.data.lines);
        for (const line of res.data.lines) {
          console.log(line);
          const orig: BlameLine = {
            origCommitHash: line.commit,
            filepath: line.file_path,
            origLine: line.line_number,
          };
          const currLine = blamelineToCurrLine.get(blamelineToString(orig));
          assertNotNull(currLine);

          // It may occasionally be the case that there is an entry in the `lines` table that has no corresponding threads. This is somewhat future-proofing ourselves against the case where we are doing blamelines via the web interface.
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

          // TODO: dedup these by thread id. right now every time we provideCommentingRanges we get extra copies of the same thread.
          commentController.createCommentThread(
            document.uri,
            new vscode.Range(currLine - 1, 0, currLine - 1, 1),
            thread.comments.map((comment) => {
              const username = comment.github_user.github_username;
              const name = comment.github_user.github_name;
              const avatarUrl = `https://avatars.githubusercontent.com/${username}?s=40`;
              return {
                author: {
                  iconPath: vscode.Uri.parse(avatarUrl),
                  name:
                    typeof name === "string" && name.length > 0
                      ? `${name} (@${username})`
                      : `@${username}`,
                },
                body: `id:${thread.id} ${comment.body}`,
                mode: vscode.CommentMode.Preview,
              };
            })
          );
        }
        ////////////////////////////////////////////////////////////////////////

        // TODO unclear from the docs if Range is inclusive or exclusive.
        // Either way this seems to do the right thing for now.
        return ranges.map(([a, b]) => new vscode.Range(a, 0, b, 0));
      }
    ),
  };
  context.subscriptions.push(commentController);

  // Starting a new thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.startThread",
      logErrors1(async (reply: vscode.CommentReply) => {
        console.log("Starting a new thread");
        console.log(reply);

        // We should only be showing the comment gutters if we're in a file
        // that's in a git repo.
        const gitRepoRoot = notNull(await git.repoRoot(reply.thread.uri));
        const githubRemotes = Array.from(
          (await git.getGitHubRemotes(gitRepoRoot)).values(),
          git.repoId
        );
        const document = notNull(
          uriToDocument.get(reply.thread.uri.toString())
        );

        const lineNumber = reply.thread.range.start.line + 1;
        const { blamehunks } = await git.blame(
          gitRepoRoot,
          reply.thread.uri.path,
          document.getText(),
          lineNumber
        );
        assert(blamehunks.length === 1, "expected exactly on blamehunk");
        const blamehunk = blamehunks[0];
        assert(
          blamehunk.origCommitHash !== git.ZERO_HASH,
          "expected non-zero commit hash"
        );
        assert(blamehunk.currStartLine === lineNumber, "wrong line");
        console.log(
          `staring a thread on original line ${JSON.stringify(blamehunk)}`
        );

        // TODO maybe present the original commit author name in some user-friendly way?

        // TODO use graphql codegen to get type safe queries
        const client = await getApolloClientWithAuth(context, credentials);
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
            commitHash: blamehunk.origCommitHash,
            filePath: blamehunk.filepath,
            lineNumber: blamehunk.origStartLine,
            body: reply.text,
          },
        });
        assert(res.errors === undefined, "graphql errors");
        assertNotNull(res.data);
        const new_thread_id = res.data.StartThread;

        // TODO:
        // - [ ] parse the response and render the thread
        // - [ ] if this is the first thread the user has started show a nice info/welcome message
        // - [ ] add profile photo

        reply.thread.comments = [
          {
            author: { name: "Samuel Ainsworth" },
            body: reply.text,
            mode: vscode.CommentMode.Preview,
          },
        ];
      })
    )
  );

  // Comment on existing thread
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cuddlefish-comments.commentOnThread",
      logErrors1(async (reply: vscode.CommentReply) => {
        // TODO
        console.group("commentOnThread");
        console.log(reply);

        throw new Error("not implemented");
      })
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
