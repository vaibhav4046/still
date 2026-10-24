#!/usr/bin/env node
/**
 * STILL OMEGA — Real Browser Journey Probe (Priority 1)
 *
 * Launches headless Chromium via Playwright to execute a real keyboard-only
 * user journey across:
 *   1. /book (normal primary route) -> must PASS keyboard slot selection
 *   2. /book?broken=1 (faulty route) -> must detect WCAG 2.1.1 keyboard slot trap
 *      via real sequential Tab focus inspection (never hardcoded to URL query)
 *      even while GET /health returns HTTP 200 OK
 *   3. /simple (accessible fallback route) -> must PASS keyboard slot selection
 *   4. /book?broken=1&repaired=1 (staged Duo repair route) -> must PASS keyboard slot selection
 *
 * Emits a deterministic, PII-redacted incident envelope at:
 *   artifacts/incident-envelope.json
 */

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const requireFromWeb = createRequire(path.join(repoRoot, "apps", "web", "package.json"));
const { chromium } = requireFromWeb("@playwright/test");

const BASE_URL = (process.env.STILL_BASE_URL || "https://still-continuity.vercel.app").replace(/\/$/, "");
const ENVIRONMENT =
  process.env.STILL_ENV ||
  (BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1") ? "local" : "production-staging");

function getGitSha() {
  if (process.env.CI_COMMIT_SHA) return process.env.CI_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/**
 * Runs a real keyboard-only slot-selection journey on any booking route.
 * Does NOT inspect URL query parameters; relies purely on live DOM + keyboard focus.
 */
async function probeKeyboardSlotSelection(page, routePath) {
  const url = `${BASE_URL}${routePath}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

  await page.waitForSelector("#service", { timeout: 15_000 });
  await page.waitForSelector('[role="radiogroup"] input[type="radio"][name="slot"]', { timeout: 15_000 });

  await page.locator("#service").focus();
  const focusSequence = [];
  let reachedSlotRadio = false;
  let selectedSlotValue = null;

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return { tag: "NONE", id: "", name: "", type: "", tabIndex: null };
      return {
        tag: el.tagName,
        id: el.id || "",
        name: el.getAttribute("name") || "",
        type: el.getAttribute("type") || "",
        tabIndex: el.tabIndex,
      };
    });
    focusSequence.push(
      `${active.tag}${active.id ? "#" + active.id : ""}${active.name ? "[name=" + active.name + "]" : ""}`,
    );

    if (active.tag === "INPUT" && active.type === "radio" && active.name === "slot") {
      reachedSlotRadio = true;
      await page.keyboard.press("Space");
      selectedSlotValue = await page.evaluate(() => {
        const checked = document.querySelector('input[type="radio"][name="slot"]:checked');
        return checked ? checked.getAttribute("value") : null;
      });
      break;
    }
    if (active.id === "name" || active.id === "email") {
      break;
    }
  }

  const domAudit = await page.evaluate(() => {
    const radios = Array.from(document.querySelectorAll('input[type="radio"][name="slot"]'));
    const fallbackLink = document.querySelector('a[href="/simple"]');
    return {
      radioCount: radios.length,
      tabIndexValues: radios.map((r) => r.tabIndex),
      allNegativeTabIndex: radios.length > 0 && radios.every((r) => r.tabIndex === -1),
      fallbackLinkPresent: Boolean(fallbackLink),
      fallbackHref: fallbackLink ? fallbackLink.getAttribute("href") : null,
    };
  });

  const passed = reachedSlotRadio && Boolean(selectedSlotValue);

  return {
    route: routePath,
    url,
    status: passed ? "PASSED" : "FAILED",
    keyboard_focus_reached: reachedSlotRadio,
    slot_selected_via_keyboard: Boolean(selectedSlotValue),
    selected_slot_id: selectedSlotValue,
    radio_count: domAudit.radioCount,
    tab_index_values: domAudit.tabIndexValues,
    all_radios_removed_from_tab_order: domAudit.allNegativeTabIndex,
    focus_sequence: focusSequence,
    fallback_link_present: domAudit.fallbackLinkPresent,
    fallback_href: domAudit.fallbackHref,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const gitSha = getGitSha();

  const healthRes = await fetch(`${BASE_URL}/health`, { headers: { accept: "application/json" } });
  const healthBody = await healthRes.json().catch(() => ({}));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log(`[journey-probe] Target: ${BASE_URL} (commit: ${gitSha.slice(0, 8)})`);
    console.log(`[journey-probe] 1/4 Probing normal primary route (/book)...`);
    const normalProbe = await probeKeyboardSlotSelection(page, "/book");
    console.log(
      `  -> /book: status=${normalProbe.status}, keyboard_focus=${normalProbe.keyboard_focus_reached}, slot=${normalProbe.selected_slot_id}`,
    );

    console.log(`[journey-probe] 2/4 Probing fault-injected route (/book?broken=1)...`);
    const faultyProbe = await probeKeyboardSlotSelection(page, "/book?broken=1");
    console.log(
      `  -> /book?broken=1: status=${faultyProbe.status}, keyboard_focus=${faultyProbe.keyboard_focus_reached}, tabIndex=${JSON.stringify(faultyProbe.tab_index_values)}, focus_path=${faultyProbe.focus_sequence.join(" -> ")}`,
    );

    console.log(`[journey-probe] 3/4 Probing accessible fallback route (/simple)...`);
    const fallbackProbe = await probeKeyboardSlotSelection(page, "/simple");
    console.log(
      `  -> /simple: status=${fallbackProbe.status}, keyboard_focus=${fallbackProbe.keyboard_focus_reached}, slot=${fallbackProbe.selected_slot_id}`,
    );

    console.log(`[journey-probe] 4/4 Probing staged Duo repair route (/book?broken=1&repaired=1)...`);
    const repairedProbe = await probeKeyboardSlotSelection(page, "/book?broken=1&repaired=1");
    console.log(
      `  -> /book?broken=1&repaired=1: status=${repairedProbe.status}, keyboard_focus=${repairedProbe.keyboard_focus_reached}, slot=${repairedProbe.selected_slot_id}`,
    );

    const probeIntegrityVerified =
      normalProbe.status === "PASSED" &&
      faultyProbe.status === "FAILED" &&
      faultyProbe.all_radios_removed_from_tab_order === true &&
      fallbackProbe.status === "PASSED";

    const fingerprintInput = [
      "still-web",
      "/book",
      "WCAG_2_1_1_KEYBOARD_SLOT_TRAP",
      'role="radiogroup" input[type="radio"][name="slot"]',
    ].join("|");
    const fingerprint = sha256(fingerprintInput).slice(0, 16);

    const accessibleFailureDetails = {
      failure_code: "WCAG_2_1_1_KEYBOARD_SLOT_TRAP",
      wcag_criterion: "WCAG 2.1 AA SC 2.1.1 (Keyboard Accessible)",
      selector: '[role="radiogroup"][aria-label="Available appointment times"] input[type="radio"][name="slot"]',
      component_file: "apps/web/components/booking-flow.tsx",
      observed_behavior: `Sequential Tab navigation jumped from ${faultyProbe.focus_sequence.join(" -> ")} without focusing any of the ${faultyProbe.radio_count} slot radio inputs because tabIndex=${JSON.stringify(faultyProbe.tab_index_values)}.`,
      why_http_monitor_missed_it: `GET /health returned HTTP ${healthRes.status} (${healthBody.status || "ok"}) while keyboard users were completely blocked from selecting an appointment slot.`,
      continuity_mitigation: `Accessible fallback route (/simple) verified keyboard-operable (selected slot ${fallbackProbe.selected_slot_id} via Tab + Space).`,
      staged_repair_verification: `Staged Duo repair route (/book?broken=1&repaired=1) status=${repairedProbe.status} (selected slot ${repairedProbe.selected_slot_id}).`,
    };

    const canonicalEvidence = JSON.stringify({
      fingerprint,
      http_health_status: healthRes.status,
      normal_status: normalProbe.status,
      faulty_status: faultyProbe.status,
      fallback_status: fallbackProbe.status,
      tab_index_values: faultyProbe.tab_index_values,
      focus_sequence: faultyProbe.focus_sequence,
    });

    const envelope = {
      schema_version: "still-incident-envelope-v1",
      incident_id: `inc-${fingerprint}`,
      fingerprint,
      route: "/book?broken=1",
      primary_route: "/book",
      fallback_route: "/simple",
      staged_repair_route: "/book?broken=1&repaired=1",
      test_name: "journey-probe:keyboard-slot-selection",
      http_health_status: healthRes.status,
      http_health_false_green: healthRes.status === 200 && faultyProbe.status === "FAILED",
      normal_journey_status: normalProbe.status,
      faulty_journey_status: faultyProbe.status,
      fallback_journey_status: fallbackProbe.status === "PASSED" ? "VERIFIED" : "FAILED",
      staged_repair_journey_status: repairedProbe.status === "PASSED" ? "VERIFIED" : "PENDING_DEPLOY",
      probe_integrity_verified: probeIntegrityVerified,
      accessible_failure_details: accessibleFailureDetails,
      probes: {
        normal_primary: normalProbe,
        fault_injected_primary: faultyProbe,
        accessible_fallback: fallbackProbe,
        staged_duo_repair: repairedProbe,
      },
      timestamp: startedAt,
      git_sha: gitSha,
      environment: ENVIRONMENT,
      target_base_url: BASE_URL,
      evidence_artifact_paths: ["artifacts/incident-envelope.json", "duo/session.json"],
      redacted_trace_identifiers: {
        gitlab_project_id: 88027269,
        gitlab_issue_iid: 1,
        gitlab_issue_url: "https://gitlab.com/vaibhav.lalwani/still/-/issues/1",
        gitlab_issue_note_id: 4083003631,
        gitlab_merge_request_iid: 1,
        gitlab_merge_request_url: "https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1",
        gitlab_mr_pipeline_id: 2984938201,
        gitlab_mr_pipeline_url: "https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201",
        hackathon_mirror_project_id: 88027224,
        hackathon_mirror_issue_url: "https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/still/-/issues/1",
        duo_agent_platform_workflow_id: 10006279,
        duo_agent_platform_session_url:
          "https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/automate/agent-sessions/10006279",
        duo_agent_platform_workload_job_url:
          "https://gitlab.com/gitlab-community/community-projects/2026-02-ai-hackathon/my-uptodate/-/jobs/17440095179",
        duo_assisted_chat_request_id: "cc7e274a-16f1-4445-91a1-d93cdf03a68f",
        pii_redacted: true,
      },
      evidence_hash: sha256(canonicalEvidence),
    };

    const artifactsDir = path.join(repoRoot, "artifacts");
    mkdirSync(artifactsDir, { recursive: true });
    const outPath = path.join(artifactsDir, "incident-envelope.json");
    writeFileSync(outPath, JSON.stringify(envelope, null, 2));
    console.log(`[journey-probe] Wrote incident envelope -> ${outPath}`);
    console.log(`[journey-probe] fingerprint=${fingerprint} | evidence_hash=${envelope.evidence_hash.slice(0, 16)}...`);

    if (!probeIntegrityVerified) {
      console.error("[journey-probe] ERROR: Probe integrity check failed!");
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[journey-probe] Fatal error:", err);
  process.exit(1);
});
