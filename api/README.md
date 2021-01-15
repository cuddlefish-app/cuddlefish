# API

The "frontend" to the backend is Hasura. Most queries go through it.

TODO:

- failure has been deprecated. We should use something else.
  - https://blog.yoshuawuyts.com/error-handling-survey/
  - https://nick.groenen.me/posts/rust-error-handling/

## Update GraphQL schemas in development

```
HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql HASURA_GRAPHQL_ADMIN_SECRET=hasurasecret GITHUB_API_TOKEN=<xxx> ./download-gql-schemas.sh
```

Pro tip: You don't actually need `GITHUB_API_TOKEN` if you only care about updating the hasura schema.

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
