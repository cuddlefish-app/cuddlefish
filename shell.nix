let
  # Last updated: 2/12/21
  pkgs = import (fetchTarball("https://github.com/NixOS/nixpkgs/archive/a58a0b5098f0c2a389ee70eb69422a052982d990.tar.gz")) {};

  # Rolling updates, not deterministic.
  # pkgs = import (fetchTarball("channel:nixpkgs-unstable")) {};
in pkgs.mkShell {
  buildInputs = [
    pkgs.cargo
    pkgs.docker-compose
    pkgs.hasura-cli
    pkgs.rustc
    pkgs.rustfmt
    pkgs.yarn

    # Necessary for the openssl-sys crate:
    pkgs.openssl
    pkgs.pkg-config
  ];
  shellHook = ''
    yarn --cwd web install --frozen-lockfile
  '';

  # See https://discourse.nixos.org/t/rust-src-not-found-and-other-misadventures-of-developing-rust-on-nixos/11570/3?u=samuela.
  RUST_SRC_PATH = "${pkgs.rust.packages.stable.rustPlatform.rustLibSrc}";

  # Development variables:
  HASURA_GRAPHQL_ADMIN_SECRET = "hasurasecret";
  API_GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";
  HASURA_GRAPHQL_ENDPOINT = "http://localhost:8080/v1/graphql";
}
