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
  isString,
  logHandlerErrors,
  notNull,
} from "../../src/common_utils";
import {
  CommentContextQuery,
  CommentContextQueryVariables,
} from "../../src/generated/admin-hasura-types";
import { ADMIN_getOctokit, lookupRepoByNodeId } from "../../src/github";
import { getSendgrid, hasCorrectApiSecret } from "../../src/server_utils";
import NewCommentEmail from "../emails/new_comment";
import NewThreadEmail from "../emails/new_thread";
import { CF_APP_EMAIL } from "./config";

// TODO types could be improved in this module to reflect the fact that every
// comment has either github_user or author_email, but never both.

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
        author_github_node_id: t.union([t.string, t.null]),
        author_email: t.union([t.string, t.null]),
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
  assert400(hasCorrectApiSecret(req), "incorrect api secret");

  assert400(req.method === "POST", "expected POST request");
  const decoded = RequestData.decode(req.body);
  assert400(isRight(decoded), "parse fail");
  const payload = decoded.right;
  // console.log(payload.event.data.new);

  const newCommentId = payload.event.data.new.id;
  const apolloClient = ADMIN_buildApolloClient();
  const q = await apolloClient.query<
    CommentContextQuery,
    CommentContextQueryVariables
  >({
    query: gql`
      query CommentContext($commentId: uuid!) {
        comments_by_pk(id: $commentId) {
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
              author_email
              body
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
  const comment = notNull(q.data.comments_by_pk);

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

  // It's possible that multiple repos may contain the same commit, eg forks.
  assert(
    comment.thread.github_repos.length >= 1,
    "expected at least one github repo containing this commit"
  );
  // For now we just pick the first github repo. Commits should be globally unique anyhow.
  const repoId = comment.thread.github_repos[0].repo_github_node_id;

  // Use the user's GitHub access token if we have it. We might not have it if the user has never logged in before, but
  // has responded to one of our emails.
  const userGitHubAccessToken = newCommentAuthor?.access_token;
  const octokit = isString(userGitHubAccessToken)
    ? new Octokit({ auth: userGitHubAccessToken })
    : ADMIN_getOctokit();

  // Find a repo containing this commit
  const repo = await lookupRepoByNodeId(octokit, repoId);

  // Lookup the commit details to get code author and committer
  const commit = (
    await octokit.git.getCommit({
      ...repo,
      commit_sha: comment.thread.original_commit_hash,
    })
  ).data;
  // Example commit.url: https://api.github.com/repos/samuela/personal-website/git/commits/208b81bafe9d66ca29fd0b78cbbb68256ab543fc
  // Example commit.html_url: https://github.com/samuela/personal-website/commit/208b81bafe9d66ca29fd0b78cbbb68256ab543fc

  // No way to get Co-Authors from GitHub API AFAICT
  const codeAuthor = commit.author;
  const codeCommitter = commit.committer;

  if (precedingComments.length === 0) {
    // This is the first comment => new thread email
    // Note: notNull should be safe here because new threads can only be started by GitHub users, not email-author comments.
    await sendNewThreadEmails(
      codeAuthor,
      codeCommitter,
      repo,
      comment.thread,
      newComment,
      notNull(newCommentAuthor)
    );
  } else {
    // This is not the first comment => new comment email
    await sendNewCommentEmails(
      codeAuthor,
      codeCommitter,
      repo,
      comment.thread,
      precedingComments,
      newComment,
      newCommentAuthor
    );
  }

  res.status(200).json({});
});

async function sendNewCommentEmails(
  codeAuthor: { name: string; email: string },
  codeCommitter: { name: string; email: string },
  repo: { owner: string; repo: string },
  thread: {
    id: string;
    original_commit_hash: string;
    original_file_path: string;
    original_line_number: number;
    github_repos: { repo_github_node_id: string }[];
  },
  precedingComments: {
    id: string;
    author_email?: string | null | undefined;
    body: string;
    github_user?:
      | {
          email: string;
          github_name?: string | null | undefined;
          github_username: string;
          github_node_id: string;
        }
      | null
      | undefined;
  }[],
  newComment: {
    thread_id: string;
    author_github_node_id?: string | null | undefined;
    author_email?: string | null | undefined;
    body: string;
    created_at: Date;
    id: string;
  },
  newCommentAuthor?:
    | {
        email: string;
        github_name?: string | null | undefined;
        github_username: string;
        access_token?: string | null | undefined;
      }
    | null
    | undefined
) {
  // There is either author_email or author_github_node_id (but not both). If author_github_node_id is present, then
  // newCommentAuthor must be present. It would be nice to move this invariant into something a little more clear.
  const commentAuthorEmail = notNull(
    newCommentAuthor?.email ?? newComment.author_email
  );

  const emailsSent = new Set<string>();

  // Send an email to me
  await sendNewCommentEmail(
    { email: "sam@cuddlefish.app", name: "Sam ADMIN" },
    precedingComments,
    newComment,
    newCommentAuthor
  );

  // Don't send any email to the author of the comment
  emailsSent.add(commentAuthorEmail);

  // Send to the code author
  if (!emailsSent.has(codeAuthor.email)) {
    await sendNewCommentEmail(
      codeAuthor,
      precedingComments,
      newComment,
      newCommentAuthor
    );
    emailsSent.add(codeAuthor.email);
  }

  // Send to the code committer
  if (!emailsSent.has(codeCommitter.email)) {
    await sendNewCommentEmail(
      codeCommitter,
      precedingComments,
      newComment,
      newCommentAuthor
    );
    emailsSent.add(codeCommitter.email);
  }

  // Go through commenters and send to each
  for (const comment of precedingComments) {
    const email = notNull(comment.github_user?.email ?? comment.author_email);
    if (!emailsSent.has(email)) {
      await sendNewCommentEmail(
        { email },
        precedingComments,
        newComment,
        newCommentAuthor
      );
      emailsSent.add(email);
    }
  }
}

async function sendNewCommentEmail(
  recipient: { name?: string; email: string },
  precedingComments: {
    id: string;
    author_email?: string | null | undefined;
    body: string;
    github_user?:
      | {
          email: string;
          github_name?: string | null | undefined;
          github_username: string;
          github_node_id: string;
        }
      | null
      | undefined;
  }[],
  newComment: {
    thread_id: string;
    author_github_node_id?: string | null | undefined;
    author_email?: string | null | undefined;
    body: string;
    created_at: Date;
    id: string;
  },
  newCommentAuthor:
    | {
        email: string;
        github_name?: string | null | undefined;
        github_username: string;
      }
    | null
    | undefined
) {
  const html = ReactDOMServer.renderToStaticMarkup(
    NewCommentEmail({
      newComment,
      newCommentAuthor,
    })
  );
  // notNull should be safe here since we should have either newCommentAuthor or newComment.author_email.
  const fromName = newCommentAuthor
    ? newCommentAuthor.github_name && newCommentAuthor.github_name.length > 0
      ? newCommentAuthor.github_name
      : `@${newCommentAuthor.github_username}`
    : notNull(newComment.author_email);

  // Note: We can't set the from address be the email address of the comment author since SendGrid only supports sending email from verified domains.
  // TODO do we need to set the subject to have the stuff after Re:?
  // Re threading emails, see
  //  - https://stackoverflow.com/questions/35521459/send-email-as-reply-to-thread
  //  - https://github.com/sendgrid/sendgrid-nodejs/issues/690
  await getSendgrid().send({
    to: recipient,
    from: {
      name: `${fromName} via Cuddlefish Comments`,
      email: CF_APP_EMAIL,
    },
    subject: `Re: ${emailSubject(precedingComments[0].body)}`,
    html,
    headers: {
      "In-Reply-To": commentIdToMessageId(
        precedingComments[precedingComments.length - 1].id
      ),
      References: precedingComments
        .map((comment) => commentIdToMessageId(comment.id))
        .join(" "),
      "Message-Id": commentIdToMessageId(newComment.id),
    },
  });
}

async function sendNewThreadEmails(
  codeAuthor: { name: string; email: string },
  codeCommitter: { name: string; email: string },
  repo: { owner: string; repo: string },
  thread: {
    id: string;
    original_commit_hash: string;
    original_file_path: string;
    original_line_number: number;
    github_repos: { repo_github_node_id: string }[];
  },
  newComment: {
    thread_id: string;
    author_github_node_id?: string | null | undefined;
    body: string;
    created_at: Date;
    id: string;
  },
  newCommentAuthor: {
    email: string;
    github_name?: string | null | undefined;
    github_username: string;
    access_token?: string | null | undefined;
  }
) {
  // Send an email to me
  await sendNewThreadEmail(
    { email: "sam@cuddlefish.app", name: "Sam ADMIN" },
    "admin",
    repo,
    thread,
    newComment,
    newCommentAuthor
  );

  // Send an email to the author
  if (newCommentAuthor.email !== codeAuthor.email) {
    await sendNewThreadEmail(
      codeAuthor,
      "author",
      repo,
      thread,
      newComment,
      newCommentAuthor
    );
  }

  // Send an email to the committer if different from author
  if (
    codeCommitter.email !== codeAuthor.email &&
    codeCommitter.email !== newCommentAuthor.email
  ) {
    await sendNewThreadEmail(
      codeCommitter,
      "committer",
      repo,
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
    author_github_node_id?: string | null | undefined;
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
  // TODO check common no-reply email patterns (eg 49699333+dependabot[bot]@users.noreply.github.com)
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
      email: CF_APP_EMAIL,
    },
    subject: emailSubject(newComment.body),
    html,
    headers: { "Message-Id": commentIdToMessageId(newComment.id) },
  });
}

function emailSubject(emailBody: string) {
  return `💬 ${truncate(emailBody.replaceAll("\n", " "), 100)}`;
}

export function commentIdToMessageId(id: string) {
  return `<comment_${id}@email.cuddlefish.app>`;
}

function truncate(str: string, len: number) {
  if (str.length <= len) {
    return str;
  } else {
    return str.substr(0, len) + "…";
  }
}
