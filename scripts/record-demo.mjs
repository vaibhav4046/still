import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const webDir = join(repoRoot, "apps", "web");
const rawDir = join(repoRoot, "media", "raw");
const apiScript = join(repoRoot, "scripts", "start-e2e-api.mjs");
const nextBin = join(webDir, "node_modules", "next", "dist", "bin", "next");
const webUrl = "http://127.0.0.1:3100";
const apiHealthUrl = "http://127.0.0.1:8788/health";
const viewport = { width: 3840, height: 2160 };

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
let api;
let web;

try {
  if (!(await isPortFree(8788))) {
    throw new Error("Port 8788 is already in use. Stop the stale API before recording.");
  }
  if (!(await isPortFree(3100))) {
    throw new Error("Port 3100 is already in use. Stop the stale web server before recording.");
  }

  api = startProcess("api", process.execPath, [apiScript], { cwd: repoRoot });
  await waitForUrl(apiHealthUrl);

  web = startProcess("web", process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3100"], {
    cwd: webDir,
    env: { ...process.env, NEXT_PUBLIC_STILL_API_URL: "http://127.0.0.1:8788" },
  });
  await waitForUrl(`${webUrl}/book`);

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: viewport },
  });
  page = await context.newPage();
  video = page.video();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(90000);

  await page.goto(`${webUrl}/`, { waitUntil: "load" });
  await page.getByRole("heading", { name: /Keep the journey still/i }).waitFor();
  await page.waitForTimeout(4000);
  await page.getByRole("link", { name: /Open booking journey/i }).click();

  await page.getByRole("heading", { name: /Reserve a university advice session/i }).waitFor();
  await page.getByRole("radio").first().check();
  await page.getByLabel("Your name").fill("Demo User");
  await page.getByLabel("Email address").fill("demo@example.test");
  await page.getByRole("button", { name: /Reserve session/i }).click();
  await page.getByRole("heading", { name: /Your session is reserved/i }).waitFor();
  await page.waitForTimeout(3500);

  await page.goto(`${webUrl}/book?broken=1`, { waitUntil: "load" });
  await page.getByRole("status").filter({ hasText: "Controlled preview regression" }).first().waitFor();
  await page.waitForTimeout(3000);
  await page.getByRole("link", { name: /Use the simple path/i }).click();

  await page.getByRole("heading", { name: /Reserve without the noise/i }).waitFor();
  await page.getByRole("combobox").selectOption("study-planning");
  await page.getByRole("radio").first().check();
  await page.getByLabel("Your name").fill("Demo User");
  await page.getByLabel("Email address").fill("demo@example.test");
  await page.getByRole("button", { name: /Reserve session/i }).click();
  await page.getByRole("heading", { name: /Your session is reserved/i }).waitFor();
  await page.waitForTimeout(3500);

  await page.goto(`${webUrl}/`, { waitUntil: "load" });
  await page.getByRole("heading", { name: /Keep the journey still/i }).waitFor();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Refresh state/i }).click();
  await page.waitForTimeout(2000);
  await page.locator("#operator-question").fill("What changed in the booking journey today?");
  await page.getByRole("button", { name: /Ask operator API/i }).click();
  await page
    .waitForFunction(
      () => {
        const el = document.querySelector(".ask-panel [role='status'], .ask-panel [role='alert']");
        const text = el?.querySelector("p")?.textContent ?? "";
        return text.trim().length > 0;
      },
      { timeout: 25000 },
    )
    .catch(() => {});
  await page.waitForTimeout(4000);

  await context.close();
  context = undefined;
  result.video = await video.path();
  result.ok = true;
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  if (context) {
    try {
      await context.close();
    } catch {
      // ignore
    }
    try {
      result.video = result.video ?? (await video?.path());
    } catch {
      // ignore
    }
  }
  if (browser) {
    try {
      await browser.close();
    } catch {
      // ignore
    }
  }
  stopTree(web);
  stopTree(api);
  writeFileSync(join(rawDir, "recording-result.json"), JSON.stringify(result, null, 2));
  console.log(`DEMO_RESULT:${JSON.stringify(result)}`);
}
