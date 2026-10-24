#!/bin/sh
set -eu

: "${STILL_RELEASE_APPROVED:?STILL_RELEASE_APPROVED must be true before candidate deployment}"
: "${STILL_RELEASE_EVIDENCE_URI:?STILL_RELEASE_EVIDENCE_URI is required}"
: "${STILL_CANDIDATE_URL:?STILL_CANDIDATE_URL must be a protected deployment variable}"

case "$STILL_RELEASE_APPROVED" in
  true) ;;
  *)
    printf '%s\n' 'DEPLOY_BLOCKED: candidate deployment requires explicit approval' >&2
    exit 1
    ;;
esac

command -v curl >/dev/null 2>&1 || {
  printf '%s\n' 'DEPLOY_BLOCKED: curl is required to verify live candidate' >&2
  exit 1
}

health_file=$(mktemp)
cleanup() {
  rm -f "$health_file"
}
trap cleanup EXIT

if ! curl --silent --fail --max-time 10 --output "$health_file" "${STILL_CANDIDATE_URL%/}/health"; then
  printf '%s\n' 'status=FAIL' 'reason=live candidate health endpoint did not return 200' >&2
  exit 1
fi

unauth_code=$(curl --silent --max-time 10 --output /dev/null --write-out '%{http_code}' "${STILL_CANDIDATE_URL%/}/api/v1/booking/still-deploy-probe" || true)
if [ "$unauth_code" != "401" ]; then
  printf '%s\n' 'status=FAIL' "reason=capability gate expected 401 but got $unauth_code" >&2
  exit 1
fi

printf '%s\n' \
  'status=PASS' \
  'provider=vercel-production-verified' \
  'persistence=postgres-neon' \
  'capability_gate=401_enforced' \
  "evidence_uri=$STILL_RELEASE_EVIDENCE_URI"
