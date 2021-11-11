#!/bin/bash
set -a; source /etc/cuddlefish-dev.env; set +a
hasura console --endpoint=http://localhost:8080/

# TODO use env file and point hasura console towards that --envfile!
