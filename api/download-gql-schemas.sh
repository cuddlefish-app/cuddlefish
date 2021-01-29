#!/usr/bin/env bash

# See https://sipb.mit.edu/doc/safe-shell/
set -euf -o pipefail

# Don't source /etc/cuddlefish-dev.env here because that would break CI which
# injects these env vars on its own. Instead you'll need to export them yourself
# when running locally.

# See https://github.com/graphql-rust/graphql-client/tree/master/graphql_client_cli

graphql-client introspect-schema \
    --header="X-Hasura-Admin-Secret: $HASURA_GRAPHQL_ADMIN_SECRET" \
    $HASURA_GRAPHQL_ENDPOINT \
    --output gql/hasura/schema.json

graphql-client introspect-schema \
    --authorization=$GITHUB_API_TOKEN \
    https://api.github.com/graphql \
    --output gql/github/schema.json
