import { expect, test } from "@playwright/test";

// A landscape thumbnail chosen from viewport width alone becomes several times
// larger when object-fit: cover fills a portrait hero.
for (const language of ["zh", "en"] as const) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 500, height: 1170 },
    { width: 1440, height: 900 },
  ]) {
    test(`repair hero selects a cover-sized image (${language}, ${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/${language}/services/surface-repair`);
      const hero = page.locator(".repair-hero");
      const image = hero.locator(".fcd-design-hero__media img");
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(element => {
        const img = element as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      })).toBe(true);
      const metrics = await image.evaluate(element => {
        const img = element as HTMLImageElement;
        const rect = img.getBoundingClientRect();
        const generatedWidth = img.currentSrc.match(/\/w(\d+)\//)?.[1];
        return {
          selectedWidth: generatedWidth ? Number(generatedWidth) : 1672,
          requiredWidth: Math.max(rect.width, rect.height * 1672 / 941),
          overflow: document.documentElement.scrollWidth > innerWidth + 2,
          filter: getComputedStyle(img).filter,
        };
      });
      // Source resolution is capped by the original; do not permit a small
      // thumbnail where an available larger candidate is needed for cover.
      expect(metrics.selectedWidth).toBeGreaterThanOrEqual(Math.min(1672, Math.ceil(metrics.requiredWidth)));
      expect(metrics.overflow).toBe(false);
      expect(metrics.filter).toBe("none");
    });
  }
}
