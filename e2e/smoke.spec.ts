import { test, expect } from "@playwright/test";

test.describe("public site smoke", () => {
  test("zh homepage loads without replacement characters", async ({ page }) => {
    await page.goto("/zh", { waitUntil: "networkidle" });
    await expect(page).toHaveTitle(/FLASH CAST/);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("�");
  });

  test("hreflang links exist on a content page", async ({ page }) => {
    await page.goto("/zh/quote", { waitUntil: "networkidle" });
    const hreflangs = await page
      .locator('link[rel="alternate"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("hreflang")));
    expect(hreflangs.filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });
});

test.describe("admin access guard", () => {
  test("unauthenticated admin page redirects to /admin", async ({ page }) => {
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/admin", { timeout: 15_000 });
  });
});

