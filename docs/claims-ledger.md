# Claims ledger

| Claim | Status | Evidence |
| --- | --- | --- |
| Primary booking persists a real record | PROVEN locally | `cargo test --workspace` (6 passing), Playwright `e2e/booking.spec.ts` (3 passing), SQLite readback |
| Idempotent retry does not create a second booking | PROVEN locally | API integration run with repeated `Idempotency-Key` returned the same booking ID |
| Duplicate idempotency key with changed request is rejected | PROVEN locally | API integration run returned HTTP 409 |
| Accessible fallback completes the same journey | PROVEN locally | Playwright fallback test on `/simple` |
| Operator console reads stored service state | PROVEN locally | Playwright operator-console test and `/api/v1/operator/summary` |
| Evidence evaluation fails closed on SHA mismatch | PROVEN in unit tests | `still-journey-contract` test suite |
| Operator console has no detectable WCAG 2.1 A/AA violations | PROVEN locally | `apps/web/evidence/axe-run.log`: 3 passed (18.3s), zero violations |
| Primary booking has no detectable WCAG 2.1 A/AA violations | PROVEN locally | `apps/web/evidence/axe-run.log`: 3 passed (18.3s), zero violations |
| Accessible fallback has no detectable WCAG 2.1 A/AA violations | PROVEN locally | `apps/web/evidence/axe-run.log`: 3 passed (18.3s), zero violations |
| Axe harness detects real violations (not silently passing) | PROVEN locally | `apps/web/evidence/axe-run-pre-fix.log`: 3 failed on `label-content-name-mismatch` (serious) at `.brand`, `.quiet-button` |
| End-to-end suite runs with one command | PROVEN locally | `npm run test:e2e` in `apps/web`: 3 passed (1.6m) via auto-started API and Next dev server |
| Production frontend dependencies have zero known vulnerabilities | PROVEN locally | `npm audit --omit=dev`: 0 vulnerabilities |
| Dev toolchain dependencies are fully clean | PARTIAL | `npm audit`: 8 advisories (1 moderate, 5 high, 2 critical) in dev dependencies only |
| GitLab Duo actually executed a repair | BLOCKED | Authorized GitLab session, job, MR, and evidence artifact |
| Remote scheduled monitoring actually ran | BLOCKED | GitLab pipeline/job receipt or equivalent remote run artifact |
| Public deployment is live | BLOCKED | Authorized public URL and independent smoke check |
| Final 4K demo exists | PROVEN locally | media/final/still-demo.mp4: H.264, 3840x2160, yuv420p, 25 fps, 31.0 s, 3,991,905 bytes; ffprobe exit 0 |
| Final demo is published | BLOCKED | No upload or public URL; local MP4 only |
