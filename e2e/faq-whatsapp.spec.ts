import { expect, test } from "@playwright/test";

for (const language of ["en", "zh"] as const) {
  for (const width of [360, 390, 768, 1024, 1440]) {
    test(`FAQ WhatsApp uses the shared contact URL in ${language} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}/faq`, { waitUntil: "domcontentloaded" });
      const panel = page.locator(".fc-route-action-panel");
      await expect(panel).toBeVisible();
      const link = panel.getByRole("link", { name: /WhatsApp/i });
      await expect(link).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      const href = await link.getAttribute("href");
      expect(href).not.toContain("/quote");
      const message = new URL(href!).searchParams.get("text") || "";
      expect(message.length).toBeGreaterThan(0);
      expect(/[\u4e00-\u9fff]/.test(message)).toBe(language === "zh");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    });
  }
}
