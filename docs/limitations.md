# Current limitations

- Local persistence is SQLite. No PostgreSQL deployment or production concurrency claim is made.
- GitLab Duo, hosted deployment, and remote scheduled execution require external authorization and credentials that are not present in this workspace.
- The operator surface reads stored state; it does not pretend that a static dashboard is a live repair system.
- The internal scheduler routes require `x-still-scheduler-secret` and default to a local development secret only for local runs. Production use requires a protected variable.
- Booking readback is capability-protected by default. The creation response contains the one-time capability; readback does not echo it.
- The demo uses fictional appointment data and synthetic attendee records only.
- The full dependency audit currently reports development-tool findings; production dependencies report zero findings with `npm audit --omit=dev`.
