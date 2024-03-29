import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import * as Octokit from "@octokit/rest";
import { fetch } from "cross-fetch";
import * as vscode from "vscode";
import { startCuddlefishSession } from "./anonymous-hasura-queries";
import { asyncMemo1, notNull } from "./utils";

const GITHUB_AUTH_PROVIDER_ID = "github";
const CUDDLEFISH_SESSION_TOKEN =
  process.env.CUDDLEFISH_SESSION_TOKEN_STORAGE_KEY ||
  "cuddlefish-session-token";
// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const SCOPES = ["user:email"];

// Caching this is important since it includes internal caching for GraphQL
// objects.
let apolloClient:
  | {
      cuddlefishSessionToken: string | undefined;
      client: ApolloClient<NormalizedCacheObject>;
    }
  | undefined = undefined;

export class GitHubCredentials {
  private session: vscode.AuthenticationSession | undefined;

  constructor(context: vscode.ExtensionContext) {
    // Sessions are changed when a user logs in or logs out.
    context.subscriptions.push(
      vscode.authentication.onDidChangeSessions(async (e) => {
        if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
          // Clear apollo cache. See https://www.apollographql.com/docs/react/networking/authentication/#reset-store-on-logout
          if (apolloClient !== undefined) {
            apolloClient.client.resetStore();
          }
          apolloClient = undefined;
          eraseCuddlefishSessionToken(context);

          await this.getSessionQuiet();
        }
      })
    );

    this.getSessionQuiet();
  }

  async getSessionQuiet() {
    /**
     * By passing the `createIfNone` flag, a numbered badge will show up on the accounts activity bar icon.
     * An entry for the sample extension will be added under the menu to sign in. This allows quietly
     * prompting the user to sign in.
     * */
    this.session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER_ID,
      SCOPES,
      { createIfNone: false }
    );

    return this.session;
  }

  async getSessionModal() {
    /**
     * When the `createIfNone` flag is passed, a modal dialog will be shown asking the user to sign in.
     * Note that this can throw if the user clicks cancel.
     */
    this.session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER_ID,
      SCOPES,
      { createIfNone: true }
    );

    if (this.session === undefined) {
      vscode.window.showErrorMessage("Could not get GitHub credentials.");
    }

    return this.session;
  }
}

export async function getOctokitModal(
  creds: GitHubCredentials
): Promise<Octokit.Octokit> {
  const session = notNull(await creds.getSessionModal());
  return new Octokit.Octokit({ auth: session.accessToken });
}

function getCuddlefishSessionTokenQuiet(
  context: vscode.ExtensionContext
): string | undefined {
  return context.globalState.get(CUDDLEFISH_SESSION_TOKEN);
}

export async function getCuddlefishSessionTokenModal(
  context: vscode.ExtensionContext,
  creds: GitHubCredentials
): Promise<string> {
  console.log("getCuddlefishSessionTokenModal");

  const existing = getCuddlefishSessionTokenQuiet(context);
  if (existing !== undefined) {
    return existing;
  } else {
    // Hit up our api with vscodeSession.accessToken to get a CF session token
    // and store it in global state.

    console.log(
      "getCuddlefishSessionTokenModal: acquiring a new Cuddlefish session token..."
    );
    const vscodeSession = await creds.getSessionModal();

    // Note we intentionally use an anonymous client.
    const token = await startCuddlefishSession(
      buildApolloClient(undefined).client,
      vscodeSession.accessToken
    );
    context.globalState.update(CUDDLEFISH_SESSION_TOKEN, token);
    return token;
  }
}

export function eraseCuddlefishSessionToken(context: vscode.ExtensionContext) {
  context.globalState.update(CUDDLEFISH_SESSION_TOKEN, undefined);
}

export function hasuraEndpoint() {
  // See https://stackoverflow.com/questions/42397699/detect-debug-mode-in-vscode-extension
  // This doesn't seem to work:
  // return vscode.debug.activeDebugSession === undefined
  //   ? "https://hasura.cuddlefish.app/v1/graphql"
  //   : "http://localhost:8080/v1/graphql";
  return (
    process.env.HASURA_GRAPHQL_ENDPOINT ||
    "https://hasura.cuddlefish.app/v1/graphql"
  );
}
function buildApolloClient(token: string | undefined) {
  console.log(
    token === undefined
      ? "buildApolloClient without a token"
      : "buildApolloClient with a token"
  );

  const uri = hasuraEndpoint();

  if (token === undefined) {
    return {
      cuddlefishSessionToken: undefined,
      client: new ApolloClient({
        link: new HttpLink({ uri, fetch }),
        cache: new InMemoryCache(),
      }),
    };
  } else {
    // See https://www.apollographql.com/docs/react/networking/authentication/#header
    // See https://github.com/apollographql/apollo-client/issues/8967 as to why
    // we can't do this the simple way.
    const authLink = setContext((_operation, previousContext) => ({
      ...previousContext,
      headers: {
        ...previousContext.headers,
        authorization: `Bearer ${token}`,
      },
    }));
    return {
      cuddlefishSessionToken: token,
      client: new ApolloClient({
        link: ApolloLink.from([authLink, new HttpLink({ uri, fetch })]),
        cache: new InMemoryCache(),
      }),
    };
  }
}

// Return a cached Apollo client, possibly without authentication.
export function getApolloClientQuiet(
  context: vscode.ExtensionContext
): ApolloClient<NormalizedCacheObject> {
  console.log("getApolloClientQuiet");

  if (apolloClient !== undefined) {
    console.log("getApolloClientQuiet: Returning existing apolloClient");
    return apolloClient.client;
  } else {
    const token = getCuddlefishSessionTokenQuiet(context);
    apolloClient = buildApolloClient(token);
    console.log(
      token === undefined
        ? "getApolloClientQuiet: Returning new apolloClient without token"
        : "getApolloClientQuiet: Returning new apolloClient with token"
    );
    return apolloClient.client;
  }
}

// Return a cached Apollo client which includes authentication.
export async function getApolloClientWithAuth(
  context: vscode.ExtensionContext,
  creds: GitHubCredentials
) {
  console.log("getApolloClientWithAuth");
  const token = notNull(await getCuddlefishSessionTokenModal(context, creds));
  if (
    apolloClient !== undefined &&
    apolloClient.cuddlefishSessionToken === token
  ) {
    console.log("getApolloClientWithAuth: Returning cached apolloClient");
    return apolloClient.client;
  } else {
    console.log(
      "getApolloClientWithAuth: Cached apolloClient is either non-existent or stale"
    );
    apolloClient = buildApolloClient(token);
    return apolloClient.client;
  }
}

export const getOctokitUserInfo = asyncMemo1(async function getOctokitUserInfo(
  credentials: GitHubCredentials
) {
  const octokit = await getOctokitModal(credentials);
  return await octokit.users.getAuthenticated();
});
