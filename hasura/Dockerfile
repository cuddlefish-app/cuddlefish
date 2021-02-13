# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
# Dockerfile is here: https://github.com/hasura/graphql-engine/blob/master/scripts/cli-migrations/v2/Dockerfile
FROM hasura/graphql-engine:v1.3.1.cli-migrations-v2

COPY ./migrations /hasura-migrations
COPY ./metadata /hasura-metadata

# See remote_schemas.yaml.
# The port 10000 is due to a render bug. See https://community.render.com/t/service-cannot-reach-itself-via-host-port-combo/755/2?u=samuela.
ENTRYPOINT API_GRAPHQL_ENDPOINT=http://$API_HOST:10000/graphql docker-entrypoint.sh
# The ENTRYPOINT ends up getting run first and then it hands off control to CMD.
CMD graphql-engine serve \
  --auth-hook "http://$API_HOST:10000/hasura_auth_webhook"
