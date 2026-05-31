import { test, expect } from "@playwright/test";

test.describe("public site smoke", () => {
  test("zh homepage loads without replacement characters", async ({ page }) => {
    await page.goto("/zh", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page).toHaveTitle(/FLASH CAST/);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("�");
  });

  test("hreflang links exist on a content page", async ({ page }) => {
    await page.goto("/zh/quote", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(3);
    const hreflangs = await page
      .locator('link[rel="alternate"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("hreflang")));
    expect(hreflangs.filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });

  test("quote page keeps project context from CTA links", async ({ page }) => {
    await page.goto("/zh/quote?source=project&title=Mont%20Kiara%20Condo&projectType=Residential%20Renovation&location=Mont%20Kiara", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    await expect(page.getByText("已带入案例：Mont Kiara Condo")).toBeVisible();
    await expect(page.locator("#quote-project-type")).toHaveValue("Residential Renovation");
    await expect(page.locator("#quote-location")).toHaveValue("Mont Kiara");
    await expect(page.locator("#quote-details")).toHaveValue(/Mont Kiara Condo/);
  });

  test("service detail exposes contextual quote links", async ({ page }) => {
    await page.goto("/zh/services/renovation", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.locator('a[href*="source=service"]').first()).toBeVisible();
  });
});

test.describe("admin access guard", () => {
  test("unauthenticated admin page redirects to /admin", async ({ page }) => {
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/admin", { timeout: 15_000 });
  });

  test("unauthenticated system health page redirects to /admin", async ({ page }) => {
    await page.goto("/admin/system-health", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/admin", { timeout: 15_000 });
  });
});

test.describe("admin authenticated smoke", () => {
  test.skip(!process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD, "Set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD to run admin login smoke.");

  test("admin can sign in and open system health", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(process.env.ADMIN_TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.ADMIN_TEST_PASSWORD!);
    await page.getByRole("button", { name: /登录|Sign in/i }).click();
    await page.waitForURL("**/admin/dashboard", { timeout: 20_000 });

    await page.goto("/admin/system-health", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");
    await expect(page.getByText(/系统健康|System Health/i)).toBeVisible();
    await expect(page.getByText(/备份和恢复状态|Backup/i)).toBeVisible();
  });
});
