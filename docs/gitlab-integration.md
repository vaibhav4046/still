# STILL GitLab CI/CD and Duo integration boundary

## Outcome

STILL now contains a repository-owned GitLab boundary without pretending that a GitLab project, protected variables, GitLab Duo entitlement, or a real flow run exists. The boundary is deliberately zero-cost and manual where external authorization is required.

Implemented in this checkout:

- `.gitlab-ci.yml` with `workflow: rules`, ordered stages, Rust and Next test jobs, artifacts, a bounded scheduled-monitor job, and guarded manual jobs.
- `gitlab/flows/duo-trigger.contract.json`, an explicit contract for the optional Duo HTTP call.
- `gitlab/flows/duo-trigger.sh`, a POSIX shell adapter using `curl` and `jq` only. It is not Rust, TypeScript, or Python.
- `gitlab/flows/duo-trigger.request.example.json`, a non-secret request example.
- Contract, secret-logging, governance, monitor, and evidence scripts under `gitlab/flows/`.
- `gitlab/schedules/bounded-monitor.env`, the variables to enter when creating a project pipeline schedule.

Not proven here:

- No GitLab pipeline has run from this checkout.
- No GitLab CI Lint API or project-level CI Lint result is available locally.
- No GitLab Duo flow has been created, started, restarted, or observed.
- No merge request, deployment, protected environment, or candidate URL exists in this workspace.

## HTTP boundary

The adapter targets the current GitLab Duo Agent Platform flow endpoint:

```text
POST ${GITLAB_BASE_URL}/api/v4/ai/duo_workflows/workflows
Content-Type: application/json
PRIVATE-TOKEN: <protected masked token>
```

The request contains `project_id`, a bounded `goal`, `start_workflow: true`, and exactly one flow selector:

- `GITLAB_DUO_WORKFLOW_DEFINITION` becomes `workflow_definition` (for example `developer/v1`), or
- `GITLAB_DUO_FLOW_ID` becomes the numeric `ai_catalog_item_consumer_id`.

The existing environment example names the latter value `GITLAB_DUO_FLOW_ID`; the adapter documents the GitLab meaning explicitly so it is not confused with the created workflow/session ID returned by GitLab.

The adapter records only a redacted result containing the returned flow ID, status, project ID, workflow definition, and web URL. It never prints or persists `GITLAB_ACCESS_TOKEN`, and it does not write the request goal or raw error response to an evidence artifact.

## Required protected variables

Configure these in GitLab CI/CD settings, not in YAML or the repository:

| Variable | Required | GitLab setting | Purpose |
|---|---:|---|---|
| `GITLAB_BASE_URL` | yes | protected | GitLab origin, for example `https://gitlab.com` |
| `GITLAB_PROJECT_ID` | yes | protected | Numeric project ID or project path authorized for the flow |
| `GITLAB_ACCESS_TOKEN` | yes | protected + masked | Token allowed to call the Duo flow endpoint |
| `GITLAB_DUO_WORKFLOW_DEFINITION` | one of two | protected | Built-in flow selector |
| `GITLAB_DUO_FLOW_ID` | one of two | protected | Numeric AI Catalog consumer ID |
| `STILL_DUO_GOAL` | optional | protected | Bounded repair goal; capped by the adapter |

The manual `duo_repair_trigger` job is included only when the pipeline is explicitly started with `STILL_RUN_DUO_REPAIR=true`. It is never enabled by the scheduled monitor template.

## What GitLab project permissions still need to exist

An authorized project owner or maintainer must still:

1. Import this repository into a GitLab project.
2. Validate `.gitlab-ci.yml` with GitLab CI Lint.
3. Add a runner that can execute the selected images and has network egress to the GitLab API.
4. Add protected, masked variables using the table above.
5. Confirm the project is entitled and configured for the GitLab Duo Agent Platform flow endpoint. GitLab documents the Flows API as Premium/Ultimate.
6. If using `GITLAB_DUO_FLOW_ID`, enable the AI Catalog item and look up the numeric consumer ID through the supported GitLab API flow; the catalog item must already be enabled for the project.
7. Protect the `still-governance` and `still-candidate` environments if those manual jobs will be enabled.
8. If the GitLab instance enables composite-identity enforcement for API-started workflows, configure the required service account or expect the endpoint to reject `start_workflow: true` with `403 Forbidden`.
9. Confirm any required identity verification is complete for the GitLab Duo tenant/user before treating a `201 Created` response as an authorized run receipt.

Until those steps are complete, the evidence state remains `INSUFFICIENT_EVIDENCE`; configuration alone is not a Duo or deployment receipt.

## Official references used for the boundary

- GitLab Flows API: `https://docs.gitlab.com/api/duo_agent_platform_flows/`
- GitLab CI rules: `https://docs.gitlab.com/ci/jobs/job_rules/`
- GitLab manual jobs and protected environments: `https://docs.gitlab.com/ci/jobs/job_control/`
- GitLab scheduled pipelines: `https://docs.gitlab.com/ci/pipelines/schedules/`
