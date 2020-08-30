#!/usr/bin/env bash

# See https://sipb.mit.edu/doc/safe-shell/
set -euf -o pipefail

# Don't source /etc/cuddlefish-dev.env here because that would break CI which
# injects these env vars on its own. Instead you'll need to export them yourself
# when running locally.

# Add --silent flag so these secrets don't end up in CI logs.
yarn --silent apollo schema:download gql/hasura/schema.json \
    --endpoint=$HASURA_GRAPHQL_ENDPOINT \
    --header="X-Hasura-Admin-Secret: $HASURA_GRAPHQL_ADMIN_SECRET"

yarn --silent apollo schema:download gql/github/schema.json \
    --endpoint=https://api.github.com/graphql \
    --header="Authorization: bearer $GITHUB_API_TOKEN"
