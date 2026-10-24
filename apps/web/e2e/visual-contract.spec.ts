import path from "node:path";
import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 720, label: "320x720" },
  { width: 390, height: 844, label: "390x844" },
  { width: 768, height: 1024, label: "768x1024" },
  { width: 1024, height: 768, label: "1024x768" },
  { width: 1440, height: 900, label: "1440x900" },
  { width: 1920, height: 1080, label: "1920x1080" },
] as const;

for (const vp of viewports) {
  test(`visual contract at ${vp.label}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();

    const h1Box = await h1.boundingBox();
    expect(h1Box).not.toBeNull();
    expect(h1Box!.y).toBeGreaterThanOrEqual(0);
    expect(h1Box!.y + h1Box!.height).toBeLessThanOrEqual(vp.height);

    const primaryCta = page
      .getByRole("link", { name: /see the recovery|use the simple booking route/i })
      .first();
    await expect(primaryCta).toBeVisible();

    const ctaBox = await primaryCta.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(vp.height);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    const fixedOrStickyOverlap = await page.evaluate(() => {
      const h1El = document.querySelector("h1");
      const ctaEl = document.querySelector("main a, main button");
      if (!h1El || !ctaEl) return false;
      const targets = [h1El.getBoundingClientRect(), ctaEl.getBoundingClientRect()];
      const fixedEls = [...document.querySelectorAll("*")].filter((el) => {
        const pos = getComputedStyle(el).position;
        return (pos === "fixed" || pos === "sticky") && el.tagName !== "HEADER";
      });
      const overlaps = (a: DOMRect, b: DOMRect) =>
        !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      return fixedEls.some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && targets.some((t) => overlaps(r, t));
      });
    });

    expect(fixedOrStickyOverlap).toBe(false);

    const rootArtifacts = path.resolve(__dirname, "../../../artifacts/design");
    const webArtifacts = path.resolve(__dirname, "../artifacts/design");
    await page.screenshot({
      path: path.join(rootArtifacts, `after-${vp.label}.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(rootArtifacts, `still-${vp.label}.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(webArtifacts, `after-${vp.label}.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: path.join(webArtifacts, `still-${vp.label}.png`),
      fullPage: false,
    });
  });
}

test("reduced motion preserves keyboard focus and /simple remains calm", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  const activeTag = await page.evaluate(() => document.activeElement?.tagName ?? "NONE");
  expect(["A", "BUTTON", "INPUT", "SELECT"]).toContain(activeTag);

  await page.goto("/simple", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
