// This stuff can't live in pages/api/* since that's graphql-codegen is run on
// all gql tags in those files against the hasura schema.

import { gql } from "@apollo/client/core";
import { Octokit } from "@octokit/rest";
import { print } from "graphql/language/printer";

export async function lookupRepoByNodeId(
  octokit: Octokit,
  nodeId: string
): Promise<{ owner: string; repo: string }> {
  // TODO generate graphql types for this
  // TODO use io-ts to validate the response
  // TODO write some tests for this, since it's esp. risky without types
  // At the time of writing (11/5/2021), the GH graphql api doesn't offer much
  // info about the commit (author, etc). Still gotta use the rest api for that.
  const {
    node: {
      owner: { login },
      name,
    },
  } = await octokit.graphql(
    print(gql`
      query LookupRepoByNodeId($nodeId: ID!) {
        node(id: $nodeId) {
          ... on Repository {
            owner {
              id
              login
            }
            name
          }
        }
      }
    `),
    { nodeId }
  );
  return { owner: login, repo: name };
}

// See https://stackoverflow.com/questions/44888187/get-github-username-through-primary-email
export async function lookupUserByEmail(octokit: Octokit, email: string) {
  const res = await octokit.search.users({ q: email });
  for (const user of res.data.items) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}
