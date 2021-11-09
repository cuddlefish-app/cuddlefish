# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
# Dockerfile is here: https://github.com/hasura/graphql-engine/blob/master/scripts/cli-migrations/v3/Dockerfile
FROM hasura/graphql-engine:v2.0.10.cli-migrations-v3

# See https://github.com/hasura/graphql-engine/issues/7676#issuecomment-954439822
RUN apt-get update \
  && apt-get install -y curl gnupg2 \
  && echo "deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && curl -s https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && apt-get update \
  && apt-get install -y postgresql-client-14

# Never enable the console! Use `hasura console` instead. See https://hasura.io/docs/latest/graphql/core/migrations/migrations-setup.html#step-0-disable-the-console-on-the-server
# and https://github.com/hasura/graphql-engine/issues/7728.
RUN sed -i "2iexport HASURA_GRAPHQL_ENABLE_CONSOLE=false" /bin/docker-entrypoint.sh

# See https://github.com/hasura/graphql-engine/issues/6546
RUN sed -i "2iexport HASURA_GRAPHQL_AUTH_HOOK=http://\$API_HOST:\$API_PORT/hasura_auth_webhook" /bin/docker-entrypoint.sh
RUN sed -i "2iexport API_GRAPHQL_ENDPOINT=http://\$API_HOST:\$API_PORT/graphql" /bin/docker-entrypoint.sh
RUN sed -i "2iexport INSERT_COMMENTS_WEBHOOK_URL=http://\$NEXT_HOST:\$NEXT_PORT/api/insert_comments_webhook" /bin/docker-entrypoint.sh
