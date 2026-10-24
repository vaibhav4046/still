# AGENTS.md — STILL OMEGA (Codex & Autonomous Agent Guide)

This repository is **100% self-contained** and runs all unit tests, integration tests, Next.js builds, and Playwright E2E / visual-contract checks **with zero remote environment variables required**.

## Zero-Remote-Environment Architecture

- **Automatic Offline Transactional Engine (`apps/web/lib/server-store.ts`):**
  - When `DATABASE_URL` is configured (e.g., on Vercel production `https://still-continuity.vercel.app`), `serverStore` uses `PgStore` backed by Neon PostgreSQL (`backend: "postgres (Neon)"`).
  - When `DATABASE_URL` is **unset** or set to `memory://isolated` (e.g., inside ChatGPT Codex, local sandboxes, or CI containers without external database credentials), `serverStore` automatically switches to `OfflineMemoryStore` (`backend: "postgres (offline-memory-engine)"`), providing:
    - Full transactional mutex-serialized slot capacity decrement (`12`-way concurrency race test passes deterministically: `1` winner `201`, `11` conflicts `409`),
    - Constant-time HMAC-SHA256 booking capability verification (`P0-01` `401` readback gate),
    - Idempotency-Key replay (`200`) and payload-mismatch conflict (`409`),
    - Persistent Incident Memory tables (`incident_events`, `repair_attempts`, `verified_lessons`, `memory_evaluations` with `16` paired `memory_off`/`memory_on` rows and `sanitizeLessonRecipe()` prompt-injection filtering).

## Commands (No Remote Environment Needed)

```bash
# 1. Install web dependencies (if needed)
npm --prefix apps/web install

# 2. Run all 12 Vitest unit + integration tests (runs in ~850ms offline)
npm --prefix apps/web test

# 3. TypeScript & ESLint verification
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint

# 4. Production Next.js build
npm --prefix apps/web run build

# 5. Playwright E2E + Axe WCAG 2.1 AA + 6-Viewport Visual Contract (16 tests)
npm --prefix apps/web run test:e2e

# 6. Rust workspace tests (8 tests across still-core, still-domain, still-journey-contract)
cargo test --workspace
```

## Repository Map

- `DESIGN.md` — Authoritative visual design contract (`THE QUIET CONTROL ROOM`).
- `docs/rescue-pack/` — Complete `STILL_DESIGN_RECOVERY_OCT24` specifications (`prompt/ARGON_HIGH_VISUAL_RESCUE.txt`, `design/DESIGN.md`, `qa/VISUAL_ACCEPTANCE.md`, `qa/SCREENSHOT_AUTOPSY.md`, `video/FILM.md`, `source/REFERENCES.md`).
- `docs/visual-rescue-audit.md` — Eight-perspective visual & accessibility review with concrete screenshot evidence.
- `docs/omega-baseline.md` & `docs/omega-evidence.md` — GitLab Duo Agent Platform eligibility baseline and lifecycle ledger (`Issue #1` → `Duo Workflow #10006279` → `MR !1` → `Pipeline #2984938201`).
- `artifacts/design/` — Before (`before-<w>x<h>.png`) and after (`after-<w>x<h>.png`, `still-<w>x<h>.png`) screenshots across all 6 viewports (`320x720`, `390x844`, `768x1024`, `1024x768`, `1440x900`, `1920x1080`).
- `apps/web/` — Next.js 16 operator console, `/book`, `/book?broken=1`, `/book?broken=1&repaired=1`, `/simple`, `/health`, `/api/v1/*`, and Playwright/Vitest suites.
- `crates/` — Rust workspace (`still-core`, `still-domain`, `still-journey-contract`).
- `.gitlab/duo/flows/still-continuity-repair.yaml` & `gitlab/flows/` — GitLab Duo Agent Platform Flow Registry YAML and CI scripts.
- `media/final/still-demo.mp4` & `apps/web/public/media/still-demo.mp4` — `1920x1080` Full HD narrated demo video (`95.84s`, H.264 + AAC) + `.srt` / `.vtt` subtitles.
