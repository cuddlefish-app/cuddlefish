# This mirrors https://github.com/hasura/graphql-engine-heroku/blob/master/Dockerfile
FROM hasura/graphql-engine:v1.3.1

# Enable the console
ENV HASURA_GRAPHQL_ENABLE_CONSOLE=true

# Change $DATABASE_URL to your heroku postgres URL if you're not using
# the primary postgres instance in your app
CMD graphql-engine \
    --database-url $DATABASE_URL \
    serve \
    --server-port $PORT
