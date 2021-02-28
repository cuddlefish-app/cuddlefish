# Pull in all the env vars from /etc/cuddlefish-dev.env
set -a; source /etc/cuddlefish-dev.env; set +a

# See https://doc.rust-lang.org/std/backtrace/index.html#environment-variables.
MIRRORS_DIR=/tmp/cf-mirrors \
    RUST_LIB_BACKTRACE=1 \
    RUST_BACKTRACE=full \
    RUST_LOG=api=trace \
    HASURA_HOSTPORT=localhost:8080 \
    cargo watch -x run

# This flag causes cargo to recompile everything every single time you save.
# RUSTFLAGS=-Awarnings \
