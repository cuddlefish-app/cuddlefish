import { Octokit } from "@octokit/rest";
import { isRight } from "fp-ts/lib/Either";
import gql from "graphql-tag";
import * as t from "io-ts";
import { NextApiRequest, NextApiResponse } from "next";
import {
  ADMIN_buildApolloClient,
  assert,
  assert400,
  logHandlerErrors,
  notNull,
} from "../../src/common_utils";
import {
  StartCuddlefishSessionResponse,
  UpsertUserStartSessionMutation,
  UpsertUserStartSessionMutationVariables,
} from "../../src/generated/admin-hasura-types";
import { hasCorrectApiSecret } from "../../src/server_utils";

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

export default logHandlerErrors(async function (
  req: NextApiRequest,
  res: NextApiResponse<StartCuddlefishSessionResponse>
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
        $email: String
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
      email: userInfo.data.email,
      accessToken: payload.input.github_access_token,
    },
  });
  assert(m.errors === undefined, "hasura returned errors");

  res.status(200).json({
    session_token: notNull(m.data?.insert_user_sessions_one?.id),
  });
});
