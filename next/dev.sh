# Pull in all the env vars from /etc/cuddlefish-dev.env
set -a; source /etc/cuddlefish-dev.env; set +a

yarn run gql:codegen -- --watch &

# See also .env.local
yarn run dev
