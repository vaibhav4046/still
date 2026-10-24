#!/bin/sh
set -eu

: "${STILL_RELEASE_APPROVED:?STILL_RELEASE_APPROVED must be set explicitly for a governed release}"
: "${STILL_RELEASE_EVIDENCE_URI:?STILL_RELEASE_EVIDENCE_URI must identify a reviewed evidence artifact}"

if [ "$STILL_RELEASE_APPROVED" != "true" ]; then
  printf '%s\n' 'DEPLOY_BLOCKED: STILL_RELEASE_APPROVED is not true' >&2
  exit 1
fi

case "$STILL_RELEASE_EVIDENCE_URI" in
  http://*|https://*|gitlab-artifact://*) ;;
  *)
    printf '%s\n' 'DEPLOY_BLOCKED: STILL_RELEASE_EVIDENCE_URI must be an HTTP(S) or GitLab artifact URI' >&2
    exit 1
    ;;
esac

printf '%s\n' \
  'status=PASS' \
  'policy=explicit evidence approval only' \
  'automatic_merge=false' \
  'automatic_deploy=false'
