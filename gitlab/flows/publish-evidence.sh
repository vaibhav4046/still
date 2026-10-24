#!/bin/sh
set -eu

mkdir -p evidence

status_for() {
  file="$1"
  if [ -f "$file" ]; then
    awk -F= '/^status=/{print $2; exit}' "$file"
  else
    printf '%s' 'NOT_RUN'
  fi
}

validation_status="$(status_for validation/summary.txt)"
test_status="$(status_for test-status.txt)"
web_test_status="$(status_for web-test-status.txt)"
package_status="$(status_for package/status.txt)"
security_status="$(status_for security/status.txt)"
govern_status="$(status_for govern/status.txt)"
deploy_status="$(status_for deploy/status.txt)"
monitor_status="$(status_for monitor/status.txt)"
duo_status="$(status_for duo/status.txt)"

duo_proven="false"
if [ "$duo_status" = "PASS" ] || [ "$duo_status" = "TRIGGERED" ]; then
  duo_proven="true"
fi

deploy_proven="false"
if [ "$deploy_status" = "PASS" ] || [ "$monitor_status" = "PASS" ]; then
  deploy_proven="true"
fi

release_decision="INSUFFICIENT_EVIDENCE"
if [ "$validation_status" = "PASS" ] && [ "$test_status" = "PASS" ] && [ "$web_test_status" = "PASS" ] && [ "$security_status" = "PASS" ] && [ "$deploy_proven" = "true" ]; then
  release_decision="VERIFIED_CONTINUOUS"
fi

cat > evidence/ci-boundary.json <<EOF
{
  "contract_version": "1",
  "pipeline_id": "${CI_PIPELINE_ID:-unavailable}",
  "commit_sha": "${CI_COMMIT_SHA:-unavailable}",
  "validation": "${validation_status}",
  "test": "${test_status}",
  "web_test": "${web_test_status}",
  "package": "${package_status}",
  "security": "${security_status}",
  "govern": "${govern_status}",
  "deploy": "${deploy_status}",
  "monitor": "${monitor_status}",
  "duo": "${duo_status}",
  "duo_run_proven": ${duo_proven},
  "deployment_proven": ${deploy_proven},
  "release_decision": "${release_decision}"
}
EOF

cat > evidence/ci-boundary.md <<EOF
# STILL CI boundary evidence

- Pipeline: ${CI_PIPELINE_ID:-unavailable}
- Commit: ${CI_COMMIT_SHA:-unavailable}
- Validation: ${validation_status}
- Rust test: ${test_status}
- Web test/typecheck: ${web_test_status}
- Package: ${package_status}
- Security: ${security_status}
- Governance: ${govern_status}
- Candidate verify: ${deploy_status}
- Smoke monitor: ${monitor_status}
- GitLab Duo status: ${duo_status}
- GitLab Duo execution proven: **${duo_proven}**
- Deployment proven: **${deploy_proven}**
- Release decision: **${release_decision}**

This artifact is a publication of repository-visible CI state only. It does not contain credentials, raw user payloads, or unverified claims.
EOF

cat evidence/ci-boundary.json
