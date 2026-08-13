import { expect, test } from "@playwright/test";

const legacyRoutes = [
  "/zh",
  "/zh/about",
  "/zh/services",
  "/zh/services/renovation",
  "/zh/materials",
  "/zh/materials/category/kitchen-cabinets",
  "/zh/materials/melamine-cabinet-grey-oak",
  "/zh/projects",
  "/zh/projects/modern-condo-mont-kiara",
  "/zh/process",
  "/zh/faq",
  "/zh/contact",
  "/zh/quote",
  "/zh/blog",
  "/zh/locations/kuala-lumpur",
  "/zh/landing/flooring",
  "/zh/privacy",
  "/zh/terms",
];

const newRoutes = [
  "/zh/products",
  "/zh/products/melamine-cabinet-grey-oak",
  "/zh/promotions",
  "/zh/locations",
];

test.describe("public URL compatibility", () => {
  for (const path of [...legacyRoutes, ...newRoutes]) {
    test(`${path} keeps a working localized page`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");

      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[?#].*)?$`));
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("main h1").first()).toBeVisible();
      await expect(page.locator("main")).not.toContainText("页面不存在");
      await expect(page.locator("main")).not.toContainText("Page not found");
    });
  }
});
