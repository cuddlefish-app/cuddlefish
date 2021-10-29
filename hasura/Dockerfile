# See https://hasura.io/docs/1.0/graphql/core/migrations/advanced/auto-apply-migrations.html
# Dockerfile is here: https://github.com/hasura/graphql-engine/blob/master/scripts/cli-migrations/v3/Dockerfile
FROM hasura/graphql-engine:v2.0.10.cli-migrations-v3

RUN apt-get update \
  && apt-get install -y curl gnupg2 \
  && echo "deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
  && curl -s https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && apt-get update \
  && apt-get install -y postgresql-client-14
