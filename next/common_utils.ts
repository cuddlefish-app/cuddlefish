import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import { NextApiRequest, NextApiResponse } from "next";

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

// See https://github.com/Microsoft/TypeScript/issues/7556.
type ErrorT = { new (message: string): Error };
function _assert(
  errorType: ErrorT,
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new errorType(message);
  }
}

// See https://github.com/microsoft/TypeScript/issues/46702 and https://github.com/microsoft/TypeScript/issues/46699 as to why we can't have nice things.
export function assert(condition: boolean, message: string): asserts condition {
  _assert(Error, condition, message);
}
export function assert400(
  condition: boolean,
  message: string
): asserts condition {
  _assert(Error400, condition, message);
}

function _assertNotNull<T>(
  errorType: ErrorT,
  v: T | null | undefined
): asserts v is T {
  _assert(
    errorType,
    !(v === null || v === undefined),
    "Expected non-null, non-undefined"
  );
}

export function assertNotNull<T>(v: T | null | undefined): asserts v is T {
  _assertNotNull(Error, v);
}
export function assertNotNull400<T>(v: T | null | undefined): asserts v is T {
  _assertNotNull(Error400, v);
}

// Note that currently it is not possible to combine this with `assertNotNull` due to https://github.com/microsoft/TypeScript/issues/40562.
function _notNull<T>(errorType: ErrorT, v: T | null | undefined): T {
  _assertNotNull(errorType, v);
  return v;
}

const notNull = <T>(v: T | null | undefined) => _notNull(Error, v);
const notNull400 = <T>(v: T | null | undefined) => _notNull(Error400, v);

// See https://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string-in-javascript
export const isString = (x: any) =>
  typeof x === "string" || x instanceof String;

export function logHandlerErrors<T>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>
): (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void> {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      if (err instanceof Error400) {
        // We have to cast to any because we promised to return a T.
        res.status(400).send("bad request" as any);
      } else {
        res.status(500).send("internal server error" as any);
      }
    }
  };
}

export { notNull, notNull400 };
