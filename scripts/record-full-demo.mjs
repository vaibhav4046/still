import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const webDir = join(repoRoot, "apps", "web");
const rawDir = join(repoRoot, "media", "raw");
const nextBin = join(webDir, "node_modules", "next", "dist", "bin", "next");
const webUrl = "http://127.0.0.1:3100";
const viewport = { width: 1920, height: 1080 };

const requireFromWeb = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { chromium } = requireFromWeb("playwright");

mkdirSync(rawDir, { recursive: true });

const children = [];

function startProcess(label, command, args, options) {
  const child = spawn(command, args, { stdio: "inherit", ...options });
  child.label = label;
  children.push(child);
  return child;
}

function stopTree(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null || !child.pid) {
    return;
  }
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function waitForUrl(url, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    for (const child of children) {
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`${child.label} exited before ${url} became ready (code ${child.exitCode ?? child.signalCode})`);
      }
    }
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const result = { ok: false, recordedAt: new Date().toISOString(), viewport };
let browser;
let context;
let page;
let video;
let web;

try {
  if (!(await isPortFree(3100))) {
    throw new Error("Port 3100 is already in use. Stop the stale web server before recording.");
  }

  console.log("Starting Next.js Web server backed by Neon PostgreSQL...");
  web = startProcess("web", process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3100"], {
    cwd: webDir,
    env: { ...process.env },
  });
  await waitForUrl(`${webUrl}/book`);
  console.log("Web server ready.");

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: viewport },
  });
  page = await context.newPage();
  video = page.video();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(60000);

  const sceneStart = Date.now();
  async function waitTotal(targetMs) {
    const elapsed = Date.now() - sceneStart;
    if (elapsed < targetMs) {
      await page.waitForTimeout(targetMs - elapsed);
    }
  }

  // --- SCENE 1: Quiet Control Room Hero, Two-Lane Continuity Bridge & Duo Session #10006279 (0.0s -> 14.0s) ---
  console.log("Recording Scene 1: Quiet Control Room Hero & Continuity Bridge (0s - 14s)...");
  await page.goto(`${webUrl}/`, { waitUntil: "load" });
  await page.getByRole("heading", { name: /A broken form shouldn't stop someone/i }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole("link", { name: /See the recovery/i }).click();
  await page.waitForTimeout(1800);
  await page.getByRole("heading", { name: /The Continuity Bridge/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.getByRole("heading", { name: /Auditable Lifecycle Trace/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Inspect GitLab Duo Diagnosis & Diff/i }).click();
  await page.getByText(/lc_run--01a16f00-4b97-7592-92a4-bb650b22a380/).first().waitFor();
  await page.waitForTimeout(1500);
  await waitTotal(14000);

  // --- SCENE 2: Primary Booking Journey + P0-01 Capability Proof (14.0s -> 29.0s) ---
  console.log("Recording Scene 2: Primary Booking & Capability Boundary (14s - 29s)...");
  await page.goto(`${webUrl}/book`, { waitUntil: "load" });
  await page.getByRole("heading", { name: /Reserve a university advice session/i }).waitFor();
  await page.waitForTimeout(900);
  await page.getByRole("radio").first().check();
  await page.waitForTimeout(500);
  await page.getByLabel("Your name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill("alex.morgan@university.edu");
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /Reserve session/i }).click();
  await page.getByRole("heading", { name: /Your session is reserved/i }).waitFor();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Test Unauthenticated Readback/i }).click();
  await page.waitForTimeout(1800);
  await waitTotal(29000);

  // --- SCENE 3: Controlled Accessibility Regression & Staged Repair Preview (29.0s -> 42.0s) ---
  console.log("Recording Scene 3: Controlled Regression & Staged Repair (29s - 42s)...");
  await page.goto(`${webUrl}/book?broken=1`, { waitUntil: "load" });
  await page.getByRole("status").filter({ hasText: "Controlled preview regression" }).first().waitFor();
  await page.waitForTimeout(2500);
  await page.goto(`${webUrl}/book?broken=1&repaired=1`, { waitUntil: "load" });
  await page.getByRole("status").filter({ hasText: "Staged GitLab Duo repair verified" }).first().waitFor();
  await page.waitForTimeout(2200);
  await waitTotal(42000);

  // --- SCENE 4: Accessible Fallback (/simple) (42.0s -> 57.0s) ---
  console.log("Recording Scene 4: Accessible Fallback (42s - 57s)...");
  await page.goto(`${webUrl}/simple`, { waitUntil: "load" });
  await page.getByRole("heading", { name: /Reserve without the noise/i }).waitFor();
  await page.waitForTimeout(900);
  await page.getByRole("combobox").selectOption("study-planning");
  await page.waitForTimeout(500);
  await page.getByRole("radio").first().check();
  await page.waitForTimeout(500);
  await page.getByLabel("Your name").fill("Riley Chen");
  await page.getByLabel("Email address").fill("riley.chen@university.edu");
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Reserve session/i }).click();
  await page.getByRole("heading", { name: /Your session is reserved/i }).waitFor();
  await waitTotal(57000);

  // --- SCENE 5: Repair Intelligence & Paired Incident Memory Lab (57.0s -> 73.0s) ---
  console.log("Recording Scene 5: Repair Intelligence & Paired Incident Memory Lab (57s - 73s)...");
  await page.goto(`${webUrl}/`, { waitUntil: "load" });
  await page.getByRole("heading", { name: /A broken form shouldn't stop someone/i }).waitFor();
  await page.waitForTimeout(700);
  await page.getByRole("heading", { name: /Advancing the Frontier of Service Continuity/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  await page.getByRole("heading", { name: /Repair Intelligence & Paired Evaluation Lab/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.getByRole("heading", { name: /Query stored operator state/i }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /What is the current healthy status/i }).click();
  await waitTotal(73000);

  // --- SCENE 6: GitLab Issue #1, Merge Request !1 & Passing MR Pipeline #2984938201 (73.0s -> 88.0s) ---
  console.log("Recording Scene 6: GitLab Issue #1, MR !1 & Pipeline #2984938201 (73s - 88s)...");
  try {
    await page.goto("https://gitlab.com/vaibhav.lalwani/still/-/merge_requests/1", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(4500);
    await page.goto("https://gitlab.com/vaibhav.lalwani/still/-/pipelines/2984938201", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(4000);
  } catch (navErr) {
    console.log("GitLab live navigation note:", navErr.message);
  }
  await waitTotal(88000);

  // --- SCENE 7: Live Production Outro on Vercel (88.0s -> 96.0s) ---
  console.log("Recording Scene 7: Production Outro (88s - 96s)...");
  try {
    await page.goto("https://still-continuity.vercel.app", { waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(3500);
    await page.goto("https://still-continuity.vercel.app/privacy", { waitUntil: "domcontentloaded", timeout: 10000 });
  } catch {
    await page.goto(`${webUrl}/privacy`, { waitUntil: "load" });
  }
  await waitTotal(96000);

  await context.close();
  context = undefined;
  result.video = await video.path();
  result.ok = true;
  console.log("Recording completed successfully at:", result.video);
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  console.error("Recording error:", result.error);
  process.exitCode = 1;
} finally {
  if (context) {
    try {
      await context.close();
    } catch {}
    try {
      result.video = result.video ?? (await video?.path());
    } catch {}
  }
  if (browser) {
    try {
      await browser.close();
    } catch {}
  }
  stopTree(web);
  writeFileSync(join(rawDir, "recording-full-result.json"), JSON.stringify(result, null, 2));
}
