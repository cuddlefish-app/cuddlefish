FROM rust:1.49

COPY . .
RUN cargo build --release

RUN mkdir /tmp/mirrors
ENV MIRRORS_DIR=/tmp/mirrors
ENV RUST_LIB_BACKTRACE=1
ENV RUST_BACKTRACE=full
ENV RUST_LOG=api=trace

ENV PORT=3001

CMD cargo run --release
