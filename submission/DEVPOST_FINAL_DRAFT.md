# STILL — GitLab Transcend Hackathon Submission

## Project Title
**STILL** — *The form broke. The appointment didn't.*

## Autonomy Level & Track Classification
**Supervised Closed-Loop Continuity & GitLab Duo Agent Platform Repair Workflow**  
*(Autonomous Playwright Browser Probe -> Idempotent GitLab Incident Sync -> Authentic GitLab Duo Agent Platform Multi-Step Root-Cause & Patch Generation -> Open Repair Merge Request `!1` + Passing MR CI `#2984938201` -> Staged Verification `/book?broken=1&repaired=1` -> Human Production Release Gate)*

---

## Verified Links & Auditable GitLab Evidence
- **Live Production App (Vercel + Neon PostgreSQL):** [https://still-continuity.vercel.app](https://still-continuity.vercel.app)
- **Primary Booking Route (`/book`):** [https://still-continuity.vercel.app/book](https://still-continuity.vercel.app/book)
- **Controlled Keyboard Regression (`/book?broken=1`):** [https://still-continuity.vercel.app/book?broken=1](https://still-continuity.vercel.app/book?broken=1)
- **Staged GitLab Duo Repair Preview (`/book?broken=1&repaired=1`):** [https://still-continuity.vercel.app/book?broken=1&repaired=1](https://still-continuity.vercel.app/book?broken=1&repaired=1)
- **Accessible WCAG 2.1 AA Fallback (`/simple`):** [https://still-continuity.vercel.app/simple](https://still-continuity.vercel.app/simple)
- **Public GitLab Repository (`88027269`):** [https://gitlab.com/vaibhav.lalwani/still](https://gitlab.com/vaibhav.lalwani/still)
- **Tracked Accessibility Incident (`Issue #1` + Probe Note `#4083003631`):** [https://gitlab.com/vaibhav.lalwani/still/-/issues/1#note_4083003631](https://gitlab.com/vaibhav.lalwani/still/-/issues/1#note_4083003631)
- **Provisioned Hackathon Mirror Incident (`88027224` `Issue #1` + Note `#4083003661`):** [https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/still/-/issues/1#note_4083003661](https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/still/-/issues/1#note_4083003661)
- **Authentic GitLab Duo Agent Platform Workflow (`#10006279`):** [https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279](https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279) ([Workload Runner Job `#17440095179`](https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/jobs/17440095179))
- **Genuine Repair Merge Request (`!1` — Held at Human Release Gate):** [https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1](https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1)
- **Passing Repair MR CI Pipeline (`#2984938201`):** [https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201](https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201)
- **Narrated Sub-3-Minute Demo Film:** `media/final/still-demo.mp4` (`1920x1080` Full HD, H.264 + 48kHz AAC stereo narration + SRT captions)

---

## The Problem: False-Green Uptime vs. Real Accessibility Outages
Public-sector and university advising portals rarely fail with a clean HTTP 500. They fail silently in the DOM: a custom event handler or `tabIndex={-1}` ships to production, locking keyboard-only and screen-reader users out of selecting an appointment slot while `GET /health` continues reporting `200 OK`. While engineering triages the defect, real citizens lose their advising seats.

---

## How STILL OMEGA Solves It

### 1. Real Browser Regression Detection (`scripts/journey-probe.mjs`)
Instead of trusting HTTP 200 health checks, STILL runs a headless Playwright browser probe that executes keyboard-only (`Tab` + `Space`) slot selection against `/book` (`PASSED`) and `/book?broken=1` (`FAILED` with `slot-card-slot-01` stuck at `aria-pressed="false"` while `/health` returns `200 OK`). It computes a deterministic incident fingerprint (`66973bc4cdf2616d`) and idempotently syncs structured evidence to GitLab Issue `#1` (`scripts/sync-gitlab-incident.mjs`).

### 2. Immediate Citizen Continuity (`/simple` + Neon PostgreSQL + P0-01 Capability Gate)
The moment keyboard stagnation is detected, STILL's Continuity Signal bridges the user to `/simple`—a zero-JS WCAG 2.1 AA native radio form that commits to the **exact same Neon PostgreSQL database** (`apps/web/lib/server-store.ts`) inside a `BEGIN ... COMMIT` transaction guarded by `pg_advisory_xact_lock` and atomic slot capacity decrement. Every booking issues an HMAC-SHA256 capability token (`cap_...`); unauthenticated readback attempts return `401 Unauthorized`.

### 3. Authentic GitLab Duo Agent Platform Repair (`#10006279` -> `MR !1` -> `Pipeline #2984938201`)
STILL triggers an authentic **GitLab Duo Agent Platform `software_development` workflow (`#10006279`)** via `POST /api/v4/ai/duo_workflows/workflows` (`.gitlab/duo/flows/still-continuity-repair.yaml`). Running in GitLab CI workload job `#17440095179` (`14` LangGraph checkpoints), the agent called `list_issue_notes` (`toolu_vrtx_016D21DT4ykVQ2BVZMRGh8KB`) on `vaibhav.lalwani/still#1`, executed 3 repository `grep` calls (`toolu_vrtx_01Po2cYoTCo7rEYfzuHtN5r8`, `toolu_vrtx_01GFLVxsM5mZvKfaSMuicwdv`, `toolu_vrtx_01KvUxMptKin8jebn3f13d4P`), synthesized the minimal 1-line fix in `apps/web/components/booking-flow.tsx` (`if (brokenMode && !repairedMode)`), and paused at `plan_approval_required`. The proposed patch is committed on branch `fix/issue-1-slot-keyboard-focus-guard` in **Merge Request `!1`**, verified by passing **GitLab CI Pipeline `#2984938201`** and staged route `/book?broken=1&repaired=1`, and held at an explicit **Human Release Gate**.

### 4. PostgreSQL Incident Memory & Paired Evaluation Engine
STILL persists verified repair recipes in 4 PostgreSQL tables (`incident_events`, `repair_attempts`, `verified_lessons`, `memory_evaluations`) guarded by `sanitizeLessonRecipe()` prompt-injection filtering. Across an 8-scenario (`16`-row) deterministic replay benchmark (`docs/memory-evaluation-results.json`), fingerprint-matched memory recall reduces candidate localization attempts from `3.63` (`memory_off`) to `1.00` (`memory_on`) while avoiding wrong-file edits (`100%` vs `25%`).

---

## Honest Eligibility & Namespace Disclosure
- **Authorized Hackathon Group Execution (`VERIFIED`):** Workflow `#10006279` ran on `gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate` (`85690760`) using user `vaibhav.lalwani`'s active `gitlab-community/community-members/duo-users` (`93256296`) seat, and Session `#10006211` + Issue `#1` (`207790101`) were created on `gitlab-community/community-projects/2026-02-ai-hackathon/still` (`88027224`).
- **Personal Namespace Limitation (`BLOCKED`):** Direct `POST /api/v4/ai/duo_workflows/workflows` on personal project `vaibhav.lalwani/still` (`88027269`) returns `HTTP 403 Forbidden (forbidden to access duo workflow)` because GitLab Duo Agent Platform requires a group namespace with Duo Agent Platform enabled.
- **Transcend Subgroup (`BLOCKED`):** Subgroup `gitlab-ai-hackathon/transcend-october-2026` (`142538134`) requires organizer membership approval via `https://contributors.gitlab.com/hackathon`.
