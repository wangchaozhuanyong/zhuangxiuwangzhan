import { expect, test } from "@playwright/test";

const loader = ".scheme-a-page-loader--overlay";
const criticalImage = "#main-content img[data-critical-image='true']";

test("shows the brand screen on direct load without repeating it during navigation", async ({ page }) => {
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

  await page.evaluate(() => {
    document.body.dataset.brandOverlayAdds = "0";
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && (node.matches(".scheme-a-page-loader--overlay") || node.querySelector(".scheme-a-page-loader--overlay"))) {
            document.body.dataset.brandOverlayAdds = String(Number(document.body.dataset.brandOverlayAdds) + 1);
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  });

  await page.locator('a[href="/zh/about"]').first().evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page).toHaveURL(/\/zh\/about$/);
  await expect(page.locator(loader)).toHaveCount(0);
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded", { timeout: 10_000 });

  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toHaveCount(0);
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");

  await page.locator('.scheme-a-language-switch a[href="/en/services"]').first().click();
  await expect(page.locator(loader)).toHaveCount(0);
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
  expect(await page.locator("body").getAttribute("data-brand-overlay-adds")).toBe("0");
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

test("continues browsing after the image deadline without marking pending transfers as failures", async ({ page }) => {
  await page.route("**/images/**", () => { /* Keep the image request pending. */ });
  await page.goto("/en/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeVisible();
  await expect(page.locator(loader)).toBeHidden({ timeout: 7_000 });
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loading");
  await expect(page.locator(".smart-image-failure")).toHaveCount(0);
  await page.unroute("**/images/**");
});

test("keeps detail loading geometry stable until the first published data result", async ({ page }) => {
  for (const path of ["/zh/projects/corporate-office-petaling-jaya", "/zh/materials/acrylic-cabinet-gloss-white"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    let release = () => {};
    const pending = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/rest/v1/**", async (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) return route.fallback();
      await pending;
      await route.continue();
    });
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-route-pending="true"]')).toBeVisible();
      await expect(page.locator("main h1")).toHaveCount(0);
      const footerTop = await page.locator(".scheme-a-footer").evaluate((footer) => footer.getBoundingClientRect().top);
      expect(footerTop).toBeGreaterThanOrEqual(844);
      release();
      await expect(page.locator('[data-route-pending="true"]')).toHaveCount(0, { timeout: 20_000 });
      await expect(page.locator("main h1")).toBeVisible();
    } finally {
      release();
      await page.unroute("**/rest/v1/**");
    }
  }
});
