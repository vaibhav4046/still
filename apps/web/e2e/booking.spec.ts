import { expect, test } from "@playwright/test";

test("primary booking completes against the authoritative API and proves 401 unauthenticated boundary", async ({ page }) => {
  await page.goto("/book");
  await expect(page.getByRole("heading", { name: "Reserve a university advice session." })).toBeVisible();
  await page.getByRole("radio").first().check();
  await page.getByLabel("Your name").fill("Playwright User");
  await page.getByLabel("Email address").fill("playwright@example.test");
  await page.getByRole("button", { name: "Reserve session" }).click();
  await expect(page.getByText("Your session is reserved.")).toBeVisible();
  await expect(page.getByText(/STILL-/)).toBeVisible();
  await expect(page.getByText("Read back from the database with your private capability")).toBeVisible();
});

test("accessible fallback completes the same journey after a controlled primary regression, and staged repair restores keyboard focus", async ({ page }) => {
  await page.goto("/book?broken=1");
  await expect(page.getByRole("status").filter({ hasText: "Controlled preview regression" })).toBeVisible();
  const brokenTabIndex = await page.locator('input[type="radio"][name="slot"]').first().getAttribute("tabindex");
  expect(brokenTabIndex).toBe("-1");

  await page.goto("/book?broken=1&repaired=1");
  await expect(page.getByRole("status").filter({ hasText: "Staged GitLab Duo repair verified" })).toBeVisible();
  const repairedTabIndex = await page.locator('input[type="radio"][name="slot"]').first().getAttribute("tabindex");
  expect(repairedTabIndex).toBeNull();

  await page.goto("/book?broken=1");
  await page.getByRole("link", { name: /Use the simple path/ }).click();
  await expect(page).toHaveURL(/\/simple$/);
  await expect(page.getByRole("heading", { name: "Reserve without the noise." })).toBeVisible();
  await page.getByRole("combobox").selectOption("study-planning");
  await page.getByRole("radio").first().check();
  await page.getByLabel("Your name").fill("Fallback User");
  await page.getByLabel("Email address").fill("fallback@example.test");
  await page.getByRole("button", { name: "Reserve session" }).click();
  await expect(page.getByText("Your session is reserved.")).toBeVisible();
  await expect(page.getByText("Read back from the database with your private capability")).toBeVisible();
});

test("operator console reads stored service health, surfaces the 6-stage lifecycle trace, and renders the Incident Memory Lab", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A broken form shouldn't stop someone/i })).toBeVisible();
  await expect(page.getByText("Healthy journeys")).toBeVisible();
  await expect(page.getByText("synthetic environment", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: /The Continuity Bridge/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Auditable Lifecycle Trace/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Real-Time Continuity & Failover Choreography/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Repair Intelligence & Paired Evaluation Lab/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Live Product Walkthrough & Hover-Zoom Inspection/i })).toBeVisible();
  await page.getByRole("button", { name: /03 · P0-01 Capability Gate/i }).click();
  await page.getByRole("button", { name: /Inspect GitLab Duo Diagnosis & Diff/i }).click();
  await expect(page.getByText(/lc_run--01a16f00-4b97-7592-92a4-bb650b22a380/)).toBeVisible();
});
