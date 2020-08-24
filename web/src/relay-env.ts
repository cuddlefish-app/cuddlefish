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

const hasuraHeaders = {
  "x-hasura-admin-secret": "xxx",
  "x-hasura-role": "user",
  "x-hasura-user-id": "frontenduser",
};

function fetchQuery(operation: RequestParameters, variables: Variables) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...hasuraHeaders,
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
  connectionParams: { headers: hasuraHeaders },
});

// TODO: The types on the relay-runtime and subscriptions-transport-ws libraries are a little broken at the moment.
const subscribe = (request: any, variables: any) => {
  const subscribeObservable = subClient.request({
    query: request.text,
    operationName: request.name,
    variables,
  });
  // Important: Convert subscriptions-transport-ws observable type to Relay's
  return Observable.from(subscribeObservable as any);
};

const environment = new Environment({
  network: Network.create(fetchQuery, subscribe),
  store: new Store(new RecordSource()),
});

export default environment;
