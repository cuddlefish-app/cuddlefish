# API

The "frontend" to the backend is Hasura. Most queries go through it. However some things like the GitHub OAuth do not go through Hasura and hit the backend directly.

Run with `./dev.sh`.

You can play with GitHub's graphql API here: https://developer.github.com/v4/explorer/.

## Update GraphQL schemas in development

```
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql HASURA_GRAPHQL_ADMIN_SECRET=hasurasecret GITHUB_API_TOKEN=<xxx> ./download-gql-schemas.sh
```

Pro tip: You don't actually need `GITHUB_API_TOKEN` if you only care about updating the hasura schema.

## Hasura/graphql_client correctness guarantees

The juniper graphql_client library does a good job stubbing out types for calling Hasura. It will generate correct output types, but it will not necessarily guarantee that your input types match what Hasura is expecting. So it's sort-of-good but not a guarantee of API compatibility. See https://github.com/graphql-rust/graphql-client/issues/357.

Other issues with the graphql_client library:

- https://github.com/graphql-rust/graphql-client/issues/393
- Error messages are non-existent/extremely frustrating to use
- https://github.com/graphql-rust/graphql-client/issues/394

## Blame server

The blame server is responsible for giving the git blame information for any repo. These queries are pure in the sense that blame info never changes. The blame server is hooked up to Hasura using a Remote Schema so that we can do remote joins across the blame info and the rest of the Hasura database.

## On RepoId vs GitHub's global node IDs

GitHub attaches a global "node id" to each object in its API (https://docs.github.com/en/graphql/guides/using-global-node-ids). These are returned as base64 encoded strings. Unfortunately base64 encoded values can contain unfriendly characters, namely `/` (See https://en.wikipedia.org/wiki/Base64#Base64_table). We escape `/` with `_` in `RepoId`s.

RepoId's are also prefixed with `github-` for some amount of future proofing. (`-` is not used by base64.)

## VSCode extension

https://github.com/Microsoft/vscode-extension-samples/tree/master/comment-sample

No way to store secrets AFAICT:

- https://github.com/Microsoft/vscode/issues/15414
- https://github.com/Microsoft/vscode/issues/31131
- https://github.com/microsoft/vscode/issues/49359
- https://stackoverflow.com/questions/45293157/vscode-extension-authoring-storage-for-app-secrets

How do existing extensions handle GitHub auth, eg https://visualstudio.github.com/?
