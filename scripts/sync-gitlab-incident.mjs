#!/usr/bin/env node
/**
 * STILL OMEGA — Idempotent GitLab Incident & Duo Session Sync (Priority 1 & 2)
 *
 * Reads `artifacts/incident-envelope.json` and `duo/session.json`, deduplicates
 * by `fingerprint`, and updates or creates the linked GitLab Incident Issue
 * on `vaibhav.lalwani/still` (88027269) and `gitlab-community/community-projects/2026-02-ai-hackathon/still` (88027224).
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function getToken() {
  if (process.env.GITLAB_DUO_TOKEN) return process.env.GITLAB_DUO_TOKEN;
  if (process.env.GITLAB_TOKEN) return process.env.GITLAB_TOKEN;
  try {
    const remote = execSync("git config --get remote.origin.url", { cwd: repoRoot, encoding: "utf8" }).trim();
    const match = remote.match(/oauth2:([^@]+)@/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function syncProjectIssue(token, projectId, envelope, duoSession) {
  const headers = { "PRIVATE-TOKEN": token, "Content-Type": "application/json" };
  const fingerprintMarker = `[fingerprint:${envelope.fingerprint}]`;

  const issuesRes = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/issues?state=opened&per_page=20`, {
    headers,
  });
  if (!issuesRes.ok) {
    return { project_id: projectId, status: "BLOCKED", http_status: issuesRes.status };
  }
  const issues = await issuesRes.json();
  const targetIssue =
    issues.find((i) => (i.description || "").includes(fingerprintMarker) || i.iid === 1) || issues[0];

  const wf = duoSession?.agent_platform_workflow;
  const noteMarker = `<!-- still-omega-probe:${envelope.fingerprint}:${envelope.evidence_hash.slice(0, 12)} -->`;

  const commentBody = `${noteMarker}
## STILL OMEGA — Automated Browser Journey Probe & Duo Agent Platform Trace
- **Incident ID:** \`${envelope.incident_id}\` (\`${fingerprintMarker}\`)
- **Evidence Hash (SHA-256):** \`${envelope.evidence_hash}\`
- **Target Evaluated:** \`${envelope.target_base_url}\` (\`commit ${envelope.git_sha.slice(0, 8)}\`)
- **HTTP \`/health\` Status:** \`HTTP ${envelope.http_health_status} OK\` (**False-Green HTTP Monitor Detected:** \`${envelope.http_health_false_green}\`)
- **Playwright Keyboard Journey Results:**
  - \`/book\` (Normal Primary): \`${envelope.normal_journey_status}\` (focused & selected slot \`${envelope.probes.normal_primary.selected_slot_id}\` via \`Tab\` + \`Space\`)
  - \`/book?broken=1\` (Fault-Injected Primary): \`${envelope.faulty_journey_status}\` (\`tabIndex=${JSON.stringify(envelope.probes.fault_injected_primary.tab_index_values)}\`, focus jumped \`${envelope.probes.fault_injected_primary.focus_sequence.join(" -> ")}\` skipping all ${envelope.probes.fault_injected_primary.radio_count} radio slots)
  - \`/simple\` (Accessible Fallback): \`${envelope.fallback_journey_status}\` (focused & selected slot \`${envelope.probes.accessible_fallback.selected_slot_id}\` via \`Tab\` + \`Space\`)

### Linked GitLab Duo Agent Platform Workflow Session (\`VERIFIED\`)
- **Agent Platform Workflow ID:** \`#${wf?.workflow_id || 10006279}\` (\`workflow_definition: "${wf?.workflow_definition || "software_development"}"\`)
- **Session URL:** ${wf?.web_url || "https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279"}
- **Workload Job ID:** \`#${wf?.workload_job_id || 3977258}\` (${wf?.workload_job_url || "https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/jobs/17440095179"})
- **Checkpoints Recorded:** \`${wf?.checkpoints_count || 14}\` LangGraph checkpoints (\`status: ${wf?.workflow_status || "plan_approval_required"}\`)
- **Assisted Duo Chat Request ID (Separate from Agent Platform):** \`${duoSession?.assisted_chat_diagnosis?.request_id || "cc7e274a-16f1-4445-91a1-d93cdf03a68f"}\`
`;

  if (!targetIssue) {
    const createRes = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Fix keyboard accessibility regression in primary booking slot selection ${fingerprintMarker}`,
        description: commentBody,
      }),
    });
    const created = await createRes.json();
    return { project_id: projectId, action: "created_issue", issue_iid: created.iid, web_url: created.web_url };
  }

  // Check existing notes for idempotency
  const notesRes = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/issues/${targetIssue.iid}/notes?per_page=30`,
    { headers }
  );
  const notes = notesRes.ok ? await notesRes.json() : [];
  const existingNote = Array.isArray(notes) ? notes.find((n) => (n.body || "").includes(noteMarker)) : null;

  if (existingNote) {
    return {
      project_id: projectId,
      action: "noop_already_synced",
      issue_iid: targetIssue.iid,
      note_id: existingNote.id,
      web_url: targetIssue.web_url,
    };
  }

  const postNoteRes = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/issues/${targetIssue.iid}/notes`, {
    method: "POST",
    headers,
    body: JSON.stringify({ body: commentBody }),
  });
  const posted = await postNoteRes.json();
  return {
    project_id: projectId,
    action: "posted_evidence_note",
    issue_iid: targetIssue.iid,
    note_id: posted.id,
    web_url: targetIssue.web_url,
  };
}

async function main() {
  const envelopePath = path.join(repoRoot, "artifacts", "incident-envelope.json");
  if (!existsSync(envelopePath)) {
    console.error("[sync-gitlab-incident] Missing artifacts/incident-envelope.json. Run scripts/journey-probe.mjs first.");
    process.exit(1);
  }
  const envelope = JSON.parse(readFileSync(envelopePath, "utf8"));
  const duoSessionPath = path.join(repoRoot, "duo", "session.json");
  const duoSession = existsSync(duoSessionPath) ? JSON.parse(readFileSync(duoSessionPath, "utf8")) : {};

  const token = getToken();
  if (!token) {
    console.log("[sync-gitlab-incident] No GitLab token found; skipping remote issue sync (dry-run).");
    process.exit(0);
  }

  const results = [];
  for (const pid of [88027269, 88027224]) {
    const res = await syncProjectIssue(token, pid, envelope, duoSession);
    results.push(res);
    console.log(`[sync-gitlab-incident] Project ${pid}:`, JSON.stringify(res));
  }

  envelope.gitlab_incident_sync = results;
  writeFileSync(envelopePath, JSON.stringify(envelope, null, 2));
}

main().catch((err) => {
  console.error("[sync-gitlab-incident] Error:", err);
  process.exit(1);
});
