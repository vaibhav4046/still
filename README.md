# STILL — *The form broke. The appointment didn't.*

**STILL OMEGA** is a **Supervised Closed-Loop Continuity & GitLab Duo Agent Platform Repair System** for critical public-sector and university appointment booking journeys. When a frontend regression breaks keyboard accessibility on the primary route (`/book?broken=1`) while `/health` still reports a false-green `200 OK`, STILL:
1. **Detects** the real DOM keyboard trap via a deterministic Playwright browser journey probe (`scripts/journey-probe.mjs`),
2. **Bridges** affected citizens immediately to a zero-JS WCAG 2.1 AA failover route (`/simple`) backed by the **exact same transactional Neon PostgreSQL capacity lock and HMAC-SHA256 capability boundary**,
3. **Synchronizes** an idempotent incident envelope (`fingerprint: 66973bc4cdf2616d`) to GitLab Issues (`scripts/sync-gitlab-incident.mjs`),
4. **Invokes** an authentic multi-step **GitLab Duo Agent Platform `software_development` workflow (`#10006279`)** that reads the issue, greps the repository, and proposes a minimal 1-line fix (`if (brokenMode && !repairedMode)`), and
5. **Verifies** the staged repair on **Merge Request `!1`** (`Pipeline #2984938201` `PASSED`) and `/book?broken=1&repaired=1` while holding production promotion at an explicit **Human Release Gate**.

[![GitLab CI](https://gitlab.com/vaibhav.lalwani/still/badges/main/pipeline.svg)](https://gitlab.com/vaibhav.lalwani/still/-/pipelines)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Vercel%20%2B%20Neon%20Postgres-Live-success)](https://still-continuity.vercel.app)

---

## Live Links & Auditable Proof of Execution

- **Production Application (Vercel + Neon PostgreSQL):** [https://still-continuity.vercel.app](https://still-continuity.vercel.app)
- **Primary Booking Journey (`/book`):** [https://still-continuity.vercel.app/book](https://still-continuity.vercel.app/book)
- **Controlled Keyboard Regression (`/book?broken=1`):** [https://still-continuity.vercel.app/book?broken=1](https://still-continuity.vercel.app/book?broken=1)
- **Staged GitLab Duo Repair Preview (`/book?broken=1&repaired=1`):** [https://still-continuity.vercel.app/book?broken=1&repaired=1](https://still-continuity.vercel.app/book?broken=1&repaired=1)
- **Accessible WCAG 2.1 AA Fallback (`/simple`):** [https://still-continuity.vercel.app/simple](https://still-continuity.vercel.app/simple)
- **Authoritative Health & Persistence Metadata (`/health`):** [https://still-continuity.vercel.app/health](https://still-continuity.vercel.app/health)
- **Primary GitLab Repository (`88027269`):** [https://gitlab.com/vaibhav.lalwani/still](https://gitlab.com/vaibhav.lalwani/still)
- **Tracked Accessibility Incident (`Issue #1` + Probe Note `#4083003631`):** [https://gitlab.com/vaibhav.lalwani/still/-/issues/1#note_4083003631](https://gitlab.com/vaibhav.lalwani/still/-/issues/1#note_4083003631)
- **Provisioned Hackathon Mirror Incident (`88027224` `Issue #1` + Note `#4083003661`):** [https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/still/-/issues/1#note_4083003661](https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/still/-/issues/1#note_4083003661)
- **Authentic GitLab Duo Agent Platform Workflow (`#10006279`):** [https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279](https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279) ([CI Workload Job `#17440095179`](https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/jobs/17440095179))
- **Genuine Repair Merge Request (`!1` — Open at Human Gate):** [https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1](https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1)
- **Passing Repair MR CI Pipeline (`#2984938201`):** [https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201](https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201)
- **Eligibility Baseline & Evidence Ledger:** [`docs/omega-baseline.md`](docs/omega-baseline.md) · [`docs/omega-evidence.md`](docs/omega-evidence.md) · [`duo/session.json`](duo/session.json)
- **Visual Design System & 6-Viewport Audit:** [`DESIGN.md`](DESIGN.md) · [`docs/visual-rescue-audit.md`](docs/visual-rescue-audit.md) · [`apps/web/e2e/visual-contract.spec.ts`](apps/web/e2e/visual-contract.spec.ts)
- **Narrated Demo Film:** `media/final/still-demo.mp4` (`1920x1080` Full HD, `95.84s`, H.264 + 48kHz AAC stereo narration + SRT/VTT captions `media/final/still-demo.srt` / `apps/web/public/media/still-demo.vtt`)

---

## Architecture & Closed-Loop Lifecycle

1. **Rail A — Browser Journey Probe (`scripts/journey-probe.mjs`) vs False-Green `/health`:**
   - Standard uptime monitors only check `GET /health` (`200 OK`), missing client-side keyboard traps.
   - `scripts/journey-probe.mjs` drives headless Chromium across `/book` (`PASSED`), `/book?broken=1` (`FAILED` on `Space` key slot selection while `/health` is `200 OK`), `/simple` (`VERIFIED`), and `/book?broken=1&repaired=1` (`VERIFIED`), emitting `artifacts/incident-envelope.json` (`fingerprint: 66973bc4cdf2616d`).

2. **Rail B — Accessible Fallback (`/simple`) with Shared Transactional Store & P0-01 Capability Gate:**
   - Zero-JS WCAG 2.1 AA native radio form (`0` violations on `@axe-core/playwright`).
   - Commits to the **shared Neon PostgreSQL database** (`apps/web/lib/server-store.ts`) inside a `BEGIN ... COMMIT` transaction with `pg_advisory_xact_lock` and atomic slot capacity decrement.
   - **P0-01 Capability Gate:** Every booking issues an HMAC-SHA256 capability token (`cap_...`). Reading `GET /api/v1/booking/[id]` or `GET /api/v1/bookings/[id]` without a valid token returns `401 Unauthorized` with zero PII leakage.

3. **Rail C — GitLab Duo Agent Platform Workflow (`#10006279`), Repair MR `!1`, & Incident Memory Engine:**
   - Defined in `.gitlab/duo/flows/still-continuity-repair.yaml` and invoked via `POST /api/v4/ai/duo_workflows/workflows` (`gitlab/flows/duo-trigger.sh`).
   - **Persistent Incident Memory:** 4 PostgreSQL tables (`incident_events`, `repair_attempts`, `verified_lessons`, `memory_evaluations`) store verified repair lessons guarded by `sanitizeLessonRecipe()` prompt-injection filtering and a 16-row paired evaluation benchmark (`docs/memory-evaluation-results.json`).

---

## Verification Suites & Commands

```bash
# 1. Rust workspace formatting, lints, and unit/integration tests (8/8 passing)
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace

# 2. Web TypeScript, ESLint, and Vitest + isolated-schema Postgres integration suite (12/12 passing)
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web test

# 3. Playwright E2E + Axe WCAG 2.1 AA + 6-Viewport Visual Contract suite (16/16 passing)
npm --prefix apps/web run test:e2e

# 4. Real Browser Journey Probe & Idempotent GitLab Incident Sync
node scripts/journey-probe.mjs
node scripts/sync-gitlab-incident.mjs

# 5. Live production verification against https://still-continuity.vercel.app (15/15 passing)
node scripts/live-verify.mjs
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
