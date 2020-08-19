# API

The "frontend" to the backend is Hasura. Most queries go through it.

## Blame server

The blame server is responsible for giving the git blame information for any repo. These queries are pure in the sense that blame info never changes. The blame server is hooked up to Hasura using a Remote Schema so that we can do remote joins across the blame info and the rest of the Hasura database.

## On RepoId vs GitHub's global node IDs

GitHub attaches a global "node id" to each object in its API (https://docs.github.com/en/graphql/guides/using-global-node-ids). These are returned as base64 encoded strings. Unfortunately base64 encoded values can contain unfriendly characters, namely `/` (See https://en.wikipedia.org/wiki/Base64#Base64_table). We escape `/` with `_` in `RepoId`s.

RepoId's are also prefixed with `github-` for some amount of future proofing. (`-` is not used by base64.)
