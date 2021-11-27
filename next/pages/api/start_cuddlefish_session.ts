import { Octokit } from "@octokit/rest";
import { isRight } from "fp-ts/lib/Either";
import gql from "graphql-tag";
import * as t from "io-ts";
import { NextApiRequest } from "next";
import { assert, notNull } from "../../src/common_utils";
import {
  StartCuddlefishSessionResponse,
  UpsertUserStartSessionMutation,
  UpsertUserStartSessionMutationVariables,
} from "../../src/generated/admin-hasura-types";
import {
  ADMIN_buildApolloClient,
  assert400,
  hasCorrectApiSecret,
  logHandlerErrors,
} from "../../src/server/utils";

const RequestData = t.strict({
  session_variables: t.type({
    // It's just more convenient to allow the `user` role to access this
    // endpoint, since the GQL codegen in the vscode extension is based on being
    // in the `user` role. So this just makes everything a little easier.
    "x-hasura-role": t.union([
      t.literal("admin"),
      t.literal("user"),
      t.literal("anonymous"),
    ]),
  }),
  input: t.strict({ github_access_token: t.string }),
  action: t.strict({
    name: t.union([
      // Currently it's StartCuddlefishSession2, but we're going to migrate to StartCuddlefishSession.
      t.literal("StartCuddlefishSession"),
      t.literal("StartCuddlefishSession2"),
    ]),
  }),
});

async function getPrimaryEmail(octokit: Octokit) {
  const emails = (
    await octokit.users.listEmailsForAuthenticatedUser()
  ).data.filter((x) => x.primary);
  assert(emails.length === 1, "expected exactly one primary email");
  return emails[0].email;
}

export default logHandlerErrors<StartCuddlefishSessionResponse>(async function (
  req: NextApiRequest
) {
  // Verify request is coming from hasura or some other trusted source
  assert400(hasCorrectApiSecret(req), "incorrect api secret");

  assert400(req.method === "POST", "expected POST request");
  const decoded = RequestData.decode(req.body);
  assert400(isRight(decoded), "parse fail");
  const payload = decoded.right;

  const githubAccessToken = payload.input.github_access_token;
  const octokit = new Octokit({ auth: githubAccessToken });
  const userInfo = await octokit.users.getAuthenticated();

  // Can't use `userInfo.email` as that can be null. See https://stackoverflow.com/questions/35373995/github-user-email-is-null-despite-useremail-scope.
  const email = await getPrimaryEmail(octokit);

  const apolloClient = ADMIN_buildApolloClient();
  const m = await apolloClient.mutate<
    UpsertUserStartSessionMutation,
    UpsertUserStartSessionMutationVariables
  >({
    mutation: gql`
      mutation UpsertUserStartSession(
        $githubNodeId: String!
        $githubDatabaseId: Int!
        $githubName: String
        $githubUsername: String!
        $email: String!
        $accessToken: String!
      ) {
        insert_github_users_one(
          object: {
            github_node_id: $githubNodeId
            github_database_id: $githubDatabaseId
            github_name: $githubName
            github_username: $githubUsername
            email: $email
            access_token: $accessToken
          }
          on_conflict: {
            constraint: users_github_id_key
            update_columns: [
              github_node_id
              github_database_id
              github_name
              github_username
              email
              access_token
            ]
          }
        ) {
          github_node_id
        }

        insert_user_sessions_one(
          object: { user_github_node_id: $githubNodeId }
        ) {
          id
        }
      }
    `,
    variables: {
      githubNodeId: userInfo.data.node_id,
      githubDatabaseId: userInfo.data.id,
      githubName: userInfo.data.name,
      githubUsername: userInfo.data.login,
      email,
      accessToken: payload.input.github_access_token,
    },
  });
  assert(m.errors === undefined, "hasura returned errors");

  return {
    session_token: notNull(m.data?.insert_user_sessions_one?.id),
  };
});
