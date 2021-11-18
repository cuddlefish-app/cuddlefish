import { Octokit } from "@octokit/rest";
import gql from "graphql-tag";
import { assert } from "../common_utils";
import {
  LookupUsersByEmailQuery,
  LookupUsersByEmailQueryVariables,
  UpsertUsersMutation,
  UpsertUsersMutationVariables,
} from "../generated/admin-hasura-types";
import {
  ADMIN_getOctokit,
  lookupGitHubUsersByEmail,
  mostActiveGitHubUser,
} from "./github";
import { ADMIN_buildApolloClient } from "./utils";

async function lookupSingleHasuraUserByEmail(octokit: Octokit, email: string) {
  const q = await ADMIN_buildApolloClient().query<
    LookupUsersByEmailQuery,
    LookupUsersByEmailQueryVariables
  >({
    query: gql`
      query LookupUsersByEmail($email: String!) {
        github_users(where: { email: { _eq: $email } }) {
          github_node_id
          github_database_id
          github_username
        }
      }
    `,
    variables: { email },
  });
  assert(q.error === undefined, "expected no error");
  assert(q.errors === undefined || q.errors.length === 0, "expected no error");
  assert(q.data !== undefined, "expected data");
  assert(q.data.github_users !== undefined, "expected data.github_users");

  if (q.data.github_users.length === 0) {
    return null;
  } else {
    const ix = await mostActiveGitHubUser(
      octokit,
      q.data.github_users.map((u) => u.github_username)
    );
    return q.data.github_users[ix];
  }
}

export async function ADMIN_lookupsertGitHubUsersByEmail(email: string) {
  const users = await lookupGitHubUsersByEmail(ADMIN_getOctokit(), email);
  // Note that there are multiple constraints that could be violated when
  // upserting a user. Hasura only supports setting on_conflict.constraint
  // to a single constraint. It seem the constraint that actually gets hit
  // is users_github_node_id_key.
  // TODO check that this is actually the constraint that gets hit.
  const m = await ADMIN_buildApolloClient().mutate<
    UpsertUsersMutation,
    UpsertUsersMutationVariables
  >({
    mutation: gql`
      mutation UpsertUsers($users: [github_users_insert_input!]!) {
        insert_github_users(
          objects: $users
          on_conflict: {
            constraint: users_github_id_key
            update_columns: [
              email
              github_database_id
              github_node_id
              github_username
            ]
          }
        ) {
          affected_rows
        }
      }
    `,
    variables: {
      users: users.map((u) => ({
        email,
        github_database_id: u.id,
        github_node_id: u.node_id,
        github_username: u.login,
        github_name: u.name,
      })),
    },
  });
  assert(m.errors === undefined || m.errors.length === 0, "expected no error");
  return users;
}

export async function ADMIN_lookupsertSingleGitHubUserByEmail(email: string) {
  const users = await ADMIN_lookupsertGitHubUsersByEmail(email);
  if (users.length === 0) {
    return null;
  } else {
    const ix = await mostActiveGitHubUser(
      ADMIN_getOctokit(),
      users.map((u) => u.login)
    );
    return users[ix];
  }
}

/**
 * Find a user by their email address. First check Hasura, then GitHub. Upserts
 * them into Hasura as well.
 * @param octokit
 * @param email
 * @returns
 */
export async function ADMIN_lookupsertSingleUserByEmail(
  email: string
): Promise<{
  nodeId: string;
  databaseId: number;
  login: string;
} | null> {
  const hasuraUser = await lookupSingleHasuraUserByEmail(
    ADMIN_getOctokit(),
    email
  );
  if (hasuraUser !== null) {
    return {
      nodeId: hasuraUser.github_node_id,
      databaseId: hasuraUser.github_database_id,
      login: hasuraUser.github_username,
    };
  }

  // If we didn't find a user in Hasura, try looking them up in GitHub.
  const githubUser = await ADMIN_lookupsertSingleGitHubUserByEmail(email);
  if (githubUser !== null) {
    return {
      nodeId: githubUser.node_id,
      databaseId: githubUser.id,
      login: githubUser.login,
    };
  }

  // Couldn't find a user in Hasura or GitHub.
  return null;
}
