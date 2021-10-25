# Hasura and Postgres

Public access is available and is given the role `anonymous`.

TODO:

- update schema to support people responding via email
  - Add email column to the session_tokens table, and add a constraint that exactly one of email or github_id is present.
- add GH access_token column to the `github_users` table

## Development

Run `docker compose up` or `docker compose --file docker-compose.macos.yaml up`. It will run hasura and postgres locally with persistence across runs. Note that the api server must be up and running before you can run the `docker compose up` command.

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

The `threads` table stores all the threads. It should be unique on `(commit, file, linenumber)` when `resolved == false`.

TODO:

- actually apply that constraint with a partial unique index: https://stackoverflow.com/questions/16236365/postgresql-conditionally-unique-constraint.
