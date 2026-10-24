import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const standards = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const surfaces = [
  { name: "operator console", path: "/", ready: "Healthy journeys" },
  { name: "primary booking", path: "/book", ready: "Reserve a university advice session." },
  { name: "accessible fallback", path: "/simple", ready: "Reserve without the noise." },
  { name: "privacy notice", path: "/privacy", ready: "Privacy & Synthetic Data Notice" },
  { name: "terms and license", path: "/terms", ready: "Terms of Use & MIT License" },
];

for (const surface of surfaces) {
  test(`${surface.name} has no detectable WCAG A/AA violations`, async ({ page }) => {
    await page.goto(surface.path);
    await expect(page.getByText(surface.ready, { exact: false }).first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(standards).analyze();
    expect(
      results.violations.map(
        (violation) =>
          `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help} [${violation.nodes
            .map((node) => node.target.join(" "))
            .join(", ")}]`,
      ),
    ).toEqual([]);
  });
}

test("responsive viewports (320px, 768px, 1440px) have zero horizontal overflow", async ({ page }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/book", "/simple"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}px on ${path}`).toBe(false);
    }
  }
});
