import React from "react";
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
// TODO: these need to be configurable before we launch.
const url = "http://localhost:8080/v1/graphql";
// wss:// is the HTTPS version of ws:// so to speak. See https://stackoverflow.com/questions/46557485/difference-between-ws-and-wss.
const wsUrl = "ws://localhost:8080/v1/graphql";

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
      // Necessary to get the cookies sent over.
      credentials: "include",
    }).then((response) => response.json());
  }

  const subClient = new SubscriptionClient(wsUrl, {
    reconnect: true,
    connectionParams: { headers: extraHeaders, credentials: "include" },
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

// This isn't really all that custom at the moment...
const CustomRelayEnvProvider: React.FC = ({ children }) => {
  const relayEnv = buildRelayEnv({});
  return (
    <RelayEnvironmentProvider environment={relayEnv}>
      {children}
    </RelayEnvironmentProvider>
  );
};

export default CustomRelayEnvProvider;
