let
  # Last updated: 11/08/21
  moz_overlay = import (fetchTarball "https://github.com/mozilla/nixpkgs-mozilla/archive/cf58c4c67b15b402e77a2665b9e7bad3e9293cb2.tar.gz");

  # Last updated: 11/08/21. Check for new commits at status.nixos.org.
  pkgs = import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/c11d08f02390aab49e7c22e6d0ea9b176394d961.tar.gz") { overlays = [ moz_overlay ]; };

  # Rolling updates, not deterministic.
  # pkgs = import (fetchTarball("channel:nixpkgs-unstable")) {};
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    pkgs.latest.rustChannels.stable.rust

    # Necessary for hasura
    docker-compose

    # Necessary for node and npm
    nodejs-16_x

    # See https://github.com/NixOS/nixpkgs/issues/145634
    (yarn.override {
      nodejs = nodejs-16_x;
    })

    # Necessary for `yarn relay --watch`.
    # watchman

    # Necessary for the openssl-sys crate:
    openssl
    pkg-config
  ] ++ lib.optionals stdenv.isDarwin [
    libiconv
    # See https://github.com/rust-lang/git2-rs/issues/768
    pkgs.darwin.apple_sdk.frameworks.Security
  ] ++ lib.optionals stdenv.isLinux [
    # Necessary for api/dev.sh
    # See https://github.com/NixOS/nixpkgs/issues/146349 as to why we can't do
    # this on macOS yet.
    cargo-watch

    # See https://github.com/hasura/graphql-engine/issues/7820
    hasura-cli
  ];

  # See https://discourse.nixos.org/t/rust-src-not-found-and-other-misadventures-of-developing-rust-on-nixos/11570/3?u=samuela.
  RUST_SRC_PATH = "${pkgs.latest.rustChannels.stable.rust-src}/lib/rustlib/src/rust/library/";
}
