#!/bin/sh
set -eu

: "${RUST_BINARY:?RUST_BINARY is required}"
: "${PORT:=3000}"

/app/bin/"$RUST_BINARY" &
backend_pid=$!

cleanup() {
  kill "$backend_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

exec npm --prefix /app/web run start -- --hostname 0.0.0.0 --port "$PORT"
