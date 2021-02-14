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
    pkgs.yarn

    # Necessary for the openssl-sys crate:
    pkgs.openssl
    pkgs.pkg-config
  ];
  shellHook = ''
    yarn --cwd web install --frozen-lockfile
  '';
}
