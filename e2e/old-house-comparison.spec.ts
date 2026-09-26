import { expect, test } from "@playwright/test";

for (const language of ["zh", "en"] as const) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    test(`old-house safe recovery keeps planning and quote without comparison images: ${language} ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/${language}/services/old-house`, { waitUntil: "domcontentloaded" });

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".scheme-a-transformations .fc-route-number-list li")).toHaveCount(3);
      await expect(page.locator(".fc-route-budget-card")).toHaveCount(3);
      await expect(page.locator(".scheme-a-transformation__compare")).toHaveCount(0);
      await expect(page.locator('img[src*="old-terrace"]')).toHaveCount(0);
      await expect(page.getByText(language === "zh" ? "不是客户完工项目的证据" : "not evidence of completed client projects", { exact: false })).toBeVisible();

      const quoteLink = page.locator('.fc-route-action-panel a[href*="/quote"]').first();
      await expect(quoteLink).toHaveAttribute("href", new RegExp(`^/${language}/quote\\?source=service`));
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    });
  }
}
