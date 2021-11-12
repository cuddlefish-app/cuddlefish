// We need to separate out the files that hit hasura queries from with the
// anonymous role vs the user role for the sake of graphql-code-generator. Since
// most queries are with the user role, we exile the anonymous queries here.

import { ApolloClient, gql } from "@apollo/client/core";
import {
  StartCuddlefishSessionMutation,
  StartCuddlefishSessionMutationVariables,
} from "./generated/anonymous-hasura-types";
import { assert, notNull } from "./utils";

export async function startCuddlefishSession<Cache>(
  client: ApolloClient<Cache>,
  githubAccessToken: string
): Promise<string> {
  const m = await client.mutate<
    StartCuddlefishSessionMutation,
    StartCuddlefishSessionMutationVariables
  >({
    mutation: gql`
      mutation StartCuddlefishSession($githubAccessToken: String!) {
        StartCuddlefishSession2(github_access_token: $githubAccessToken) {
          session_token
        }
      }
    `,
    variables: { githubAccessToken },
  });
  assert(m.errors === undefined, "graphql errors");
  return notNull(m.data).StartCuddlefishSession2.session_token;
}
