let
  # Last updated: 3/4/21
  pkgs = import (fetchTarball("https://github.com/NixOS/nixpkgs/archive/5df05c902cde398e056eb6271d5fe13e418db4c6.tar.gz")) {};

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

    # Necessary for `yarn relay --watch`.
    pkgs.watchman

    # Necessary for the openssl-sys crate:
    pkgs.openssl
    pkgs.pkg-config
  ];

  # See https://discourse.nixos.org/t/rust-src-not-found-and-other-misadventures-of-developing-rust-on-nixos/11570/3?u=samuela.
  RUST_SRC_PATH = "${pkgs.rust.packages.stable.rustPlatform.rustLibSrc}";

  # Development variables:
  HASURA_GRAPHQL_ADMIN_SECRET = "hasurasecret";
  API_GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";
}
