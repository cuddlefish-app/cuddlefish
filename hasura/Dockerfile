# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
# Dockerfile is here: https://github.com/hasura/graphql-engine/blob/master/scripts/cli-migrations/v2/Dockerfile
FROM hasura/graphql-engine:v1.3.1.cli-migrations-v2

COPY ./migrations /hasura-migrations
COPY ./metadata /hasura-metadata

# See remote_schemas.yaml.
ENTRYPOINT API_GRAPHQL_ENDPOINT=$API_HOSTPORT/graphql docker-entrypoint.sh
# The ENTRYPOINT ends up getting run first and then it hands off control to CMD.
CMD graphql-engine serve \
  --auth-hook "$API_HOSTPORT/hasura_auth_webhook"
