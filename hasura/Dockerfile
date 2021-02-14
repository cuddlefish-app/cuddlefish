# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
# Dockerfile is here: https://github.com/hasura/graphql-engine/blob/master/scripts/cli-migrations/v2/Dockerfile
FROM hasura/graphql-engine:v1.3.3.cli-migrations-v2

COPY ./migrations /hasura-migrations
COPY ./metadata /hasura-metadata

ENV API_GRAPHQL_ENDPOINT=http://$API_HOST:$API_PORT/graphql
ENV HASURA_GRAPHQL_AUTH_HOOK=http://$API_HOST:$API_PORT/hasura_auth_webhook

# See remote_schemas.yaml. We can't just use ENV since those aren't going to be
# picked up in docker-entrypoint.sh by default, because the base image uses the
# exec form for ENTRYPOINT and CMD. See https://stackoverflow.com/questions/37904682/how-do-i-use-docker-environment-variable-in-entrypoint-array

# The port 10000 is due to a render bug. See https://community.render.com/t/service-cannot-reach-itself-via-host-port-combo/755/2?u=samuela.
# ENTRYPOINT API_GRAPHQL_ENDPOINT=http://$API_HOST:$API_PORT/graphql docker-entrypoint.sh
# ENTRYPOINT ["docker-entrypoint.sh"]
# The ENTRYPOINT ends up getting run first and then it hands off control to CMD.
# CMD ["graphql-engine", "serve", "--auth-hook", "http://$API_HOST:$API_PORT/hasura_auth_webhook"]
