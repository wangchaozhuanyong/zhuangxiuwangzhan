import { expect, test, type Page } from "@playwright/test";

const gotoArticle = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.locator("[data-blog-date-metadata]").waitFor({ state: "visible" });
};

test.describe("blog freshness metadata", () => {
  test("shows real published and updated dates in English", async ({ page }) => {
    await gotoArticle(page, "/en/blog/malaysia-renovation-budget-guide");

    const dates = page.locator("[data-blog-date-metadata]");
    await expect(dates).toContainText("Published:");
    await expect(dates).toContainText("Last updated:");
    await expect(dates.locator("time")).toHaveCount(2);
  });

  test("shows the same date fields in Chinese without mobile overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoArticle(page, "/zh/blog/malaysia-renovation-budget-guide");

    const dates = page.locator("[data-blog-date-metadata]");
    await expect(dates).toContainText("发布于：");
    await expect(dates).toContainText("最后更新：");
    await expect(dates.locator("time")).toHaveCount(2);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
});
