# Pull in all the env vars from /etc/cuddlefish-dev.env
set -a; source /etc/cuddlefish-dev.env; set +a
# We use --silent and pipe to /dev/null so as to avoid leaking TUNNEL_DOMAIN.
yarn run --silent lt --port 3002 --subdomain $TUNNEL_SUBDOMAIN > /dev/null
