// This stuff can't live in pages/api/* since that's graphql-codegen is run on
// all gql tags in those files against the hasura schema.

import { gql } from "@apollo/client/core";
import { Octokit } from "@octokit/rest";
import { print } from "graphql/language/printer";
import { assert, assertNotNull, notNull } from "../common_utils";
import {
  Gh_CommitLookupQuery,
  Gh_CommitLookupQueryVariables,
  Gh_LookupRepoByNodeIdQuery,
  Gh_LookupUserByNodeIdQuery,
  Gh_LookupUsersByEmailQuery,
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
  const q = await octokit.graphql<Gh_LookupRepoByNodeIdQuery>(
    print(gql`
      query gh_LookupRepoByNodeId($nodeId: ID!) {
        node(id: $nodeId) {
          ... on Repository {
            # __typename is necessary to keep the type checker happy
            __typename
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
  const q = await octokit.graphql<Gh_LookupUserByNodeIdQuery>(
    print(gql`
      query gh_LookupUserByNodeId($nodeId: ID!) {
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
): Promise<
  Array<{
    login: string;
    nodeId: string;
    databaseId: number;
    name?: string | null;
  }>
> {
  // Notes:
  // - GitHub does not require email addresses to be unique. For example,
  //   @drshrey and @shreyasjag.
  // - `octokit.search.users` doesn't work with emails that include '+'. Doesn't
  //   work with encodeURIComponent, wrapping in quotes, or %2B either.
  // - The GraphQL API works with '+'.
  const q = await octokit.graphql<Gh_LookupUsersByEmailQuery>(
    print(gql`
      query gh_LookupUsersByEmail($email: String!) {
        search(query: $email, type: USER, first: 100) {
          nodes {
            __typename
            ... on User {
              databaseId
              id
              login
              name
            }
          }
        }
      }
    `),
    { email }
  );
  assertNotNull(q.search.nodes);

  // Unfortunately TS type inference is not smart enough to do this yet, so we're stuck with a for loop :/
  // return q.search.nodes.filter((x) => x.__typename === "User");

  const res = [];
  for (const node of q.search.nodes) {
    if (node?.__typename === "User") {
      // Notes:
      // - `databaseId` is actually an optional field in the schema, but it's
      // always present AFAICT.
      // - `name` will be null when the user does not have a public name.
      res.push({
        databaseId: notNull(node.databaseId),
        nodeId: node.id,
        login: node.login,
        name: node.name,
      });
    }
  }
  return res;
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
  const variables: Gh_CommitLookupQueryVariables = {
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
  const q = await octokit.graphql<Gh_CommitLookupQuery>(
    print(gql`
      query gh_CommitLookup(
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
