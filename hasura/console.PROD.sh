#!/bin/bash
set -a; source /etc/cuddlefish-PROD.env; set +a
echo "===== CAUTION ====="
echo "Never under any circumstance make changes to the schema/metadata in this console!"
echo "==================="
hasura console --endpoint=https://hasura.cuddlefish.app/

# TODO use env file and point hasura console towards that --envfile!
