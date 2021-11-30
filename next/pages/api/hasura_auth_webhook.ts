import gql from "graphql-tag";
import type { NextApiRequest } from "next";
import { assert, notNull } from "../../src/common_utils";
import {
  LookupSessionQuery,
  LookupSessionQueryVariables,
} from "../../src/generated/admin-hasura-types";
import {
  ADMIN_buildApolloClient,
  assert400,
  logHandlerErrors,
} from "../../src/server/utils";

// We use Hasura webhook authentication. See https://hasura.io/docs/latest/graphql/core/auth/authentication/webhook.html
// for more info. For every incoming request to Hasura, Hasura sends a request to our webhook with the request headers.
// We respond with { "X-Hasura-User-Id": "<github_node_id>", "X-Hasura-Role": "user" } for authenticated users and
// { "X-Hasura-Role": "anonymous" } for anonymous requests.

export default logHandlerErrors(async (req: NextApiRequest) => {
  assert400(req.method === "GET", "GET only");

  const authHeader = req.headers.authorization;
  if (authHeader === undefined) {
    return { "X-Hasura-Role": "anonymous" };
  } else {
    const [authType, cfSessionToken] = authHeader.split(" ");
    assert400(authType === "Bearer", "Bearer only");
    const q = await ADMIN_buildApolloClient().query<
      LookupSessionQuery,
      LookupSessionQueryVariables
    >({
      query: gql`
        query LookupSession($session_token: uuid!) {
          user_sessions_by_pk(id: $session_token) {
            user_github_node_id
          }
        }
      `,
      variables: { session_token: cfSessionToken },
    });
    assert(q.error === undefined, "expected no error");
    assert(q.errors === undefined, "expected no errors");
    return {
      "X-Hasura-User-Id": notNull(q.data.user_sessions_by_pk)
        .user_github_node_id,
      "X-Hasura-Role": "user",
    };
  }
});
