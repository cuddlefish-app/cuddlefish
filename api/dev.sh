# Pull in all the env vars from /etc/cuddlefish-dev.env
set -a; source /etc/cuddlefish-dev.env; set +a

MIRRORS_DIR=mirrors \
    RUSTFLAGS=-Awarnings \
    RUST_LIB_BACKTRACE=1 \
    RUST_BACKTRACE=full \
    RUST_LOG=api=trace \
    cargo watch -x run
