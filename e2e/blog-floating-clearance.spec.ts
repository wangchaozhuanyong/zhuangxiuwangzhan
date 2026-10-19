import { expect, test } from "@playwright/test";

for (const language of ["en", "zh", "ms"] as const) {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`floating shop stays visible and fixed while reading the blog in ${language} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}/blog`, { waitUntil: "domcontentloaded" });
      const entry = page.locator(".fc-furniture-floating");
      await expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", /^(ready|degraded)$/);
      await expect(page.locator(".fc-blog-articles")).toBeVisible();
      await expect(page.locator(".fc-blog-articles img").first()).toBeVisible();
      await expect(entry).toBeVisible();
      const anchor = await entry.boundingBox();
      expect(anchor).not.toBeNull();
      // Ordinary article text and cards do not reserve a lane or hide the entry.
      // Scroll both ways so mobile navigation and action panels are exercised.
      for (const fraction of [0, 0.3, 0.6, 1, 0.6, 0.3, 0]) {
        await page.evaluate(async (fraction) => {
          window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * fraction, behavior: "instant" });
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        }, fraction);
        await expect(entry).toBeVisible();
        await expect(entry).toHaveCSS("position", "fixed");
        await expect(entry).not.toHaveAttribute("data-obstructed", "true");
        if (width < 768) {
          const dock = page.getByTestId("mobile-bottom-dock");
          await expect(dock).toBeVisible();
          await expect(dock.locator('[data-active="true"]')).toBeVisible();
          const label = page.locator(".fc-furniture-floating__label--mobile");
          await expect(label).toBeVisible();
          const labelGeometry = await label.evaluate(node => {
            const labelRect = node.getBoundingClientRect();
            const buttonRect = node.closest(".fc-furniture-floating")!.getBoundingClientRect();
            return {
              labelLeft: labelRect.left,
              labelRight: labelRect.right,
              labelBottom: labelRect.bottom,
              buttonLeft: buttonRect.left,
              buttonRight: buttonRect.right,
              buttonBottom: buttonRect.bottom,
              labelHeight: labelRect.height,
              labelScrollHeight: node.scrollHeight,
            };
          });
          expect(labelGeometry.labelLeft).toBeGreaterThanOrEqual(labelGeometry.buttonLeft);
          expect(labelGeometry.labelRight).toBeLessThanOrEqual(labelGeometry.buttonRight);
          expect(labelGeometry.labelBottom).toBeLessThanOrEqual(labelGeometry.buttonBottom);
          expect(labelGeometry.labelHeight).toBeGreaterThan(0);
          expect(labelGeometry.labelScrollHeight).toBeLessThanOrEqual(labelGeometry.labelHeight + 1);
        }
        const geometry = await page.evaluate(() => {
          const floating = document.querySelector(".fc-furniture-floating")!.getBoundingClientRect();
          const dock = document.querySelector('[data-testid="mobile-bottom-dock"]')?.getBoundingClientRect();
          return {
            left: floating.left, top: floating.top, right: floating.right, bottom: floating.bottom,
            viewportWidth: innerWidth, viewportHeight: innerHeight,
            dockTop: dock?.top, overflow: document.documentElement.scrollWidth - innerWidth,
          };
        });
        expect(geometry.left).toBeGreaterThanOrEqual(0);
        expect(geometry.top).toBeGreaterThanOrEqual(0);
        expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
        expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
        expect(geometry.left).toBeCloseTo(anchor!.x, 0);
        expect(geometry.top).toBeCloseTo(anchor!.y, 0);
        if (width < 768) {
          expect(geometry.dockTop).toBeDefined();
          expect(geometry.bottom).toBeLessThanOrEqual(geometry.dockTop!);
        }
        expect(geometry.overflow).toBeLessThanOrEqual(1);
      }
    });
  }
}
