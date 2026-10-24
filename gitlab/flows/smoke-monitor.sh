#!/bin/sh
# STILL OMEGA — Bounded HTTP Liveness & Capability Boundary Monitor
# NOTE: HTTP 200 on /health proves server & DB liveness ONLY (False-Green for DOM accessibility).
# Real browser keyboard journey verification is executed by `node scripts/journey-probe.mjs`.
set -eu

fail() {
  printf '%s\n' "MONITOR_BLOCKED: $*" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || fail "curl is required"

target="${STILL_CANDIDATE_URL:-}"
if [ -z "$target" ]; then
  printf '%s\n' 'status=BLOCKED' 'reason=STILL_CANDIDATE_URL is not configured as a protected variable' >&2
  exit 1
fi

case "$target" in
  http://*|https://*) ;;
  *) fail "STILL_CANDIDATE_URL must use http:// or https://" ;;
esac

case "$target" in
  *'@'*) fail "STILL_CANDIDATE_URL must not include userinfo" ;;
esac

max_requests="${STILL_MONITOR_MAX_REQUESTS:-3}"
timeout_seconds="${STILL_MONITOR_TIMEOUT_SECONDS:-5}"
case "$max_requests" in
  ''|*[!0-9]*) fail "STILL_MONITOR_MAX_REQUESTS must be numeric" ;;
esac
case "$timeout_seconds" in
  ''|*[!0-9]*) fail "STILL_MONITOR_TIMEOUT_SECONDS must be numeric" ;;
esac
[ "$max_requests" -ge 1 ] && [ "$max_requests" -le 3 ] || fail "STILL_MONITOR_MAX_REQUESTS must be between 1 and 3"

request=1
while [ "$request" -le "$max_requests" ]; do
  if curl --silent --fail --max-time "$timeout_seconds" --output /dev/null "${target%/}/health" && \
     curl --silent --fail --max-time "$timeout_seconds" --output /dev/null "${target%/}/api/v1/services"; then
    unauth_code=$(curl --silent --max-time "$timeout_seconds" --output /dev/null --write-out '%{http_code}' "${target%/}/api/v1/booking/still-monitor-probe" || true)
    if [ "$unauth_code" = "401" ]; then
      printf '%s\n' 'status=PASS' "requests=$request" 'health=200_http_liveness_only' 'services=200' 'capability_gate=401_verified' 'browser_journey_probe=see_scripts_journey_probe_mjs' 'target=configured (URL not printed)'
      exit 0
    fi
  fi
  request=$((request + 1))
done

printf '%s\n' 'status=FAIL' "requests=$max_requests" 'reason=bounded probe failed' >&2
exit 1
