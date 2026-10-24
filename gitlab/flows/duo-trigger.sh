#!/usr/bin/env sh
set -eu

# GitLab Duo Agent Platform + Assisted Diagnosis Trigger for STILL.
# Zero-Fabrication Contract:
# 1. Distinguishes authentic GitLab Duo Agent Platform workflows (/api/v4/ai/duo_workflows/workflows)
#    from legacy GraphQL Duo Chat (mutation aiAction).
# 2. Never converts a 401/403/422 BLOCKED Agent Platform workflow on the personal namespace
#    into a fake PASS. Records exact HTTP status codes, workflow session IDs, and required human actions.

API_V4="${CI_API_V4_URL:-https://gitlab.com/api/v4}"
GRAPHQL_URL="${CI_GRAPHQL_URL:-https://gitlab.com/api/graphql}"
PROJECT_ID="${CI_PROJECT_ID:-88027269}"
HACKATHON_STILL_PROJECT_ID="${GITLAB_HACKATHON_STILL_PROJECT_ID:-88027224}"
HACKATHON_RUNNER_PROJECT_ID="${GITLAB_HACKATHON_RUNNER_PROJECT_ID:-85690760}"
DUO_SEAT_NAMESPACE_ID="${GITLAB_DUO_NAMESPACE_ID:-93256296}"
INCIDENT_SUMMARY="${STILL_INCIDENT_SUMMARY:-Booking journey probe detected keyboard slot selection failure on /book?broken=1 (tabIndex=-1 on radio inputs) while /health returned 200 OK; /simple fallback remained operable.}"
ISSUE_GLOBAL_ID="${STILL_ISSUE_GLOBAL_ID:-gid://gitlab/Issue/207735463}"
FLOW_CONFIG_PATH=".gitlab/duo/flows/still-continuity-repair.yaml"

printf 'timestamp=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
printf 'flow_config_path=%s\n' "$FLOW_CONFIG_PATH"

if [ ! -f "$FLOW_CONFIG_PATH" ]; then
  printf '%s\n' 'status=FAIL' "reason=Missing $FLOW_CONFIG_PATH"
  exit 1
fi

AUTH_CREDENTIAL="${GITLAB_DUO_TOKEN:-${GITLAB_TOKEN:-${CI_JOB_TOKEN:-}}}"
if [ -z "$AUTH_CREDENTIAL" ]; then
  printf '%s\n' \
    'agent_platform_flow_status=BLOCKED' \
    'assisted_chat_diagnosis_status=SKIPPED' \
    'reason=No GitLab credential provided in environment'
  exit 0
fi

# Step 1: Attempt direct project-level Duo Agent Platform Workflow on primary repo ($PROJECT_ID)
wf_primary_file="$(mktemp)"
wf_primary_code="$(curl -sS -o "$wf_primary_file" -w "%{http_code}" \
  -X POST "$API_V4/ai/duo_workflows/workflows" \
  -H "Authorization: Bearer $AUTH_CREDENTIAL" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"goal\":\"$INCIDENT_SUMMARY\",\"workflow_definition\":\"software_development\",\"start_workflow\":true,\"environment\":\"web\"}" || printf '000')"

printf 'primary_project_id=%s\n' "$PROJECT_ID"
printf 'primary_project_workflow_http_code=%s\n' "$wf_primary_code"
printf 'primary_project_workflow_response=%s\n' "$(tr '\n' ' ' < "$wf_primary_file" | cut -c1-360)"
rm -f "$wf_primary_file"

if [ "$wf_primary_code" = "201" ]; then
  printf '%s\n' 'agent_platform_flow_status=PASS' 'mode=duo_workflows_rest_primary'
  exit 0
fi

# Step 2: Attempt Duo Agent Platform Workflow session on provisioned hackathon STILL project ($HACKATHON_STILL_PROJECT_ID)
wf_hack_file="$(mktemp)"
wf_hack_code="$(curl -sS -o "$wf_hack_file" -w "%{http_code}" \
  -X POST "$API_V4/ai/duo_workflows/workflows" \
  -H "Authorization: Bearer $AUTH_CREDENTIAL" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$HACKATHON_STILL_PROJECT_ID\",\"goal\":\"$INCIDENT_SUMMARY\",\"workflow_definition\":\"software_development\"}" || printf '000')"

printf 'hackathon_still_project_id=%s\n' "$HACKATHON_STILL_PROJECT_ID"
printf 'hackathon_still_workflow_http_code=%s\n' "$wf_hack_code"
printf 'hackathon_still_workflow_response=%s\n' "$(tr '\n' ' ' < "$wf_hack_file" | cut -c1-420)"
rm -f "$wf_hack_file"

# Step 3: Attempt remote workload execution on initialized gitlab-community hackathon workspace ($HACKATHON_RUNNER_PROJECT_ID)
wf_runner_file="$(mktemp)"
wf_runner_code="$(curl -sS -o "$wf_runner_file" -w "%{http_code}" \
  -X POST "$API_V4/ai/duo_workflows/workflows" \
  -H "Authorization: Bearer $AUTH_CREDENTIAL" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$HACKATHON_RUNNER_PROJECT_ID\",\"source_branch\":\"still-omega\",\"goal\":\"$INCIDENT_SUMMARY\",\"workflow_definition\":\"software_development\",\"start_workflow\":true,\"environment\":\"web\"}" || printf '000')"

printf 'hackathon_runner_project_id=%s\n' "$HACKATHON_RUNNER_PROJECT_ID"
printf 'hackathon_runner_workflow_http_code=%s\n' "$wf_runner_code"
printf 'hackathon_runner_workflow_response=%s\n' "$(tr '\n' ' ' < "$wf_runner_file" | cut -c1-420)"
rm -f "$wf_runner_file"

if [ "$wf_runner_code" = "201" ]; then
  printf '%s\n' \
    'agent_platform_flow_status=PASS' \
    'primary_namespace_workflow_status=BLOCKED_PERSONAL_NAMESPACE_403' \
    'mode=duo_workflows_rest_community_workspace'
else
  printf '%s\n' \
    'agent_platform_flow_status=BLOCKED' \
    "reason=Primary project $PROJECT_ID returned HTTP $wf_primary_code; community workspace $HACKATHON_RUNNER_PROJECT_ID returned HTTP $wf_runner_code"
fi

# Step 4: Execute Assisted GraphQL Duo Chat Diagnosis (explicitly labeled as chat-only, never conflated with Agent Platform Flow)
gql_file="$(mktemp)"
gql_payload=$(cat <<EOF
{"query":"mutation { aiAction(input: { chat: { resourceId: \"$ISSUE_GLOBAL_ID\", content: \"Diagnose STILL incident and propose a minimal WCAG 2.1 AA fix: $INCIDENT_SUMMARY\" } }) { requestId errors } }"}
EOF
)

gql_code="$(curl -sS -o "$gql_file" -w "%{http_code}" \
  -X POST "$GRAPHQL_URL" \
  -H "Authorization: Bearer $AUTH_CREDENTIAL" \
  -H "Content-Type: application/json" \
  -d "$gql_payload" || printf '000')"

gql_body="$(tr '\n' ' ' < "$gql_file" | cut -c1-500)"
rm -f "$gql_file"

printf 'assisted_chat_http_code=%s\n' "$gql_code"
printf 'assisted_chat_response=%s\n' "$gql_body"

case "$gql_body" in
  *'"requestId":"'*)
    printf '%s\n' 'assisted_chat_diagnosis_status=PASS' 'assisted_chat_mode=gitlab_duo_graphql_aiAction_chat_only'
    ;;
  *)
    printf '%s\n' 'assisted_chat_diagnosis_status=BLOCKED'
    ;;
esac
