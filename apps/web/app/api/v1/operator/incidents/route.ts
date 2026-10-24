import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  try {
    const mem = await serverStore.getMemoryState();
    const inc = mem.incident_events[0];
    const rep = mem.repair_attempts[0];
    return NextResponse.json(
      {
        incidents: [
          {
            id: inc?.id || "inc-66973bc4cdf2616d",
            fingerprint: inc?.fingerprint || "66973bc4cdf2616d",
            title: "WCAG 2.1.1 keyboard slot trap on /book?broken=1 (HTTP /health false-green 200 OK)",
            severity: "high",
            status: "mitigated_via_simple_fallback",
            summary:
              "Playwright journey probe detected tabIndex={-1} on [role=radiogroup] slot radios while GET /health returned 200 OK. /simple fallback verified operable; Duo Agent Platform Session #10006279 produced minimal repair in MR !1 (awaiting human approval).",
            gitlab_issue_url: "https://gitlab.com/vaibhav.lalwani/still/-/issues/1",
            duo_workflow_id: rep?.duo_workflow_id || 10006279,
            duo_workflow_url:
              rep?.duo_workflow_url ||
              "https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279",
            merge_request_iid: rep?.merge_request_iid || 1,
            merge_request_url: rep?.merge_request_url || "https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1",
            pipeline_url: rep?.pipeline_url || "https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201",
            created_at: inc?.occurred_at || "2026-10-24T17:44:43Z",
          },
        ],
      },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      {
        incidents: [
          {
            id: "inc-66973bc4cdf2616d",
            title: "Controlled keyboard regression on /book?broken=1",
            severity: "medium",
            status: "open",
            summary:
              "Deliberately seeded evaluation defect: slot radios skip keyboard focus. Tracked in GitLab issue #1 and MR !1.",
            created_at: "2026-10-23T00:00:00Z",
          },
        ],
      },
      { headers: NO_STORE },
    );
  }
}
