import { expect, test } from "@playwright/test";

test("mobile home swaps navigation for contact actions only when scrolling up past the hero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });

  const hero = page.locator(".forest-home-hero");
  const bottomNav = page.locator(".forest-bottom-nav");
  await expect(hero).toBeVisible();
  await expect(bottomNav).toBeVisible();

  const heroHeight = await hero.evaluate((element) => element.getBoundingClientRect().height);
  await page.evaluate((target) => window.scrollTo({ top: target, behavior: "auto" }), heroHeight + 240);
  await page.waitForTimeout(120);
  await page.evaluate(() => window.scrollBy({ top: -120, behavior: "auto" }));

  const actionBar = page.locator(".mobile-action-bar");
  await expect(actionBar).toBeVisible();
  await expect(bottomNav).toHaveCount(0);

  await page.evaluate(() => window.scrollBy({ top: 160, behavior: "auto" }));
  await expect(actionBar).toHaveCount(0);
  await expect(page.locator(".forest-bottom-nav")).toBeVisible();
});
