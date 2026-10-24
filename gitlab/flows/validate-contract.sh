#!/bin/sh
set -eu

fail() {
  printf '%s\n' "VALIDATION_FAILED: $*" >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || fail "jq is required"

test -f .gitlab-ci.yml || fail ".gitlab-ci.yml is missing"
test -f contracts/journey-contract.v1.json || fail "journey contract is missing"
test -f gitlab/flows/duo-trigger.contract.json || fail "Duo trigger contract is missing"
test -f gitlab/flows/duo-trigger.sh || fail "Duo trigger adapter is missing"
test -f infra/docker/rust-next.Dockerfile || fail "Docker packaging path is missing"

jq empty contracts/journey-contract.v1.json
jq empty gitlab/flows/duo-trigger.contract.json

jq -e '
  .properties.method.const == "POST" and
  .properties.path.const == "/api/v4/ai/duo_workflows/workflows" and
  (.properties.protected_environment_variables.items.enum | index("GITLAB_ACCESS_TOKEN")) != null and
  (.properties.protected_environment_variables.items.enum | index("GITLAB_PROJECT_ID")) != null and
  .properties.safety.properties.manual_only.const == true and
  .properties.safety.properties.no_automatic_deploy.const == true
' gitlab/flows/duo-trigger.contract.json >/dev/null || fail "Duo trigger contract invariants are not satisfied"

if grep -nE '(^|[[:space:]])set[[:space:]]+-x|echo[[:space:]].*GITLAB_ACCESS_TOKEN|curl.*[[:space:]]-[vV]' \
  gitlab/flows/duo-trigger.sh >/dev/null 2>&1; then
  fail "Duo trigger adapter contains a token/logging footgun"
fi

mkdir -p validation
printf '%s\n' \
  'status=PASS' \
  'ci_yaml=present (full GitLab CI lint remains a GitLab-side check)' \
  'journey_contract=json-valid' \
  'duo_trigger_contract=json-valid' \
  'duo_trigger_secret_policy=checked' \
  'docker_packaging_path=present' > validation/summary.txt
cat validation/summary.txt
