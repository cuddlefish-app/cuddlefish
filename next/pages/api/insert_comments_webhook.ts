import { gql } from "@apollo/client/core";
import { Octokit } from "@octokit/rest";
import { isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { DateFromISOString } from "io-ts-types/lib/DateFromISOString";
import type { NextApiRequest, NextApiResponse } from "next";
import ReactDOMServer from "react-dom/server";
import {
  ADMIN_buildApolloClient,
  assert,
  assert400,
  logHandlerErrors,
} from "../../common_utils";
import { lookupRepoByNodeId } from "../../github";
import { getSendgrid } from "../../server_utils";
import {
  CommentContextQuery,
  CommentContextQueryVariables,
} from "../../src/generated/admin-hasura-types";
import NewThreadEmail from "../emails/new_thread";

// TODO: more specific validation on uuid types
// Example created_at: 2021-11-05T04:09:07.537667+00:00
const RequestData = t.strict({
  event: t.strict({
    session_variables: t.record(t.string, t.string),
    op: t.literal("INSERT"),
    data: t.strict({
      old: t.null,
      new: t.type({
        thread_id: t.string,
        author_github_node_id: t.string,
        body: t.string,
        created_at: DateFromISOString,
        id: t.string,
      }),
    }),
    trace_context: t.strict({ trace_id: t.string, span_id: t.string }),
  }),
  created_at: DateFromISOString,
  id: t.string,
  delivery_info: t.strict({ max_retries: t.number, current_retry: t.number }),
  trigger: t.strict({ name: t.literal("insert_comments") }),
  table: t.strict({ schema: t.literal("public"), name: t.literal("comments") }),
});

export default logHandlerErrors(async function (
  req: NextApiRequest,
  res: NextApiResponse<{}>
) {
  // Verify request is coming from hasura or some other trusted source
  // TODO set this up on the hasura side and then turn this on
  // assert400(
  //   req.headers["x-api-secret"] === notNull(process.env.API_SECRET),
  //   "incorrect api secret"
  // );

  assert400(req.method === "POST", "expected POST request");
  const decoded = RequestData.decode(req.body);
  assert400(isRight(decoded), "parse fail");
  const payload = decoded.right;
  console.log(payload.event.data.new);

  const newCommentId = payload.event.data.new.id;
  const apolloClient = ADMIN_buildApolloClient();
  const q = await apolloClient.query<
    CommentContextQuery,
    CommentContextQueryVariables
  >({
    query: gql`
      query CommentContext($commentId: uuid!) {
        comments(where: { id: { _eq: $commentId } }) {
          github_user {
            email
            github_name
            github_username
            access_token
          }

          thread {
            id
            original_commit_hash
            original_file_path
            original_line_number
            github_repos {
              repo_github_node_id
            }
            comments(order_by: { created_at: asc }) {
              id
              created_at
              github_user {
                email
                github_name
                github_username
                github_node_id
              }
            }
          }
        }
      }
    `,
    variables: { commentId: newCommentId },
  });
  // These asserts should return 500, same as current behavior
  assert(q.error === undefined, "hasura returned errors");
  assert(q.errors === undefined, "hasura returned errors");
  assert(q.data.comments.length === 1, "expected exactly one comment");
  const comment = q.data.comments[0];

  // Find all comments that came before the current one. Technically, we could
  // get away with a takeWhile here since we're sorting on created_at in the
  // query, but that doesn't seem to be in the JS stdlib.
  const precedingComments = comment.thread.comments.filter((comment) => {
    const d = DateFromISOString.decode(comment.created_at);
    assert(isRight(d), "created_at is not a date");
    return d.right < payload.created_at;
  });

  const newComment = payload.event.data.new;
  const newCommentAuthor = comment.github_user;
  if (precedingComments.length === 0) {
    // This is the first comment => new thread email
    await sendNewThreadEmails(newComment, comment.thread, newCommentAuthor);
  } else {
    // This is not the first comment => new comment email
    assert(false, "TODO");
    // await sendNewCommentEmails(precedingComments, newCommentAuthor);
  }

  res.status(200).json({});
});

async function sendNewThreadEmails(
  newComment: {
    thread_id: string;
    author_github_node_id: string;
    body: string;
    created_at: Date;
    id: string;
  },
  thread: {
    id: string;
    original_commit_hash: string;
    original_file_path: string;
    original_line_number: number;
    github_repos: { repo_github_node_id: string }[];
  },
  newCommentAuthor: {
    email: string;
    github_name?: string | null | undefined;
    github_username: string;
    access_token: string;
  }
) {
  // It's possible that multiple repos may contain the same commit, eg forks.
  assert(
    thread.github_repos.length >= 1,
    "expected at least one github repo containing this commit"
  );
  // For now we just pick the first github repo. Commits should be globally unique anyhow.
  const repoId = thread.github_repos[0].repo_github_node_id;

  // Find a repo containing this commit
  const octokit = new Octokit({ auth: newCommentAuthor.access_token });
  const { owner, repo } = await lookupRepoByNodeId(octokit, repoId);
  console.log(owner, repo);

  // TODO find original commit author
  const commit = (
    await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: thread.original_commit_hash,
    })
  ).data;
  // Example commit.url: https://api.github.com/repos/samuela/personal-website/git/commits/208b81bafe9d66ca29fd0b78cbbb68256ab543fc
  // Example commit.html_url: https://github.com/samuela/personal-website/commit/208b81bafe9d66ca29fd0b78cbbb68256ab543fc

  // No way to get Co-Authors from GitHub API AFAICT
  const author = commit.author;
  const committer = commit.committer;

  // Send an email to me
  await sendNewThreadEmail(
    { email: "skainsworth+cuddlefish@gmail.com", name: "Samuel Ainsworth" },
    "admin",
    { owner, repo },
    thread,
    newComment,
    newCommentAuthor
  );

  // Send an email to the author
  if (newCommentAuthor.email !== author.email) {
    await sendNewThreadEmail(
      author,
      "author",
      { owner, repo },
      thread,
      newComment,
      newCommentAuthor
    );
  }

  // Send an email to the committer if different from author
  if (
    committer.email !== author.email &&
    committer.email !== newCommentAuthor.email
  ) {
    await sendNewThreadEmail(
      committer,
      "committer",
      { owner, repo },
      thread,
      newComment,
      newCommentAuthor
    );
  }
}

async function sendNewThreadEmail(
  recipient: { name: string; email: string },
  role: "author" | "committer" | "admin",
  repo: { owner: string; repo: string },
  thread: {
    original_commit_hash: string;
    original_file_path: string;
    original_line_number: number;
  },
  newComment: {
    thread_id: string;
    author_github_node_id: string;
    body: string;
    created_at: Date;
    id: string;
  },
  newCommentAuthor: {
    email: string;
    github_name?: string | null | undefined;
    github_username: string;
  }
) {
  // TODO check recipient's email preferences
  // TODO check common no-reply email patterns
  // TODO lookup PRs that involve this commit
  // TODO try to find recipient's name/username from their email via GitHub API, can use our own db if necessary

  const html = ReactDOMServer.renderToStaticMarkup(
    NewThreadEmail({
      repo,
      thread,
      newComment,
      newCommentAuthor,
      recipient,
      role,
    })
  );
  const fromName =
    newCommentAuthor.github_name || `@${newCommentAuthor.github_username}`;
  await getSendgrid().send({
    to: recipient,
    from: {
      name: `${fromName} via Cuddlefish Comments`,
      // TODO make this email domain match the one that we receive email on, once that's configured
      email: "fish@cuddlefish.app",
    },
    subject: `💬 ${truncate(newComment.body.replaceAll("\n", " "), 100)}`,
    html,
  });
}

function truncate(str: string, len: number) {
  if (str.length <= len) {
    return str;
  } else {
    return str.substr(0, len) + "…";
  }
}
