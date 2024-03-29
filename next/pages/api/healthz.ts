import { gql } from "@apollo/client/core";
import axios from "axios";
import axiosRetry from "axios-retry";
import type { NextApiRequest } from "next";
import { assert, notNull } from "../../src/common_utils";
import {
  ADMIN_buildApolloClient,
  assert400,
  logHandlerErrors,
} from "../../src/server/utils";

// See https://stackoverflow.com/questions/56074531/how-to-retry-5xx-requests-using-axios
axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay });

// Put individual checks into their own functions so that it's easier to
// identify what's failing from stack traces.

async function checkSendgrid() {
  // Confirm that our Sendgrid API key is valid. `setApiKey` sadly doesn't do this for us.
  // See https://stackoverflow.com/questions/61658558/how-to-test-sendgrid-api-key-is-valid-or-not-without-sending-emails
  await axios.get("https://api.sendgrid.com/v3/scopes", {
    headers: {
      Authorization: `Bearer ${notNull(process.env.SENDGRID_API_KEY)}`,
    },
  });
}

async function checkHasura() {
  // Confirm that we can reach the Hasura GraphQL endpoint
  const hasuraResponse = await ADMIN_buildApolloClient().query({
    query: gql`
      query {
        __typename
      }
    `,
  });
  assert(hasuraResponse.error === undefined, "expected no error");
  assert(
    hasuraResponse.errors === undefined || hasuraResponse.errors.length === 0,
    "expected no error"
  );
}

export default logHandlerErrors(async (req: NextApiRequest) => {
  assert400(req.method === "GET", "GET only");

  // Check that we have the requisite env vars
  notNull(process.env.HASURA_HOST, "expected HASURA_HOST");
  notNull(process.env.HASURA_PORT, "expected HASURA_PORT");
  notNull(
    process.env.HASURA_GRAPHQL_ADMIN_SECRET,
    "expected HASURA_GRAPHQL_ADMIN_SECRET"
  );
  notNull(process.env.API_SECRET, "expected API_SECRET");
  notNull(process.env.SENDGRID_API_KEY, "expected SENDGRID_API_KEY");
  notNull(process.env.GITHUB_API_TOKEN, "expected GITHUB_API_TOKEN");

  // TODO check that GITHUB_API_TOKEN is valid
  // TODO check that we reach the Hasura /healthz endpoint

  await checkSendgrid();
  await checkHasura();

  return { NODE_ENV: process.env.NODE_ENV, processVersions: process.versions };
});
