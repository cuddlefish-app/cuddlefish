# Hasura and Postgres

Public access is available and is given the role `anonymous`.

## Development

Run `docker-compose up` or `docker compose --file docker-compose.macos.yaml up`. It will run hasura and postgres locally with persistence across runs. Note that the api server must be up and running before you can run the `docker-compose up` command.

Run `hasura console --endpoint http://100.118.228.49:8080` from this directory on your local machine. See https://github.com/hasura/graphql-engine/issues/6589 as to why we can't use tailscale MagicDNS here.

If you get an error about the metadata status it's likely because the api server is not yet running. Start the api server and then try reloading metadata.

## Schema

### Threads

The `threads` table stores all the threads. It should be unique on `(commit, file, linenumber)` when `resolved == false`.

TODO: actually apply that constraint with a partial unique index: https://stackoverflow.com/questions/16236365/postgresql-conditionally-unique-constraint.
