# syntax=docker/dockerfile:1.7
# Build-only packaging boundary for the eventual STILL Rust + Next runtime.
# The repository currently has no Rust binary manifest or Next package manifest,
# so this Dockerfile is intentionally not claimed as executed.

FROM rust:latest AS rust-builder
WORKDIR /src
ARG RUST_BINARY=still-core
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY crates ./crates
COPY services ./services
RUN cargo build --locked --workspace --release --bin "${RUST_BINARY}"

FROM node:22-bookworm-slim AS web-builder
WORKDIR /src
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
RUN npm ci --prefix apps/web
COPY apps/web ./apps/web
RUN npm --prefix apps/web run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ARG RUST_BINARY=still-core
ENV NODE_ENV=production
ENV RUST_BINARY=${RUST_BINARY}
COPY --from=rust-builder /src/target/release/${RUST_BINARY} /app/bin/${RUST_BINARY}
COPY --from=web-builder /src/apps/web/.next /app/web/.next
COPY --from=web-builder /src/apps/web/public /app/web/public
COPY --from=web-builder /src/apps/web/package.json /app/web/package.json
COPY --from=web-builder /src/apps/web/node_modules /app/web/node_modules
COPY infra/docker/entrypoint.sh /usr/local/bin/still-entrypoint
RUN chmod 0555 /usr/local/bin/still-entrypoint /app/bin/${RUST_BINARY}
EXPOSE 3000 8787
ENTRYPOINT ["/usr/local/bin/still-entrypoint"]
