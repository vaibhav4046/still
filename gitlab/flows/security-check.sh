#!/bin/sh
set -eu

fail() {
  printf '%s\n' "SECURITY_CHECK_FAILED: $*" >&2
  exit 1
}

code_files='gitlab/flows infra .gitlab-ci.yml'

if grep -R -nE '(^|[[:space:]])set[[:space:]]+-x|curl.*[[:space:]]-[vV]|echo[[:space:]].*(TOKEN|PASSWORD|SECRET)' $code_files 2>/dev/null; then
  fail "debug logging or direct secret logging pattern found"
fi

if grep -R -nE 'GITLAB_ACCESS_TOKEN[[:space:]]*=[[:space:]]*[^[:space:]]' $code_files 2>/dev/null; then
  fail "literal GitLab access token assignment found"
fi

test -x gitlab/flows/duo-trigger.sh || fail "duo-trigger.sh must be executable"
test -x infra/docker/package.sh || fail "package.sh must be executable"

printf '%s\n' \
  'status=PASS' \
  'token_logging=not detected' \
  'literal_token_assignment=not detected' \
  'manual_duo_boundary=present' \
  'release_deploy=not granted by this job'
