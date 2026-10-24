# STILL OMEGA — Phase 0 Baseline & GitLab Duo Agent Platform Eligibility Audit

**Generated:** `2026-10-24T17:43:00Z`  
**Primary Repository:** `https://gitlab.com/vaibhav.lalwani/still` (Project ID: `88027269`)  
**Provisioned Hackathon Mirror:** `https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/still` (Project ID: `88027224`)  
**Live Production URL:** `https://still-continuity.vercel.app`  

---

## 1. Executive Summary (Priority 0 Audit)

Before implementing the STILL OMEGA upgrades, an adversarial baseline audit was performed against the repository, live production deployment, and GitLab's REST and GraphQL AI APIs.

### What Was Already Verified (True Baseline)
- **Live Next.js + Neon PostgreSQL Continuity Portal (`PASS`):** `/`, `/book`, `/book?broken=1`, and `/simple` are deployed at `https://still-continuity.vercel.app` and backed by transactional Neon PostgreSQL (`apps/web/lib/server-store.ts`) using `pg_advisory_xact_lock` and atomic slot capacity decrement (`UPDATE slots SET remaining_capacity = remaining_capacity - 1 WHERE id = $1 AND remaining_capacity > 0`).
- **P0-01 Capability-Gated Readback (`PASS`):** `GET /api/v1/booking/[id]` requires a constant-time verified HMAC-SHA256 `x-booking-capability` header (`crypto.timingSafeEqual`). Unauthenticated requests return `401 Unauthorized` with `Cache-Control: no-store` and leak zero attendee PII.
- **Automated Test Suites (`PASS`):**
  - Rust workspace (`cargo test --workspace`): `8/8` passing (`services/booking-api` + `crates/continuity-kernel`).
  - Web unit + isolated-schema Postgres concurrency tests (`vitest`): `10/10` passing.
  - Playwright E2E + `@axe-core/playwright` WCAG 2.1 AA + `320px`/`768px`/`1440px` responsive overflow checks: `9/9` passing.
  - Live production verification (`scripts/live-verify.mjs`): `14/14` passing.

### Contradictions & Gaps Identified and Remediated in STILL OMEGA
1. **Conflation of Legacy Duo Chat (`aiAction`) with Duo Agent Platform Workflows:**
   - *Finding:* `gitlab/flows/duo-trigger.sh` previously fell back to GraphQL `mutation { aiAction(input: { chat: ... }) }` when `/api/v4/ai/duo_workflows/workflows` was not configured or returned non-`201`, and still emitted `status=PASS`.
   - *Remediation:* GraphQL `aiAction` is a single-turn chat completion (`mode=gitlab_duo_graphql_aiAction_chat_only`), **not** a multi-step GitLab Duo Agent Platform workflow (`duo_workflows`). `gitlab/flows/duo-trigger.sh` now explicitly separates `agent_platform_flow_status` from `assisted_chat_diagnosis_status` and never converts a `403`/`422` `BLOCKED` response into `PASS`.
2. **HTTP-Only Smoke Monitor Blindness to Keyboard Traps:**
   - *Finding:* `gitlab/flows/smoke-monitor.sh` only probed `/health` (`200`), `/api/v1/services` (`200`), and `/api/v1/booking/still-monitor-probe` (`401`). When `/book?broken=1` injected `tabIndex={-1}` onto all slot radio inputs, `/health` still returned `200 OK`, so the HTTP smoke monitor could not detect the WCAG 2.1.1 keyboard accessibility failure.
   - *Remediation:* Added `scripts/journey-probe.mjs`, a real headless Playwright keyboard journey monitor that tabs through `/book`, `/book?broken=1`, and `/simple`, detects the `tabIndex={-1}` keyboard focus failure via live DOM focus inspection, emits a deterministic SHA-256 incident envelope (`artifacts/incident-envelope.json`), and idempotently syncs with GitLab Issues (`scripts/sync-gitlab-incident.mjs`).
3. **Missing Merge Request in the Auditable Trace:**
   - *Finding:* Earlier commits were pushed directly to `main`, leaving `https://gitlab.com/vaibhav.lalwani/still/-/merge_requests` empty.
   - *Remediation:* Created a genuine candidate repair branch and real GitLab Merge Request (`!1`) linked to Issue `#1` and the Duo Agent Platform session, validated by a Merge Request CI pipeline with a manual human release gate.
4. **Illustrative Baseline Numbers in `KimiShowcase`:**
   - *Finding:* `apps/web/components/kimi-showcase.tsx` previously included two static illustrative baseline rows (`Standard Unmonitored Portal: 68.4%`, `Unlocked Read-Modify-Write: 41.5%`).
   - *Remediation:* Removed all unmeasured comparison baselines and replaced them with raw, auditable telemetry from `scripts/live-verify.mjs` and the deterministic PostgreSQL Incident Memory Evaluation Engine (`memory_off` vs `memory_on` across 8 reproducible fault scenarios).

---

## 2. Official GitLab Duo Agent Platform Eligibility & Namespace Audit

Authenticated User: `vaibhav.lalwani` (`id: 22113347`)  
Token Scopes Verified (`GET /api/v4/personal_access_tokens/self`): `api`, `ai_features`, `read_repository`, `write_repository`, `read_api`, `create_runner`, `manage_runner`

| Target Namespace / Project | ID | Role / Access | `POST /api/v4/ai/duo_workflows/workflows` Result | Status & Exact Diagnosis |
| :--- | :--- | :--- | :--- | :--- |
| `vaibhav.lalwani/still` (Personal Namespace) | `88027269` | Owner (`50`) | `HTTP 403`: `{"message":"403 Forbidden - forbidden to access duo workflow"}` | **`BLOCKED` (Personal Namespace):** GitLab Duo Agent Platform `duo_workflows` is restricted to Ultimate/Duo group namespaces and cannot run directly on personal user namespaces. GraphQL Duo Chat (`aiAction` request `cc7e274a-16f1-4445-91a1-d93cdf03a68f`) works (`PASS` as Assisted Chat). |
| `gitlab-community/community-members/duo-users` | `93256296` | Developer (`30`) | `HTTP 201 Created`: Session `#10006162` (`https://gitlab.com/groups/gitlab-community/-/automate/agent-sessions/10006162`) | **`VERIFIED` (Seat Entitlement):** Confirms `vaibhav.lalwani` holds an active GitLab Duo Agent Platform seat (`agent_privileges`: `[1,2,3,4,5,6,7,8]`). Remote runner execution (`start_workflow: true`) requires a `project_id` (`HTTP 422: Only project-level workflow is supported`). |
| `gitlab-community/community-projects/2026-02-ai-hackathon/still` | `88027224` | Developer (`30`) | Session creation: `HTTP 201 Created` (`#10006211`). With `start_workflow: true`: `HTTP 422` (`{"message":"Repository is empty","reason":"repository_empty"}`) | **`PARTIAL / BLOCKED ON INITIAL COMMIT`:** Provisioned for `vaibhav.lalwani` on `2026-10-24T00:06:05Z` with `empty_repo: true`. Group `121614317` has `default_branch_protection: 2` (Maintainers only for initial commit), so Developer (`30`) role receives pre-receive hook rejection on initial `git push`. Issue `#1` (`id: 207790101`) and Agent Session `#10006211` are created and verified on `88027224`. |
| `gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate` (branch `still-omega`) | `85690760` | Developer (`30`) | `HTTP 201 Created` with `start_workflow: true`: **Workflow `#10006279`**, Workload Job `#17440095179` (`workload.id: 3977258`), `14` LangGraph checkpoints, `status: plan_approval_required` | **`VERIFIED` (Live Multi-Step Agent Platform Execution):** Because `85690760` in the same `gitlab-community` hackathon group was initialized with a template commit, syncing STILL's `booking-flow.tsx` and `booking-page.tsx` to branch `still-omega` (`commit 5cc4da2a`) allowed a full remote Duo Agent Platform `software_development` workflow (`#10006279`) to run live, call `list_issue_notes` on `vaibhav.lalwani/still#1` (`88027269`), run `grep` on `apps/web/components/booking-flow.tsx`, produce the minimal WCAG 2.1 AA diff, create a 6-step plan (`toolu_vrtx_01PgASenYkxCQUTgS26oFknZ`), and pause at `plan_approval_required`. |
| `gitlab-ai-hackathon/transcend-october-2026` | `142538134` | Not a member (`404`) | N/A | **`BLOCKED` (Human Action Required):** Subgroup description states: *"One subgroup per participant is provisioned under here by contributors.gitlab.com."* User `22113347` has not yet been added to `142538134` (`request_access_enabled: true`). |

---

## 3. Authentic GitLab Duo Agent Platform Workflow Trace (`#10006279`)

Full machine-readable metadata is stored in [`duo/session.json`](../duo/session.json).

- **Workflow Session ID:** `10006279`
- **Session URL:** `https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279`
- **CI Workload Job:** `https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/jobs/17440095179` (`workload.id: 3977258`)
- **Source Branch & Commit:** `still-omega` (`5cc4da2a10cfb5c721b2ed88d33c7489546847f2`)
- **Cross-Project Issue Inspected by Agent:** `https://gitlab.com/vaibhav.lalwani/still/-/issues/1` (`project_id: 88027269`, `issue_iid: 1`, `tool_call_id: toolu_vrtx_016D21DT4ykVQ2BVZMRGh8KB`)
- **Code Inspection Tool Calls:**
  1. `grep` (`toolu_vrtx_01Po2cYoTCo7rEYfzuHtN5r8`) -> `apps/web/components/booking-flow.tsx:29`
  2. `grep` (`toolu_vrtx_01GFLVxsM5mZvKfaSMuicwdv`) -> `apps/web/components/booking-flow.tsx:280`
  3. `grep` (`toolu_vrtx_01KvUxMptKin8jebn3f13d4P`) -> `apps/web/components/booking-flow.tsx:50`
- **Agent Diagnosis (`lc_run--01a16f00-4b97-7592-92a4-bb650b22a380` at `2026-10-24T17:41:20Z`):**
  - Pinpointed `tabIndex={brokenPrimary ? -1 : undefined}` on `<input type="radio" name="slot" />` in `apps/web/components/booking-flow.tsx`.
  - Explained why `/simple` remains unaffected (`simpleMode=true` skips setting `brokenPrimary`).
  - Warned against replacing `-1` with `0` (which would break native single-tab-stop `radiogroup` roving semantics) and proposed removing the `tabIndex` override.
- **Human Checkpoint Reached (`request-0e950412-5f26-48f2-85be-662c79ecf504` at `2026-10-24T17:41:31Z`):**
  - `status: "plan_approval_required"` after `create_plan` (`toolu_vrtx_01PgASenYkxCQUTgS26oFknZ`).
