#!/usr/bin/env bash

if [ "$(uname)" == "Linux" ]; then
  docker-compose up --build
else
  docker compose --file docker-compose.macos.yaml up --build
fi
