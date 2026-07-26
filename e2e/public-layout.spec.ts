import { expect, test } from "@playwright/test";

const publicPaths = ["/zh", "/zh/services", "/zh/materials", "/zh/projects", "/zh/quote", "/zh/contact", "/zh/process"];

const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small-desktop", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
];

test.describe("public responsive layout", () => {
  for (const viewport of viewports) {
    for (const path of publicPaths) {
      test(`${viewport.name} ${path} has no horizontal overflow or broken text`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("load");
        await page.waitForTimeout(500);

        const result = await page.evaluate(() => {
          const root = document.documentElement;
          const bodyText = document.body.innerText;
          return {
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            hasReplacementCharacter: bodyText.includes("�"),
          };
        });

        expect(result.hasReplacementCharacter).toBe(false);
        expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth + 1);
      });
    }
  }

  test("mobile header keeps stable height when language changes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await page.locator(".site-header__mobile-controls").waitFor({ state: "visible" });

    const readHeaderMetrics = () =>
      page.evaluate(() => {
        const measure = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const rect = element.getBoundingClientRect();
          return Math.round(rect.height);
        };

        return {
          header: measure(".site-header"),
          inner: measure(".site-header__inner"),
          controls: measure(".site-header__mobile-controls"),
          languageButton: measure(".site-header__mobile-button"),
        };
      });

    const before = await readHeaderMetrics();

    await page.locator(".site-header__mobile-button").first().click();
    await expect(page).toHaveURL(/\/en$/);
    await page.locator(".site-header__mobile-controls").waitFor({ state: "visible" });

    const after = await readHeaderMetrics();

    expect(after).toEqual(before);
  });

  test("mobile footer contact link opens the contact page from the company panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await page.locator("footer").scrollIntoViewIfNeeded();
    const companyPanel = page.locator(".footer-mobile-panel").filter({
      has: page.locator('a[href$="/zh/contact"]'),
    });

    await expect(companyPanel.locator(".footer-mobile-panel-body")).toHaveAttribute("aria-hidden", "true");
    await companyPanel.getByRole("button").click();
    await expect(companyPanel.locator(".footer-mobile-panel-body")).toHaveAttribute("aria-hidden", "false");

    await companyPanel.locator('a[href$="/zh/contact"]').click();

    await expect(page).toHaveURL(/\/zh\/contact$/);
    await expect(page.locator("#contact-name")).toBeVisible();
  });

  test("mobile quote and contact pages expose page-aware bottom actions after the compact hero", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const scenario of [
      { path: "/zh/quote", formHref: "#quote-name", formLabel: "填写表单" },
      { path: "/zh/contact", formHref: "#contact-name", formLabel: "填写留言" },
    ]) {
      await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      await expect(page.locator(".page-hero")).toHaveClass(/page-hero--compact/);
      await expect
        .poll(() => page.locator(".page-hero").evaluate((hero) => hero.getBoundingClientRect().height))
        .toBeLessThanOrEqual(380);

      await page.locator(".page-hero").evaluate((hero) => {
        window.scrollTo(0, hero.getBoundingClientRect().height + 80);
      });

      const actionBar = page.locator(".mobile-action-bar");
      await expect(actionBar).toBeVisible();
      await expect(actionBar.locator('a[href^="https://wa.me/"]')).toBeVisible();
      await expect(actionBar.locator('a[href^="tel:"]')).toBeVisible();
      await expect(actionBar.locator(`a[href="${scenario.formHref}"]`)).toHaveText(scenario.formLabel);
    }
  });
});
