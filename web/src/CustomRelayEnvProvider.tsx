import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useMemo, useState } from "react";
import { RelayEnvironmentProvider } from "react-relay/hooks";
import {
  Environment,
  Network,
  Observable,
  RecordSource,
  RequestParameters,
  Store,
  Variables,
} from "relay-runtime";
import { SubscriptionClient } from "subscriptions-transport-ws";

// What's the real difference between the normal and Relay endpoints? Relay does not seem to work with the Relay
// endpoint ironically.
// const url = "https://cuddlefish-hasura.herokuapp.com/v1beta1/relay";
const url = "https://cuddlefish-hasura.herokuapp.com/v1/graphql";
// wss:// is the HTTPS version of ws:// so to speak. See https://stackoverflow.com/questions/46557485/difference-between-ws-and-wss.
const wsUrl = "wss://cuddlefish-hasura.herokuapp.com/v1/graphql";

function buildRelayEnv(extraHeaders: {}) {
  // Get's repeated 6 times in an average render. Insane...
  // console.log("building relay env");
  // console.log(extraHeaders);
  function fetchQuery(operation: RequestParameters, variables: Variables) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: get rid of any cast here.
        ...(extraHeaders as any),
      },
      body: JSON.stringify({
        query: operation.text,
        variables,
      }),
    }).then((response) => {
      return response.json();
    });
  }

  const subClient = new SubscriptionClient(wsUrl, {
    reconnect: true,
    connectionParams: { headers: extraHeaders },
  });

  // TODO: The types on the relay-runtime and subscriptions-transport-ws libraries are a little broken at the moment.
  const subscribe = (request: any, variables: any) => {
    const subscribeObservable = subClient.request({
      query: request.text,
      operationName: request.name,
      variables,
    });
    // Important: Convert subscriptions-transport-ws observable type to Relay's.
    return Observable.from(subscribeObservable as any);
  };

  return new Environment({
    network: Network.create(fetchQuery, subscribe),
    store: new Store(new RecordSource()),
  });
}

const CustomRelayEnvProvider: React.FC = ({ children }) => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [accessToken, setAccessToken] = useState(null as null | string);

  // This effect only gets called twice.
  useEffect(() => {
    if (isAuthenticated) getAccessTokenSilently().then(setAccessToken);
    else setAccessToken(null);
  }, [getAccessTokenSilently, isAuthenticated]);

  // TODO: this useMemo doesn't work and buildRelayEnv ends up getting called 6 times on the BlobPage which is just
  // ludicrous. Also causes all of the downstream queries and useMemos to re-render.
  const relayEnv = useMemo(
    () =>
      buildRelayEnv(
        accessToken !== null
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}
      ),
    [accessToken]
  );

  // TODO: use a user-friendly spinner here.
  return !isLoading ? (
    <RelayEnvironmentProvider environment={relayEnv}>
      {children}
    </RelayEnvironmentProvider>
  ) : (
    <div>loading auth...</div>
  );
};

export default CustomRelayEnvProvider;
