// This stuff can't live in pages/api/* since that's graphql-codegen is run on
// all gql tags in those files against the hasura schema.

import { gql } from "@apollo/client/core";
import { Octokit } from "@octokit/rest";
import { print } from "graphql/language/printer";
import { assert, assertNotNull, notNull } from "../common_utils";
import {
  CommitLookupQuery,
  CommitLookupQueryVariables,
  LookupRepoByNodeIdQuery,
  LookupUserByNodeIdQuery,
} from "../generated/github-types";

export function ADMIN_getOctokit() {
  return new Octokit({ auth: notNull(process.env.GITHUB_API_TOKEN) });
}

export async function lookupRepoByNodeId(
  octokit: Octokit,
  nodeId: string
): Promise<{ owner: string; repo: string }> {
  // TODO write some tests for this
  // At the time of writing (11/5/2021), the GH graphql api doesn't offer much
  // info about the commit (author, etc). Still gotta use the rest api for that.
  const q = await octokit.graphql<LookupRepoByNodeIdQuery>(
    print(gql`
      query LookupRepoByNodeId($nodeId: ID!) {
        node(id: $nodeId) {
          ... on Repository {
            owner {
              login
            }
            name
          }
        }
      }
    `),
    { nodeId }
  );
  assertNotNull(q.node);
  assert(q.node.__typename === "Repository", "expected Repository");
  return { owner: q.node.owner.login, repo: q.node.name };
}

export async function lookupGitHubUserByNodeId(
  octokit: Octokit,
  nodeId: string
): Promise<{
  id: string;
  databaseId?: number | null | undefined;
  login: string;
}> {
  const q = await octokit.graphql<LookupUserByNodeIdQuery>(
    print(gql`
      query LookupUserByNodeId($nodeId: ID!) {
        node(id: $nodeId) {
          ... on User {
            id
            databaseId
            login
            email
          }
        }
      }
    `),
    { nodeId }
  );
  assertNotNull(q.node);
  assert(q.node.__typename === "User", "expected User");
  return q.node;
}

// See https://stackoverflow.com/questions/44888187/get-github-username-through-primary-email
export async function lookupGitHubUsersByEmail(
  octokit: Octokit,
  email: string
) {
  // GitHub does not seem to support searching on partial emails/modifications
  // of emails, which is exactly what we want.
  const res = await octokit.search.users({ q: email });
  // Note: It's possible that there are multiple users with the same email. For
  // example, @drshrey and @shreyasjag.
  return res.data.items;
}

/**
 *
 * @param octokit
 * @param logins
 * @returns The index of the most active user in the list.
 */
export async function mostActiveGitHubUser(
  octokit: Octokit,
  logins: string[]
): Promise<number> {
  assert(logins.length > 0, "expected at least one login");

  if (logins.length === 1) {
    // If there's only one user, then it's the most active. No need to make any
    // network requests.
    return 0;
  } else {
    // Pick the user with the most public activity (recently within the default
    // GitHub event window).
    const userActivity = await Promise.all(
      logins.map((login) =>
        octokit.activity
          .listPublicEventsForUser({ username: login })
          .then((res) => res.data.length)
      )
    );
    return userActivity.indexOf(Math.max(...userActivity));
  }
}

/**
 * Mostly just used for testing. Use `ADMIN_lookupsertSingleGitHubUserByEmail`
 * instead.
 * @param octokit
 * @param email
 * @returns
 */
export async function lookupSingleGitHubUserByEmail(
  octokit: Octokit,
  email: string
) {
  const users = await lookupGitHubUsersByEmail(octokit, email);
  if (users.length === 0) {
    return null;
  } else {
    const ix = await mostActiveGitHubUser(
      octokit,
      users.map((u) => u.login)
    );
    return users[ix];
  }
}

export async function lookupCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  commitHash: string
) {
  const variables: CommitLookupQueryVariables = {
    owner,
    name: repo,
    commitHash,
  };

  // Asking for the email field on users requires either 'user:email' or
  // 'read:user' scopes. A little odd considering those scopes cover the user's
  // own email. Querying other users' emails either returns the email or an
  // empty string.

  // Example insufficient scope error:
  //
  //   GraphqlResponseError: Request failed due to following response errors:
  //   - Your token has not been granted the required scopes to execute this
  //     query. The 'email' field requires one of the following scopes:
  //     ['user:email', 'read:user'], but your token has only been granted the:
  //     [''] scopes. Please modify your token's scopes at:
  //     https://github.com/settings/tokens.
  const q = await octokit.graphql<CommitLookupQuery>(
    print(gql`
      query CommitLookup(
        $owner: String!
        $name: String!
        $commitHash: GitObjectID!
      ) {
        repository(owner: $owner, name: $name) {
          object(oid: $commitHash) {
            __typename
            ... on Commit {
              authors(first: 100) {
                nodes {
                  name
                  email
                  user {
                    id
                    login
                    email
                  }
                }
              }
              committer {
                name
                email
                user {
                  id
                  login
                  email
                }
              }
            }
          }
        }
      }
    `),
    variables
  );
  const obj = notNull(q.repository?.object);
  assert(obj.__typename === "Commit", "expected Commit");

  // TODO could use io-ts here

  // Note: can't do eta conversion here since notNull accepts an optional
  // message argument.
  const authors = notNull(obj.authors.nodes)
    .map((a) => notNull(a))
    .map((a) => ({
      name: notNull(a.name),
      email: notNull(a.email),
      user: a.user,
    }));
  assert(authors.length > 0, "we should always have at least one author");
  const committer = notNull(obj.committer);
  return {
    firstAuthor: authors[0],
    coauthors: authors.slice(1),
    committer: {
      name: notNull(committer.name),
      email: notNull(committer.email),
      user: committer.user,
    },
  };
}
