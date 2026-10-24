#!/bin/sh
set -eu

validate_only=false
if [ "${1:-}" = "--validate-only" ]; then
  validate_only=true
fi

blocked() {
  printf '%s\n' "BLOCKED: $*" >&2
  exit 2
}

test -f infra/docker/rust-next.Dockerfile || blocked "Dockerfile is missing"
test -f infra/docker/entrypoint.sh || blocked "entrypoint is missing"
test -f Cargo.toml || blocked "Cargo.toml is missing"
test -f Cargo.lock || blocked "Cargo.lock is missing; reproducible Rust packaging is not ready"
test -f services/core/Cargo.toml || blocked "services/core/Cargo.toml is missing"
test -f apps/web/package.json || blocked "apps/web/package.json is missing"
test -f apps/web/package-lock.json || blocked "apps/web/package-lock.json is missing; npm ci cannot be proven"

rust_binary="${RUST_BINARY:-still-core}"
image_tag="${STILL_IMAGE_TAG:-still:${CI_COMMIT_SHA:-local}}"

if [ "$validate_only" = true ]; then
  printf '%s\n' \
    'status=READY_FOR_DOCKER_BUILD' \
    "rust_binary=$rust_binary" \
    "image_tag=$image_tag" \
    'docker_build=not_run'
  exit 0
fi

command -v docker >/dev/null 2>&1 || blocked "docker is required for a real image build"
docker build \
  --file infra/docker/rust-next.Dockerfile \
  --build-arg "RUST_BINARY=$rust_binary" \
  --tag "$image_tag" \
  .

printf '%s\n' "status=PASS" "image_tag=$image_tag" 'docker_build=executed'
