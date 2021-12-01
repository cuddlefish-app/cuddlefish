import { Octokit } from "@octokit/rest";
import { isRight } from "fp-ts/lib/Either";
import gql from "graphql-tag";
import * as t from "io-ts";
import { NextApiRequest } from "next";
import pino from "pino";
import { assert, notNull } from "../../src/common_utils";
import {
  StartThreadResponse,
  Start_Thread_AssociateCommitReposMutation,
  Start_Thread_AssociateCommitReposMutationVariables,
  Start_Thread_InsertThreadMutation,
  Start_Thread_InsertThreadMutationVariables,
  Start_Thread_LookupGhTokenQuery,
  Start_Thread_LookupGhTokenQueryVariables,
} from "../../src/generated/admin-hasura-types";
import { commitIsPublic } from "../../src/github/pages/api/start_thread";
import {
  ADMIN_buildApolloClient,
  assert400,
  hasCorrectApiSecret,
  logHandlerErrors,
} from "../../src/server/utils";

const RequestData = t.strict({
  session_variables: t.type({
    "x-hasura-role": t.literal("user"),
    "x-hasura-user-id": t.string,
  }),
  input: t.strict({
    repos: t.array(t.strict({ owner: t.string, repo: t.string })),
    commit_hash: t.string,
    file_path: t.string,
    line_number: t.number,
    body: t.string,
  }),
  action: t.strict({ name: t.literal("StartThread") }),
});

async function lookupUserGitHubAccessToken(github_node_id: string) {
  const q = await ADMIN_buildApolloClient().query<
    Start_Thread_LookupGhTokenQuery,
    Start_Thread_LookupGhTokenQueryVariables
  >({
    query: gql`
      query start_thread_LookupGHToken($github_node_id: String!) {
        github_users_by_pk(github_node_id: $github_node_id) {
          access_token
        }
      }
    `,
    variables: { github_node_id },
  });
  return notNull(q.data.github_users_by_pk?.access_token);
}

async function containingRepos(
  octokit: Octokit,
  repos: { owner: string; repo: string }[],
  commit_hash: string
) {
  // Note: This is shockingly slow, eg. 700ms on a single repo. Another
  // potentially faster way to do this is to first check if we have this commit
  // somewhere in hasura already which would imply that it exists on a public
  // repo.

  const mask = await Promise.all(
    repos.map(
      async (repo) =>
        await commitIsPublic(octokit, repo.owner, repo.repo, commit_hash)
    )
  );
  return repos.filter((_, i) => mask[i]);
}

async function associateCommitRepos(
  repoNodeIds: string[],
  commit_hash: string
) {
  // Note that at the moment we don't have any foreign key constraints on the
  // repo_github_node_id values, so this is safe. However if this changes in the
  // future we'll need to revisit this.
  const m = await ADMIN_buildApolloClient().mutate<
    Start_Thread_AssociateCommitReposMutation,
    Start_Thread_AssociateCommitReposMutationVariables
  >({
    mutation: gql`
      mutation start_thread_AssociateCommitRepos(
        $objects: [commit_github_repo_insert_input!]!
      ) {
        insert_commit_github_repo(
          objects: $objects
          on_conflict: {
            constraint: commit_github_repo_pkey
            update_columns: [commit_hash, repo_github_node_id]
          }
        ) {
          affected_rows
        }
      }
    `,
    variables: {
      objects: repoNodeIds.map((repoNodeId) => ({
        commit_hash: commit_hash,
        repo_github_node_id: repoNodeId,
      })),
    },
  });
  assert(m.errors === undefined, "expected no errors");
}

export default logHandlerErrors<StartThreadResponse>(async function (
  req: NextApiRequest,
  log: pino.Logger
) {
  // Verify request is coming from hasura or some other trusted source
  assert400(hasCorrectApiSecret(req), "incorrect api secret");

  assert400(req.method === "POST", "expected POST request");
  const decoded = RequestData.decode(req.body);
  assert400(isRight(decoded), "parse fail");
  const payload = decoded.right;

  // Line numbers are 1-indexed! juniper does not support unsigned integers.
  const userNodeId = payload.session_variables["x-hasura-user-id"];
  const commentBody = payload.input.body.trim();
  assert400(payload.input.line_number > 0, "expected positive line number");
  assert400(payload.input.repos.length > 0, "expected at least one repo");
  assert400(commentBody.length > 0, "expected non-empty body");
  log.info({ payload });

  const userGHToken = await lookupUserGitHubAccessToken(userNodeId);
  const octokit = new Octokit({ auth: userGHToken });

  // Find a public GitHub repo that contains the commit we're looking for. Don't
  // let people add threads on commits that don't exist/are private.
  const repos = await containingRepos(
    octokit,
    payload.input.repos,
    payload.input.commit_hash
  );
  log.info({ repos });
  assert400(
    repos.length > 0,
    "expected at least one public repo containing commit"
  );

  const repoNodeIds = await Promise.all(
    repos.map(
      async (repo) => (await octokit.repos.get({ ...repo })).data.node_id
    )
  );
  await associateCommitRepos(repoNodeIds, payload.input.commit_hash);

  const m = await ADMIN_buildApolloClient().mutate<
    Start_Thread_InsertThreadMutation,
    Start_Thread_InsertThreadMutationVariables
  >({
    mutation: gql`
      mutation start_thread_InsertThread(
        $commit_hash: String!
        $file_path: String!
        $line_number: Int!
        $body: String!
        $author_github_node_id: String!
      ) {
        # First, upsert the line info.
        insert_lines_one(
          object: {
            commit_hash: $commit_hash
            file_path: $file_path
            line_number: $line_number
          }
          on_conflict: {
            constraint: lines_pkey
            # TODO: This is a hack. This is the only way to do an upsert in hasura; we must update at least one field.
            update_columns: [commit_hash, file_path, line_number]
          }
        ) {
          commit_hash
          file_path
          line_number
        }

        # Next, insert the thread.
        insert_threads_one(
          object: {
            original_commit_hash: $commit_hash
            original_file_path: $file_path
            original_line_number: $line_number
            comments: {
              data: [
                { author_github_node_id: $author_github_node_id, body: $body }
              ]
            }
          }
        ) {
          id
          comments {
            id
          }
        }
      }
    `,
    variables: {
      commit_hash: payload.input.commit_hash,
      file_path: payload.input.file_path,
      line_number: payload.input.line_number,
      body: commentBody,
      author_github_node_id: userNodeId,
    },
  });
  assert(m.errors === undefined, "expected no errors");

  return { new_thread_id: notNull(m.data?.insert_threads_one?.id) };
});
