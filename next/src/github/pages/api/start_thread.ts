import { Octokit } from "@octokit/rest";
import { print } from "graphql";
import gql from "graphql-tag";
import { assert, notNull } from "../../../common_utils";
import {
  Start_Thread_CommitLookupQuery,
  Start_Thread_CommitLookupQueryVariables,
} from "../../../generated/github-types";

export async function commitIsPublic(
  octokit: Octokit,
  owner: string,
  repo: string,
  commit_hash: string
): Promise<boolean> {
  const variables: Start_Thread_CommitLookupQueryVariables = {
    owner,
    name: repo,
    commit_oid: commit_hash,
  };
  const q = await octokit.graphql<Start_Thread_CommitLookupQuery>(
    print(gql`
      query start_thread_CommitLookup(
        $owner: String!
        $name: String!
        $commit_oid: GitObjectID!
      ) {
        repository(owner: $owner, name: $name) {
          id
          databaseId
          isPrivate
          object(oid: $commit_oid) {
            # __typename helps make TS happy
            __typename
            ... on Commit {
              id
              oid
            }
          }
        }
      }
    `),
    variables
  );
  const repository = notNull(q.repository, "expected repository");

  const obj = repository.object;
  if (obj === null || obj === undefined) {
    // Couldn't find the repo or the commit
    return false;
  }
  assert(obj.__typename === "Commit", "expected Commit");

  // Only allow commenting on public repos for now
  return !repository.isPrivate;
}
