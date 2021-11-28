// See https://pkprosol.medium.com/sendgrid-inbound-parse-with-next-js-8cc9d0ad650c
import { gql } from "@apollo/client/core";
import basicAuth from "basic-auth";
import { simpleParser } from "mailparser";
import multer from "multer";
import nc from "next-connect";
import replyParser from "node-email-reply-parser";
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
  assert400,
  logHandlerErrors,
  notNull400,
} from "../../src/server/utils";

export const config = { api: { bodyParser: false } };

function parseCuddlefishMessageId(s: string): string | null {
  const parsed = /<comment_([^\s@]+)@email\.cuddlefish\.app>/.exec(s);
  return parsed !== null ? parsed[1] : null;
}

// It seems that the email parser already pulls these values out. Leaving this
// here for now in case the email parser library breaks.
// function parseEmail(s: string): string | null {
//   const parsed = /.*<([^\s@]+@[^\s@]+\.[^\s@]+)>/.exec(s);
//   return parsed !== null ? parsed[1] : null;
// }

const handler = nc()
  .use(multer().none())
  .post(
    logHandlerErrors(async (req, log) => {
      // Check HTTP Basic auth
      {
        const { name, pass } = notNull400(basicAuth(req));
        assert400(name === "sendgrid", "bad auth");
        assert400(pass === notNull(process.env.API_SECRET), "bad auth");
      }

      const emailRaw: string = req.body.email;
      const email = await simpleParser(emailRaw);
      log.info({ email });

      // fromEmailRaw example: Samuel Ainsworth <foo@bar.com>
      // const fromEmailRaw = notNull400(email.from).text;
      // const fromEmail = notNull400(parseEmail(fromEmailRaw));

      // When could email.from ever have multiple values?
      assert(
        email.from?.value.length === 1,
        "expected exactly one from address"
      );
      // fromEmail example: foo@bar.com
      const fromEmail = notNull400(email.from?.value[0].address);
      log.info({ fromEmail });

      // It's possible that the user email replies to their own email reply.
      // That first email will have a random, uncontrollable message id. Then
      // when the user replies to their own email, the in-reply-to will be sad.
      const commentId = notNull400(
        (() => {
          // inReplyToRaw example: <comment_a8502bb8-6b65-4290-a2b0-144e65775682@email.cuddlefish.app>
          const inReplyToRaw = notNull400(email.inReplyTo);
          const inReplyTo = parseCuddlefishMessageId(inReplyToRaw);
          if (inReplyTo !== null) {
            log.info({ inReplyTo });
            return inReplyTo;
          } else {
            log.info({ references: email.references });
            // Note: doesn't make much sense to use `isString` here since it
            // doesn't play nice with type inference.
            if (typeof email.references === "string") {
              // It seems that we receive a string when there is exactly one
              // reference :/
              return parseCuddlefishMessageId(email.references);
            } else if (Array.isArray(email.references)) {
              return email.references
                .map((s) => parseCuddlefishMessageId(s))
                .find((s) => s !== null);
            } else {
              log.info("email.references was not a string or string[]");
              return null;
            }
          }
        })(),
        "could not find a comment id in email in-reply-to or references"
      );

      const emailText = replyParser(
        notNull400(email.text, "expected email.text")
      )
        .getVisibleText()
        .trim();
      log.info({ emailText });

      // Note: this returns null if we can't find anyone with that email.
      const githubUser = await ADMIN_lookupsertSingleUserByEmail(fromEmail);
      log.info({ githubUser });

      // Lookup comment id to get thread id in hasura
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
        variables: { commentId },
      });
      assert(q1.error === undefined, "hasura returned errors");
      assert(q1.errors === undefined, "hasura returned errors");
      const threadId = notNull(
        q1.data.comments_by_pk,
        "could not find thread id"
      ).thread_id;
      log.info({ threadId });

      // Insert comment in hasura for the thread corresponding to the comment
      // id. Note that the author is guaranteed to exist in `github_users` since
      // `ADMIN_lookupsertSingleUserByEmail` does an upsert for us.
      if (githubUser !== null) {
        log.info({ authorType: "github_user" });
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
        log.info({ newCommentId });
      } else {
        log.info({ authorType: "email" });
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
        log.info({ newCommentId });
      }

      return {};
    })
  );

export default handler;
