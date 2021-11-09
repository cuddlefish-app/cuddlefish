# Hasura and Postgres

Public access is available and is given the role `anonymous`. See https://hasura.io/docs/latest/graphql/core/auth/authentication/unauthenticated-access.html#webhooks for more information.

## Env vars

External:

- `API_HOST`
- `API_PORT`
- `NEXT_HOST`
- `NEXT_PORT`

Internal (see `Dockerfile`):

- `HASURA_GRAPHQL_AUTH_HOOK`: See https://hasura.io/docs/latest/graphql/core/auth/authentication/webhook.html#configuring-webhook-mode.
- `API_GRAPHQL_ENDPOINT`: So that we get a remote schema into the rust api.
- `INSERT_COMMENTS_WEBHOOK_URL`: Webhook whenever we insert a new comment.

## Development

Run `./dev.sh`. It will run hasura and postgres locally with persistence across runs. Note that the api server must be up and running before you can run the `./dev.sh`.

If you get an error about the metadata status it's likely because the api server is not yet running. Start the api server and then try reloading metadata.

### Hasura console

The console is automatically available in dev mode at http://localhost:8080.

Alternatively, run `hasura console --endpoint http://100.118.228.49:8080` from this directory on your local machine, and then access the console from http://localhost:9695. See https://github.com/hasura/graphql-engine/issues/6589 as to why we can't use tailscale MagicDNS here. Replace IP address with prod/staging/etc as desired.

## Remote Schema vs Public API

GraphQL access to the api goes through Hasura in the form a Remote Schema. However, the api is still publicly accessible since it is required for GitHub OAuth, etc. This begs the question: why hit the api through Hasura at all? Why not skip Remote Schema setup and hit the api directly. Unfortunately a lot of GraphQL clients (esp. Relay) make it difficult to use use two different GraphQL endpoints simultaneously.

## Schema

### github_users

Users can interact with the app by logging in through GitHub or by responding to an email. `github_users` stores all the info for users logging in through GitHub.

### Threads

The `threads` table stores all the threads. It is unique on `(commit, file, linenumber)`.
