# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
FROM hasura/graphql-engine:v1.3.1.cli-migrations-v2

COPY ./migrations /hasura-migrations
COPY ./metadata /hasura-metadata

# See remote_schemas.yaml.
ENV API_GRAPHQL_ENDPOINT=$API_HOSTPORT/graphql

CMD graphql-engine serve \
  --auth-hook "$API_HOSTPORT/hasura_auth_webhook"
