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

    await page.goto("/admin/system-health", { waitUntil: "networkidle" });
    await expect(page.getByText(/系统健康|System Health/i)).toBeVisible();
    await expect(page.getByText(/备份和恢复状态|Backup/i)).toBeVisible();
  });
});
