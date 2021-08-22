let
  # Last updated: 8/22/21. Check for new commits at status.nixos.org.
  pkgs = import (fetchTarball("https://github.com/NixOS/nixpkgs/archive/14b0f20fa1f56438b74100513c9b1f7c072cf789.tar.gz")) {};

  # Rolling updates, not deterministic.
  # pkgs = import (fetchTarball("channel:nixpkgs-unstable")) {};
in pkgs.mkShell {
  buildInputs = with pkgs; [
    cargo
    docker-compose
    hasura-cli
    rustc
    rustfmt
    yarn

    # Necessary for `yarn relay --watch`.
    watchman

    # Necessary for the openssl-sys crate:
    openssl
    pkg-config
  ];

  # See https://discourse.nixos.org/t/rust-src-not-found-and-other-misadventures-of-developing-rust-on-nixos/11570/3?u=samuela.
  RUST_SRC_PATH = "${pkgs.rust.packages.stable.rustPlatform.rustLibSrc}";

  # Development variables:
  HASURA_GRAPHQL_ADMIN_SECRET = "hasurasecret";
  API_GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";
}
