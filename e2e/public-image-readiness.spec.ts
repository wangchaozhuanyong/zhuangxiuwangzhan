import { expect, test } from "@playwright/test";

const loader = ".scheme-a-page-loader--overlay";
const criticalImage = "#main-content img[data-critical-image='true']";

test("keeps the brand screen until the selected hero is decoded on direct load and navigation", async ({ page }) => {
  await page.route("**/images/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
    await route.continue();
  });
  await page.goto("/zh/services", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeVisible();
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
  await expect(page.locator(".scheme-a-chrome__brand img").first()).toHaveAttribute("data-image-state", "loaded");
  expect(await page.locator(criticalImage).evaluate((img: HTMLImageElement) => img.currentSrc && img.naturalWidth > 0)).toBeTruthy();

  await page.locator('a[href="/zh/about"]').first().evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page.locator(loader)).toBeVisible();
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");

  await page.locator('.scheme-a-language-switch a[href="/en/services"]').first().click();
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
});

test("supports both languages at the requested viewport widths", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["zh", "en"]) {
      await page.goto(`/${language}/about`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
      await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
      expect(await page.locator(criticalImage).evaluate((img: HTMLImageElement) => img.currentSrc && img.naturalWidth > 0)).toBeTruthy();
    }
  }
});

test("shows a visible retry state when a hero image fails", async ({ page }) => {
  await page.route("**/images/**", (route) => route.abort());
  await page.goto("/zh/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(".smart-image-failure")).toBeVisible();
  await expect(page.locator(".smart-image-failure button")).toBeVisible();
  await page.unroute("**/images/**");
  await page.locator(".smart-image-failure button").click();
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded", { timeout: 10_000 });
});

test("requests deferred home media before it scrolls into view", async ({ page }) => {
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  const projectMedia = page.locator(".scheme-a-project__media .smart-image-placeholder").first();
  const image = projectMedia.locator("img.smart-image");
  await expect(image).toHaveCount(1);
  await projectMedia.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("loading", "eager");
  await expect(image).toHaveAttribute("data-image-state", "loaded", { timeout: 10_000 });
});

test("does not remain on the brand screen after the five second image deadline", async ({ page }) => {
  await page.route("**/images/**", () => { /* Keep the image request pending. */ });
  await page.goto("/en/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeVisible();
  await expect(page.locator(loader)).toBeHidden({ timeout: 7_000 });
  await expect(page.locator(".smart-image-failure")).toBeVisible();
  await expect(page.locator(".smart-image-failure").getByRole("button", { name: "Retry" })).toBeVisible();
});
