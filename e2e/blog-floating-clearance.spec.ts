import { expect, test } from "@playwright/test";

for (const language of ["en", "zh"] as const) {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`blog content stays clear of the floating entry in ${language} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}/blog`, { waitUntil: "domcontentloaded" });
      const entry = page.locator(".fc-furniture-floating");
      await expect(entry).toHaveAttribute("data-reserved-lane", "true");
      await expect(page.locator(".fc-blog-articles")).toBeVisible();
      await expect(page.locator(".fc-blog-articles img").first()).toBeVisible();
      for (const fraction of [0, 0.3, 0.6, 1]) {
        await page.evaluate((fraction) => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * fraction, behavior: "instant" }), fraction);
        const geometry = await page.evaluate(() => {
          const floating = document.querySelector(".fc-furniture-floating")!.getBoundingClientRect();
          const main = document.getElementById("main-content")!.getBoundingClientRect();
          const overlaps = Array.from(document.querySelectorAll(".fc-blog-articles img, .fc-blog-articles a, .fc-blog-articles p, .fc-blog-topics button")).filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && Math.min(rect.right, floating.right) > Math.max(rect.left, floating.left) && Math.min(rect.bottom, floating.bottom) > Math.max(rect.top, floating.top);
          }).length;
          return { overlaps, gap: floating.left - main.right, overflow: document.documentElement.scrollWidth - innerWidth };
        });
        expect(geometry.overlaps).toBe(0);
        expect(geometry.gap).toBeGreaterThanOrEqual(0);
        expect(geometry.overflow).toBeLessThanOrEqual(1);
      }
    });
  }
}
