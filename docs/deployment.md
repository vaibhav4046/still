# STILL deployment and packaging boundary

## Current status

Deployment is **blocked by design** in this checkout. No provider credentials, project permissions, candidate URL, or deploy command were supplied, and no deployment is claimed.

The repository now contains:

- `infra/docker/rust-next.Dockerfile`: a multi-stage Rust workspace + Next.js packaging path.
- `infra/docker/entrypoint.sh`: a small runtime launcher for a Rust binary and the Next server.
- `infra/docker/package.sh`: a fail-closed validator and optional Docker build wrapper.
- `.gitlab-ci.yml` jobs for `package`, `govern`, `deploy_candidate`, `smoke_monitor`, and `evidence_publication`.

The packaging path requires these real project inputs before a build can be truthful:

```text
Cargo.toml
Cargo.lock
services/core/Cargo.toml
apps/web/package.json
apps/web/package-lock.json
```

It also requires a real Rust binary name. Set `RUST_BINARY` if the default `still-core` does not match the implemented service binary.

## Local packaging boundary

Validate readiness without building an image:

```bash
sh infra/docker/package.sh --validate-only
```

Build only after the manifests and lockfiles exist:

```bash
RUST_BINARY=still-core STILL_IMAGE_TAG=still:local sh infra/docker/package.sh
```

The readiness command was exercised locally and returned `BLOCKED: Cargo.lock is missing; reproducible Rust packaging is not ready`. The real Docker image-build command was not run. The current checkout is also missing the required Rust service and Next package manifests, so a real image build is not yet a valid success claim.

## Candidate deployment job

`deploy_candidate` is an explicit boundary, not a provider adapter. It is only added when a pipeline is started with `STILL_RUN_DEPLOY=true`, and it requires:

- `STILL_RELEASE_APPROVED=true`;
- a reviewed `STILL_RELEASE_EVIDENCE_URI`; and
- a protected `STILL_CANDIDATE_URL`.

The current script then fails closed with `DEPLOY_BLOCKED` because no authorized Vercel, GCP, Kubernetes, or other deployment implementation is configured. This avoids silently turning a placeholder into an unreviewed deployment.

## Governance

The `govern` job is also opt-in (`STILL_RUN_GOVERN=true`). It rejects missing or non-true approval and rejects evidence URIs outside HTTP(S) or `gitlab-artifact://`. It never auto-merges, auto-deploys, or treats a stored boolean as proof that a human reviewed the evidence.

## Bounded scheduled monitoring

GitLab schedules are project settings, not declarations created by `.gitlab-ci.yml`. Create a schedule in **Build > Pipeline schedules** (or through the supported Pipeline Schedules API) targeting the protected default branch. Use the values in `gitlab/schedules/bounded-monitor.env`:

```text
STILL_MONITOR_MAX_REQUESTS=3
STILL_MONITOR_TIMEOUT_SECONDS=5
STILL_RUN_SMOKE=true
STILL_RUN_DUO_REPAIR=false
STILL_RUN_GOVERN=false
STILL_RUN_DEPLOY=false
```

The scheduled `smoke_monitor` performs at most three bounded probes against `STILL_CANDIDATE_URL`, never prints the URL, and returns `BLOCKED` when the protected target is absent. It does not trigger Duo or deployment.

## Evidence publication

`evidence_publication` always publishes a GitLab artifact containing:

- `evidence/ci-boundary.json`;
- `evidence/ci-boundary.md`.

The artifact explicitly records whether validation, tests, packaging, security checks, and monitoring ran. It defaults to `duo_run_proven: false`, `deployment_proven: false`, and `release_decision: INSUFFICIENT_EVIDENCE`. This is intentionally weaker than a real GitLab pipeline receipt and remains so until a real project run exists.

## Zero-cost boundary and CleanRoom isolation

This setup adds no paid hosting, database, observability, or GitLab Duo entitlement. It does not edit or import `cleanroom/`; STILL remains a standalone project boundary.
