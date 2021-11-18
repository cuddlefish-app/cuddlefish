import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import * as _sendgrid from "@sendgrid/mail";
import { NextApiRequest, NextApiResponse } from "next";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";
import { notNull, _assert, _assertNotNull, _notNull } from "../common_utils";

const LOGGER = pino();

// Never error in the module scope. See https://github.com/vercel/next.js/issues/31046.
export function getSendgrid() {
  _sendgrid.setApiKey(notNull(process.env.SENDGRID_API_KEY));
  return _sendgrid;
}

export function hasCorrectApiSecret(req: NextApiRequest) {
  return req.headers["x-api-secret"] === notNull(process.env.API_SECRET);
}

export function ADMIN_buildApolloClient() {
  const hasuraHost = notNull(process.env.HASURA_HOST);
  const hasuraPort = notNull(process.env.HASURA_PORT);
  const uri = `http://${hasuraHost}:${hasuraPort}/v1/graphql`;

  // See https://www.apollographql.com/docs/react/networking/authentication/#header
  // See https://github.com/apollographql/apollo-client/issues/8967 as to why
  // we can't do this the simple way.
  const authLink = setContext((_operation, previousContext) => ({
    ...previousContext,
    headers: {
      ...previousContext.headers,
      "x-hasura-admin-secret": notNull(process.env.HASURA_GRAPHQL_ADMIN_SECRET),
    },
  }));
  return new ApolloClient({
    link: ApolloLink.from([authLink, new HttpLink({ uri, fetch })]),
    cache: new InMemoryCache(),
  });
}

// See https://stackoverflow.com/questions/31626231/custom-error-class-in-typescript
export class Error400 extends Error {
  constructor(message: string) {
    super(message);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, Error400.prototype);

    return this;
  }
}

export function assert400(
  condition: boolean,
  message: string
): asserts condition {
  _assert(Error400, condition, message);
}
export function assertNotNull400<T>(v: T | null | undefined): asserts v is T {
  _assertNotNull(Error400, v);
}
export function notNull400<T>(v: T | null | undefined, message?: string) {
  return _notNull(Error400, v, message);
}

export function logHandlerErrors<T>(
  handler: (req: NextApiRequest, logger: pino.Logger) => Promise<T>
): (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void> {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    const reqlogger = LOGGER.child({ requestId: uuidv4() });

    reqlogger.info({ req }, `--> ${req.method} ${req.url}`);
    const t0 = process.hrtime.bigint();
    try {
      const resBody = await handler(req, reqlogger);
      res.status(200).json(resBody);

      const elapsedNanos = process.hrtime.bigint() - t0;
      const elapsedMillis = elapsedNanos / 1000000n;
      reqlogger.info(
        { status: 200, resBody, elapsedNanos, elapsedMillis },
        `<-- ${req.method} ${req.url} 200 ${elapsedMillis} ms`
      );
    } catch (err) {
      reqlogger.error(err);

      if (err instanceof Error400) {
        // We have to cast to any because we promised to return a T.
        res.status(400).send("bad request" as any);

        const elapsedNanos = process.hrtime.bigint() - t0;
        const elapsedMillis = elapsedNanos / 1000000n;
        reqlogger.info(
          { status: 400, elapsedNanos, elapsedMillis },
          `<-- ${req.method} ${req.url} 400 ${elapsedMillis} ms`
        );
      } else {
        res.status(500).send("internal server error" as any);

        const elapsedNanos = process.hrtime.bigint() - t0;
        const elapsedMillis = elapsedNanos / 1000000n;
        reqlogger.info(
          { status: 500, elapsedNanos, elapsedMillis },
          `<-- ${req.method} ${req.url} 500 ${elapsedMillis} ms`
        );
      }
    }
  };
}
