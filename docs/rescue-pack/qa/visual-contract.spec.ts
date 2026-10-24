// Adaptable Playwright visual/first-fold contract for STILL.
// Not claimed to have executed. Place under your actual tests directory and
// reconcile test baseURL, route names and texts with deployed markup.
import { test, expect } from '@playwright/test';

const sizes = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

for (const viewport of sizes) {
  test(`STILL hero and primary action survive ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/broken form|stop someone|finish/i);
    const primary = page.getByRole('link', { name: /see the recovery/i }).first();
    await expect(primary).toBeVisible();
    const titleRect = await h1.boundingBox();
    const ctaRect = await primary.boundingBox();
    expect(titleRect, 'H1 must have a physical box').not.toBeNull();
    expect(ctaRect, 'CTA must have a physical box').not.toBeNull();
    expect(titleRect!.y).toBeGreaterThanOrEqual(0);
    expect(titleRect!.y + titleRect!.height).toBeLessThan(viewport.height);
    expect(ctaRect!.y + ctaRect!.height).toBeLessThan(viewport.height);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(horizontalOverflow, 'No horizontal document overflow').toBe(false);

    // Only blocks specifically identifying a previous production failure: a fixed
    // overlay intersecting the hero H1 or primary CTA. More targeted manual review
    // must still inspect every screenshot.
    const occlusion = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const mainAction = [...document.querySelectorAll('a')].find(a => /see the recovery/i.test(a.textContent || ''));
      if (!h1 || !mainAction) return { error: 'hero targets missing' };
      const targets = [h1.getBoundingClientRect(), mainAction.getBoundingClientRect()];
      const intersects = (a: DOMRect, b: DOMRect) => Math.max(a.left, b.left) < Math.min(a.right, b.right) && Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom);
      const blockers = [...document.querySelectorAll('body *')].filter((el) => {
        if (el === h1 || el === mainAction || el.contains(h1) || el.contains(mainAction) || h1.contains(el) || mainAction.contains(el)) return false;
        const s = getComputedStyle(el);
        if (!['fixed', 'sticky'].includes(s.position)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && targets.some(t => intersects(t, r));
      });
      return { blockerCount: blockers.length, blockers: blockers.slice(0, 4).map(x => x.tagName + '.' + String((x as HTMLElement).className).slice(0, 80)) };
    });
    expect(occlusion).toEqual({ blockerCount: 0, blockers: [] });

    await page.screenshot({ path: `artifacts/design/still-${viewport.width}x${viewport.height}.png`, fullPage: true });
  });
}

test('reduced motion keeps primary action accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const primary = page.getByRole('link', { name: /see the recovery/i }).first();
  await expect(primary).toBeVisible();
  await primary.focus();
  await expect(primary).toBeFocused();
  // Add a screenshot and UI motion-state assertions once actual component selectors are available.
});

test('fallback remains a functional non-decorative route', async ({ page }) => {
  await page.goto('/simple');
  await expect(page.getByRole('main')).toBeVisible();
  expect(await page.getByRole('heading').count(), 'fallback must have a named heading').toBeGreaterThan(0);
  // The product's existing booking E2E test is authoritative for server write/readback.
  // Do not fake a booking in this visual-only contract.
});
