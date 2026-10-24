# Local runbook

## Start the service

```bash
DATABASE_URL=sqlite://data/still.db STILL_BIND=127.0.0.1:8787 cargo run
```

## Start the web app

```bash
NEXT_PUBLIC_STILL_API_URL=http://127.0.0.1:8787 npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3000
```

## Check the golden path

1. Open `/book`.
2. Choose an available slot.
3. Submit a synthetic name and email.
4. Confirm the reference is returned by the API.
5. Open `/simple` and repeat with another available service/slot.
6. Open `/` and confirm service health and evidence counts are API-backed.

## Run a bounded monitor locally

```bash
curl -X POST http://127.0.0.1:8787/internal/monitor/run \
  -H 'content-type: application/json' \
  -H 'x-still-scheduler-secret: local-dev-only' \
  -d '{"source":"local-runbook","release_sha":"local"}'
```

This is a local proof only. It is not evidence of remote scheduled execution.
