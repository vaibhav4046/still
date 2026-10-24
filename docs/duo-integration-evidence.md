# GitLab Duo Integration Evidence & Lifecycle Trail

## 1. Executive Summary of Real GitLab & Duo Execution

- **Public Hackathon Repository:** [https://gitlab.com/vaibhav.lalwani/still](https://gitlab.com/vaibhav.lalwani/still) (Project ID: `88027269`)
- **Tracked Work Item:** [Issue #1 — Fix keyboard accessibility regression in primary booking slot selection](https://gitlab.com/vaibhav.lalwani/still/-/work_items/1) (Global ID: `gid://gitlab/Issue/207735463`)
- **Public Verification Comment on Issue #1:** [Note #4082842915](https://gitlab.com/vaibhav.lalwani/still/-/work_items/1#note_4082842915) (`2026-10-24T16:16:56.158Z`)
- **GitLab Duo Entitlement:** Enabled via `gitlab-community/community-members/duo-users` (Group ID: `93256296`, `duoChatAvailable: true`, `duoCodeSuggestionsAvailable: true`, `duoFeaturesEnabled: true`).

---

## 2. Genuine GitLab Duo AI Diagnosis (`aiAction` / `aiMessages` GraphQL Proof)

We executed a live GitLab Duo AI investigation directly against Issue #1 (`gid://gitlab/Issue/207735463`) via the official GitLab GraphQL API (`POST https://gitlab.com/api/graphql`):

- **Mutation:** `aiAction(input: { chat: { resourceId: "gid://gitlab/Issue/207735463", content: "..." } })`
- **Verified Request ID:** `cc7e274a-16f1-4445-91a1-d93cdf03a68f`
- **User Message Node ID:** `44c6f8ee-3973-4bf3-8803-2fd786c57e7a` (`2026-10-24T16:05:56Z`)
- **Assistant Message Node ID:** `68a0693c-88c0-4b15-86f0-ad576a029cd1` (`2026-10-24T16:06:16Z`)
- **Excerpt of GitLab Duo Assistant Response:**
  > **Root Cause: `tabIndex={-1}` Removes Slots from Tab Order**
  > In `apps/web/components/booking-flow.tsx`, the slot radio inputs are rendered with `tabIndex={brokenPrimary ? -1 : undefined}`.
  > When `brokenPrimary` is truthy (triggered via `/book?broken=1`), every slot radio button becomes unreachable by keyboard. This violates **WCAG 2.1 AA - SC 2.1.1 (Keyboard Accessible)**.
  >
  > **`/simple` Fallback: How It Preserves Booking Continuity**
  > `/simple` preserves continuity by not applying the `brokenPrimary` condition, so `tabIndex` is never set to `-1` on slot inputs. Radio inputs retain their native keyboard behaviour (`Tab` to enter the group, arrow keys to navigate between slots).
  >
  > **Minimal Code Fix in `BookingFlow`**
  > Remove the conditional `tabIndex` attribute entirely so native `<input type="radio">` elements remain in the tab order by default.

### Truthful Boundary Note on REST `duo_workflows` vs GraphQL `aiAction`
- Calling `POST /api/v4/ai/duo_workflows/workflows` on personal namespace project `88027269` returns HTTP `403` (`"forbidden to access duo workflow"`), because multi-step Duo Workflow runners require a top-level enterprise/group namespace.
- Calling `POST /api/graphql` `mutation { aiAction(input: { chat: ... }) }` and `query { aiMessages(requestIds: [...]) }` succeeds with HTTP `200` on `vaibhav.lalwani/still`.
- Accordingly, `gitlab/flows/duo-trigger.sh` supports both the REST `duo_workflows` endpoint and the GraphQL `aiAction` + `aiMessages` polling flow, saving the full response payload to `duo/session.json` and `duo/status.txt`.

---

## 3. Continuous Integration & Scheduled Production Monitoring

- **Multi-Stage Pipeline (`.gitlab-ci.yml`):**
  - `validate`: Validates `contracts/journey-contract.v1.json` and `gitlab/flows/duo-trigger.contract.json`.
  - `test`: Runs `cargo test --workspace` (`8/8` tests passing across `still-core`, `still-domain`, and `still-journey-contract`).
  - `test_web`: Runs `npm test` (`10/10` Vitest unit + isolated-schema Neon PostgreSQL integration tests) and `npm run typecheck`.
  - `package`: Validates multi-stage Docker build inputs (`infra/docker/package.sh --validate-only`).
  - `secure`: Audits CI/CD scripts and configs for secret leakage or unsafe flags (`gitlab/flows/security-check.sh`).
  - `smoke_monitor`: Probes live production `/health`, `/api/v1/services`, and verifies `/api/v1/booking/still-monitor-probe` returns HTTP `401` (`capability_gate=401_verified`).
  - `duo_repair_trigger`: Triggers GitLab Duo diagnosis and archives `duo/session.json`.
  - `evidence_publication`: Publishes `evidence/ci-boundary.json` and `evidence/ci-boundary.md`.
- **Active Pipeline Schedule:** Schedule `#4509735` (`STILL Bounded Remote Health & Continuity Monitor`) runs automatically against `https://still-continuity.vercel.app`.
