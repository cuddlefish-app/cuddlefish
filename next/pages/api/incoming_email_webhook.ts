// See https://pkprosol.medium.com/sendgrid-inbound-parse-with-next-js-8cc9d0ad650c
import { gql } from "@apollo/client/core";
import { simpleParser } from "mailparser";
import multer from "multer";
import nc from "next-connect";
import {
  ADMIN_buildApolloClient,
  assert,
  assert400,
  isString,
  logHandlerErrors,
  notNull,
  notNull400,
} from "../../common_utils";
import { ADMIN_getOctokit, lookupUserByEmail } from "../../github";
import {
  EmailCommentMutation,
  EmailCommentMutationVariables,
  ThreadContainingCommentQuery,
  ThreadContainingCommentQueryVariables,
  UserCommentMutation,
  UserCommentMutationVariables,
} from "../../src/generated/admin-hasura-types";
import { CF_APP_EMAIL } from "./config";

export const config = { api: { bodyParser: false } };

function parseCuddlefishMessageId(s: string) {
  const parsed = /<comment_([^\s@]+)@email\.cuddlefish\.app>/.exec(s);
  return parsed !== null ? parsed[1] : null;
}

function parseEmail(s: string) {
  const parsed = /.*<([^\s@]+@[^\s@]+\.[^\s@]+)>/.exec(s);
  return parsed !== null ? parsed[1] : null;
}

const handler = nc()
  .use(multer().none())
  .post(
    logHandlerErrors(async (req, res) => {
      assert400(req.body.to === CF_APP_EMAIL, "bad to address");

      const emailRaw: string = req.body.email;
      const email = await simpleParser(emailRaw);

      // For example: Samuel Ainsworth <skainsworth@gmail.com>
      const fromEmailRaw = notNull400(email.from).text;
      const fromEmail = notNull400(parseEmail(fromEmailRaw));
      console.log(`Received email from ${fromEmail}`);

      // For example: <a8502bb8-6b65-4290-a2b0-144e65775682@email.cuddlefish.app>
      const inReplyToRaw = notNull400(email.inReplyTo);
      const inReplyTo = notNull400(parseCuddlefishMessageId(inReplyToRaw));
      console.log(`... in response to comment ${inReplyTo}`);

      // TODO there's probably other separators to look out for. Not sure why someone would ever forward an email to us.
      const emailText = notNull400(email.text)
        .split("---------- Forwarded message ---------")[0]
        .trim();

      // TODO lookup user in hasura first, since they may have OAuth logged in with us but set their email to be private on GitHub.
      // Lookup GitHub user for email address
      const githubUser = await lookupUserByEmail(ADMIN_getOctokit(), fromEmail);
      console.log(`... from GitHub user ${githubUser?.login}`);

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
      console.log(`... regarding thread ${threadId}`);

      // Insert comment in hasura for the thread corresponding to the comment id
      if (githubUser !== null) {
        assert(
          !isString(githubUser.email),
          "GitHub API seems to never return user emails for this query"
        );

        // Note that there are multiple constraints that could be violated when
        // upserting a user. Hasura only supports setting on_conflict.constraint
        // to a single constraint. It seem the constraint that actually gets hit
        // is users_github_email_key.
        const m = await apolloClient.mutate<
          UserCommentMutation,
          UserCommentMutationVariables
        >({
          mutation: gql`
            mutation UserComment(
              $threadId: uuid!
              $body: String!
              $email: String!
              $github_database_id: Int!
              $github_name: String
              $github_node_id: String!
              $github_username: String!
            ) {
              insert_comments_one(
                object: {
                  thread_id: $threadId
                  body: $body
                  github_user: {
                    data: {
                      email: $email
                      github_database_id: $github_database_id
                      github_name: $github_name
                      github_node_id: $github_node_id
                      github_username: $github_username
                    }
                    on_conflict: {
                      constraint: users_github_email_key
                      update_columns: [
                        email
                        github_database_id
                        github_name
                        github_node_id
                        github_username
                      ]
                    }
                  }
                }
              ) {
                id
              }
            }
          `,
          variables: {
            threadId,
            body: emailText,
            email: fromEmail,
            github_database_id: githubUser.id,
            github_name: githubUser.name,
            github_node_id: githubUser.node_id,
            github_username: githubUser.login,
          },
        });
        assert(m.errors === undefined, "hasura returned errors");
        const newCommentId = notNull(m.data?.insert_comments_one?.id);
        console.log(`Created comment ${newCommentId}`);
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
        console.log(`Created comment ${newCommentId}`);
      }

      res.status(200).send({});
    })
  );

export default handler;
