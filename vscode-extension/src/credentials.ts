import {
  ApolloClient,
  ApolloLink,
  gql,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from "@apollo/client/core";
import { setContext } from "@apollo/client/link/context";
import * as Octokit from "@octokit/rest";
import { fetch } from "cross-fetch";
import * as vscode from "vscode";
import {
  StartCuddlefishSessionMutation,
  StartCuddlefishSessionMutationVariables,
} from "./generated/hasura-types";
import { notNull } from "./utils";

const GITHUB_AUTH_PROVIDER_ID = "github";
const CUDDLEFISH_SESSION_TOKEN = "cuddlefish-session-token";
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
  | undefined;

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
      vscode.window.showInformationMessage("Could not get GitHub credentials.");
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
  return context.globalState.get(CUDDLEFISH_SESSION_TOKEN) as
    | string
    | undefined;
}

export async function getCuddlefishSessionTokenModal(
  context: vscode.ExtensionContext,
  creds: GitHubCredentials
): Promise<string> {
  const existing = getCuddlefishSessionTokenQuiet(context);
  if (existing !== undefined) {
    return existing;
  } else {
    // Hit up our api with vscodeSession.accessToken to get a CF session token
    // and store it in global state.

    const vscodeSession = await creds.getSessionModal();

    // Get a potentially anonymous client.
    const client = getApolloClientQuiet(context);
    const res = await client.mutate<
      StartCuddlefishSessionMutation,
      StartCuddlefishSessionMutationVariables
    >({
      mutation: gql`
        mutation StartCuddlefishSession($githubAccessToken: String!) {
          StartCuddlefishSession(githubAccessToken: $githubAccessToken)
        }
      `,
      variables: { githubAccessToken: vscodeSession.accessToken },
    });
    const token = notNull(res.data).StartCuddlefishSession;
    context.globalState.update(CUDDLEFISH_SESSION_TOKEN, token);
    return token;
  }
}

export function eraseCuddlefishSessionToken(context: vscode.ExtensionContext) {
  context.globalState.update(CUDDLEFISH_SESSION_TOKEN, undefined);
}

function buildApolloClient(token: string | undefined) {
  // See https://stackoverflow.com/questions/42397699/detect-debug-mode-in-vscode-extension
  const uri =
    vscode.debug.activeDebugSession === undefined
      ? "https://hasura.cuddlefish.app/v1/graphql"
      : "http://localhost:8080/v1/graphql";

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
  if (apolloClient !== undefined) {
    return apolloClient.client;
  }

  const token = getCuddlefishSessionTokenQuiet(context);
  apolloClient = buildApolloClient(token);
  return apolloClient.client;
}

// Return a cached Apollo client which includes authentication.
export async function getApolloClientWithAuth(
  context: vscode.ExtensionContext,
  creds: GitHubCredentials
) {
  const token = notNull(await getCuddlefishSessionTokenModal(context, creds));
  if (
    apolloClient !== undefined &&
    apolloClient.cuddlefishSessionToken !== token
  ) {
    return apolloClient.client;
  }

  // See https://www.apollographql.com/docs/react/networking/authentication/#header
  apolloClient = buildApolloClient(token);
  return apolloClient.client;
}
