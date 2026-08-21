import { expect, test } from "@playwright/test";

test("mobile navigation remains stable while the header changes state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");

  const header = page.locator(".scheme-a-chrome");
  const dock = page.locator(".scheme-a-mobile-dock");
  await expect(header).toHaveClass(/is-overlay/);
  await expect(dock).toBeVisible();
  await expect(dock.locator("a")).toHaveCount(5);

  const heroHeight = await page.locator(".scheme-a-hero").evaluate((element) => element.getBoundingClientRect().height);
  await page.evaluate((target) => window.scrollTo({ top: target, behavior: "auto" }), heroHeight + 120);
  await expect(header).toHaveClass(/is-solid/);
  await expect(dock).toBeVisible();

  await dock.locator('a[href="/zh/contact"]').click();
  await expect(page).toHaveURL(/\/zh\/contact$/);
  await expect(page.locator('.scheme-a-mobile-dock a[aria-current="page"]')).toHaveAttribute("href", "/zh/contact");
  await expect(page.locator(".scheme-a-mobile-dock")).toBeVisible();
});
