import {
  Environment,
  Network,
  RecordSource,
  RequestParameters,
  Store,
  Variables,
} from "relay-runtime";

// What's the real difference between the normal and Relay endpoints? Relay does not seem to work with the Relay
// endpoint ironically.
// const url = "https://cuddlefish-hasura.herokuapp.com/v1beta1/relay";
const url = "https://cuddlefish-hasura.herokuapp.com/v1/graphql";

function fetchQuery(operation: RequestParameters, variables: Variables) {
  console.log(process.env.HASURA_ADMIN_SECRET);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": "xxx",
    },
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
  }).then((response) => {
    return response.json();
  });
}

const environment = new Environment({
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource()),
});

export default environment;
