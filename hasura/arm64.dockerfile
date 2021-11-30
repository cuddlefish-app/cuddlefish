# This is based on the x86_64 Dockerfile which we still use in production.
# Unfortunately there's no official arm64 hasura image yet:
# https://github.com/hasura/graphql-engine/issues/6337.
FROM fedormelexin/graphql-engine-arm64:v2.0.10.cli-migrations-v3

# See https://github.com/hasura/graphql-engine/issues/7676#issuecomment-954439822
# as to why this is necessary in the first place. See https://wiki.postgresql.org/wiki/Apt
# for more info on the PGDG apt repo.
# fedormelexin/graphql-engine-arm64 is based on ubuntu focal (20.04), whereas
# the official hasura/graphql-engine is based on debian buster (10). Therefore,
# we pull from `focal-pgdg`.
RUN apt-get update \
  && apt-get install -y curl gnupg2 \
  && echo "deb http://apt.postgresql.org/pub/repos/apt/ focal-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && curl -s https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && apt-get update \
  && apt-get install -y postgresql-client-14

# See https://github.com/hasura/graphql-engine/issues/6546 for why we need this
# whole mess.
#
# Comments:
# - HASURA_GRAPHQL_ENABLE_CONSOLE: Never enable the console! Use
#   `hasura console` instead. See https://hasura.io/docs/latest/graphql/core/migrations/migrations-setup.html#step-0-disable-the-console-on-the-server
#   and https://github.com/hasura/graphql-engine/issues/7728.
# - HASURA_GRAPHQL_AUTH_HOOK: This is the webhook we hit each time to check auth
# - API_GRAPHQL_ENDPOINT: The remote schema rust API endpoint
# - INSERT_COMMENTS_WEBHOOK_URL: The webhook we hit whenever a comment is
#   inserted. Unlike with actions, it doesn't seem we can use templating, must
#   provide an env var with it.
# - API_SECRET: Secret that is passed to the insert comments webhook, etc. to
#   verify that requests are coming from Hasura.
# - NEXT_HOST, NEXT_PORT: connection info for the next.js app. Tells Hasura
#   where to call actions.
RUN sed -i "2iexport HASURA_GRAPHQL_ENABLE_CONSOLE=false" /bin/docker-entrypoint.sh \
  && sed -i "2iexport HASURA_GRAPHQL_AUTH_HOOK=http://\$NEXT_HOST:\$NEXT_PORT/api/hasura_auth_webhook" /bin/docker-entrypoint.sh \
  && sed -i "2iexport API_GRAPHQL_ENDPOINT=http://\$API_HOST:\$API_PORT/graphql" /bin/docker-entrypoint.sh \
  && sed -i "2iexport INSERT_COMMENTS_WEBHOOK_URL=http://\$NEXT_HOST:\$NEXT_PORT/api/insert_comments_webhook" /bin/docker-entrypoint.sh \
  && sed -i "2iexport API_SECRET=\$API_SECRET" /bin/docker-entrypoint.sh \
  && sed -i "2iexport NEXT_HOST=\$NEXT_HOST" /bin/docker-entrypoint.sh \
  && sed -i "2iexport NEXT_PORT=\$NEXT_PORT" /bin/docker-entrypoint.sh

# We need to copy these into the image since render doesn't support mounting the
# source code in at run-time. Do it at the end for minimal impact to layer
# caching.
COPY ./migrations /hasura-migrations
COPY ./metadata /hasura-metadata
