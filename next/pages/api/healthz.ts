import { gql } from "@apollo/client/core";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  ADMIN_buildApolloClient,
  assert,
  assert400,
  logHandlerErrors,
  notNull,
} from "../../common_utils";

export default logHandlerErrors(
  async (req: NextApiRequest, res: NextApiResponse<{}>) => {
    assert400(req.method === "GET", "GET only");

    // Check that we have the requisite env vars
    notNull(process.env.HASURA_GRAPHQL_URL);
    notNull(process.env.HASURA_ADMIN_SECRET);
    notNull(process.env.API_SECRET);
    notNull(process.env.SENDGRID_API_KEY);
    notNull(process.env.GITHUB_API_TOKEN);

    // Confirm that our Sendgrid API key is valid. `setApiKey` sadly doesn't do this for us.
    // See https://stackoverflow.com/questions/61658558/how-to-test-sendgrid-api-key-is-valid-or-not-without-sending-emails
    await axios.get("https://api.sendgrid.com/v3/scopes", {
      headers: {
        Authorization: `Bearer ${notNull(process.env.SENDGRID_API_KEY)}`,
      },
    });

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

    // TODO check that we reach the Hasura /healthz endpoint

    res.status(200).json({
      NODE_ENV: process.env.NODE_ENV,
    });
  }
);