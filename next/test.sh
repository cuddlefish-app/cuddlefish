# Pull in all the env vars from /etc/cuddlefish-dev.env
set -a; source /etc/cuddlefish-dev.env; set +a
# See also .env.local
yarn run test
