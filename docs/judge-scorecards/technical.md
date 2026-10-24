# Technical scorecard

| Dimension | Evidence | Status |
| --- | --- | --- |
| Authoritative persistence | Rust API + SQLite integration run | PROVEN locally |
| Retry safety | Idempotency replay/conflict checks | PROVEN locally |
| Fallback continuity | Playwright `/simple` test | PROVEN locally |
| Fail-closed evidence | Journey contract unit tests | PROVEN locally |
| Remote automation | GitLab CI Pipelines #2983463061 (push) and #2983490693 (scheduled smoke_monitor) | PROVEN on GitLab Shared Runners |
| Public readiness | Live URL https://still-continuity.vercel.app verified via smoke monitor (requests=1, status=PASS) | PROVEN live on Vercel |
