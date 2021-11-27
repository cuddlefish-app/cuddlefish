// See https://pkprosol.medium.com/sendgrid-inbound-parse-with-next-js-8cc9d0ad650c
import { gql } from "@apollo/client/core";
import { simpleParser } from "mailparser";
import multer from "multer";
import nc from "next-connect";
import { assert, notNull } from "../../src/common_utils";
import {
  EmailCommentMutation,
  EmailCommentMutationVariables,
  ThreadContainingCommentQuery,
  ThreadContainingCommentQueryVariables,
  UserCommentMutation,
  UserCommentMutationVariables,
} from "../../src/generated/admin-hasura-types";
import { ADMIN_lookupsertSingleUserByEmail } from "../../src/server/users";
import {
  ADMIN_buildApolloClient,
  logHandlerErrors,
  notNull400,
} from "../../src/server/utils";

export const config = { api: { bodyParser: false } };

function parseCuddlefishMessageId(s: string): string | null {
  const parsed = /<comment_([^\s@]+)@email\.cuddlefish\.app>/.exec(s);
  return parsed !== null ? parsed[1] : null;
}

function parseEmail(s: string): string | null {
  const parsed = /.*<([^\s@]+@[^\s@]+\.[^\s@]+)>/.exec(s);
  return parsed !== null ? parsed[1] : null;
}

const handler = nc()
  .use(multer().none())
  .post(
    logHandlerErrors(async (req, log) => {
      // assert400(req.body.to === CF_APP_EMAIL, "bad to address");

      const emailRaw: string = req.body.email;
      const email = await simpleParser(emailRaw);

      // For example: Samuel Ainsworth <skainsworth@gmail.com>
      const fromEmailRaw = notNull400(email.from).text;
      const fromEmail = notNull400(parseEmail(fromEmailRaw));
      log.info(`Received email from ${fromEmail}`);

      // For example: <comment_a8502bb8-6b65-4290-a2b0-144e65775682@email.cuddlefish.app>
      const inReplyToRaw = notNull400(email.inReplyTo);
      const inReplyTo = notNull400(parseCuddlefishMessageId(inReplyToRaw));
      log.info(`... in response to comment ${inReplyTo}`);

      // TODO there's probably other separators to look out for. Not sure why someone would ever forward an email to us.
      const emailText = notNull400(email.text)
        .split("---------- Forwarded message ---------")[0]
        .trim();

      // Note: this returns null if we can't find anyone with that email.
      const githubUser = await ADMIN_lookupsertSingleUserByEmail(fromEmail);
      log.info(`... from GitHub user ${githubUser?.login}`);

      // Lookup inReplyTo comment id in hasura
      const apolloClient = ADMIN_buildApolloClient();
      const q1 = await apolloClient.query<
        ThreadContainingCommentQuery,
        ThreadContainingCommentQueryVariables
      >({
        query: gql`
          query ThreadContainingComment($commentId: uuid!) {
            comments_by_pk(id: $commentId) {
              thread_id
            }
          }
        `,
        variables: {
          commentId: inReplyTo,
        },
      });
      assert(q1.error === undefined, "hasura returned errors");
      assert(q1.errors === undefined, "hasura returned errors");
      const threadId = notNull(q1.data.comments_by_pk).thread_id;
      log.info(`... regarding thread ${threadId}`);

      // Insert comment in hasura for the thread corresponding to the comment
      // id. Note that the author is guaranteed to exist in `github_users` since
      // `ADMIN_lookupsertSingleUserByEmail` does an upsert for us.
      if (githubUser !== null) {
        const m = await apolloClient.mutate<
          UserCommentMutation,
          UserCommentMutationVariables
        >({
          mutation: gql`
            mutation UserComment(
              $threadId: uuid!
              $body: String!
              $author_github_node_id: String!
            ) {
              insert_comments_one(
                object: {
                  thread_id: $threadId
                  body: $body
                  author_github_node_id: $author_github_node_id
                }
              ) {
                id
              }
            }
          `,
          variables: {
            threadId,
            body: emailText,
            author_github_node_id: githubUser.nodeId,
          },
        });
        assert(m.errors === undefined, "hasura returned errors");
        const newCommentId = notNull(m.data?.insert_comments_one?.id);
        log.info(`Created comment ${newCommentId}`);
      } else {
        const m = await apolloClient.mutate<
          EmailCommentMutation,
          EmailCommentMutationVariables
        >({
          mutation: gql`
            mutation EmailComment(
              $threadId: uuid!
              $body: String!
              $authorEmail: String!
            ) {
              insert_comments_one(
                object: {
                  thread_id: $threadId
                  body: $body
                  author_email: $authorEmail
                }
              ) {
                id
              }
            }
          `,
          variables: {
            threadId,
            authorEmail: fromEmail,
            body: emailText,
          },
        });
        assert(m.errors === undefined, "hasura returned errors");
        const newCommentId = notNull(m.data?.insert_comments_one?.id);
        log.info(`Created comment ${newCommentId}`);
      }

      return {};
    })
  );

export default handler;
