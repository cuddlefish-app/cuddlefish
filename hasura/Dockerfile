# TODO is this still relevant/used at all?

# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
# Dockerfile is here: https://github.com/hasura/graphql-engine/blob/master/scripts/cli-migrations/v2/Dockerfile
FROM hasura/graphql-engine:v1.3.3.cli-migrations-v2

COPY ./migrations /hasura-migrations
COPY ./metadata /hasura-metadata

# See https://github.com/hasura/graphql-engine/issues/6546
RUN sed -i "2iexport API_GRAPHQL_ENDPOINT=http://\$API_HOST:\$API_PORT/graphql" /bin/docker-entrypoint.sh
RUN sed -i "2iexport HASURA_GRAPHQL_AUTH_HOOK=http://\$API_HOST:\$API_PORT/hasura_auth_webhook" /bin/docker-entrypoint.sh
