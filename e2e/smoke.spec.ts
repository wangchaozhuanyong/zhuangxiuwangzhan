import { test, expect, type Page } from "@playwright/test";

const isExternalSmoke = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const navigationAttempts = isExternalSmoke ? 2 : 1;
const navigationTimeout = isExternalSmoke ? 45_000 : 30_000;

const gotoSmokePage = async (page: Page, path: string) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= navigationAttempts; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: navigationTimeout });
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const canRetry = isExternalSmoke && /ERR_ABORTED|Timeout/i.test(message);
      if (!canRetry || attempt === navigationAttempts) throw error;
      await page.waitForTimeout(1_000);
    }
  }

  throw lastError;
};

test.describe("public site smoke", () => {
  test("zh homepage loads without replacement characters", async ({ page }) => {
    await gotoSmokePage(page, "/zh");
    await page.waitForLoadState("load");
    await expect(page).toHaveTitle(/FLASH CAST/);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("�");
  });

  test("zh homepage exposes a first-screen phone link on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoSmokePage(page, "/zh");
    await page.waitForLoadState("load");
    await expect(page.locator('.site-header__mobile-controls a[href^="tel:"]')).toBeVisible();
  });

  test("hreflang links exist on a content page", async ({ page }) => {
    await gotoSmokePage(page, "/zh/quote");
    await page.waitForLoadState("load");
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(3);
    const hreflangs = await page
      .locator('link[rel="alternate"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("hreflang")));
    expect(hreflangs.filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });

  test("quote page keeps project context from CTA links", async ({ page }) => {
    await gotoSmokePage(page, "/zh/quote?source=project&title=Mont%20Kiara%20Condo&projectType=Residential%20Renovation&location=Mont%20Kiara");
    await page.waitForLoadState("load");

    await expect(page.getByText("已带入案例：Mont Kiara Condo")).toBeVisible();
    await expect(page.locator("#quote-project-type")).toHaveValue("Residential Renovation");
    await expect(page.locator("#quote-location")).toHaveValue("Mont Kiara");
    await expect(page.locator("#quote-details")).toHaveValue(/Mont Kiara Condo/);
  });

  test("language switch keeps quote query context", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoSmokePage(page, "/en/quote?source=project&title=Mont%20Kiara%20Condo&projectType=Residential%20Renovation&location=Mont%20Kiara#quote-name");
    await page.waitForLoadState("load");

    await page.getByRole("link", { name: "Switch language" }).click();

    await expect(page).toHaveURL(/\/zh\/quote\?source=project&title=Mont%20Kiara%20Condo&projectType=Residential%20Renovation&location=Mont%20Kiara#quote-name$/);
    await expect(page.getByText("已带入案例：Mont Kiara Condo")).toBeVisible();
    await expect(page.locator("#quote-project-type")).toHaveValue("Residential Renovation");
    await expect(page.locator("#quote-location")).toHaveValue("Mont Kiara");
    await expect(page.locator("#quote-details")).toHaveValue("我想做类似案例：Mont Kiara Condo。");
  });

  test("quote form can reach success state without duplicate data writes", async ({ page }) => {
    let submitCount = 0;
    await page.route("**/functions/v1/submit-lead", async (route) => {
      submitCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, id: "quote-e2e" }),
      });
    });

    await gotoSmokePage(page, "/zh/quote");
    await page.waitForLoadState("load");
    await page.locator("#quote-name").fill("验收测试");
    await page.locator("#quote-phone").fill("+601128853888");
    await page.locator("#quote-email").fill("customer@example.com");
    await page.locator("#quote-location").fill("Kuala Lumpur");
    await page.locator("#quote-project-type").selectOption("Residential Renovation");
    await page.locator("#quote-details").fill("这是一次报价流程验收测试，不会写入真实数据。");
    await page.getByRole("button", { name: "提交报价请求" }).click();

    await expect(page.getByRole("heading", { name: "报价请求已提交！" })).toBeVisible();
    expect(submitCount).toBe(1);
  });

  test("quote form shows backend error state and fallback contact actions", async ({ page }) => {
    await page.route("**/functions/v1/submit-lead", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid form data" }),
      });
    });

    await gotoSmokePage(page, "/zh/quote");
    await page.waitForLoadState("load");
    await page.locator("#quote-name").fill("验收测试");
    await page.locator("#quote-phone").fill("+601128853888");
    await page.locator("#quote-location").fill("Kuala Lumpur");
    await page.locator("#quote-project-type").selectOption("Residential Renovation");
    await page.getByRole("button", { name: "提交报价请求" }).click();

    await expect(page.getByText("提交失败")).toBeVisible();
    await expect(page.locator('a[href^="https://wa.me/"]').first()).toBeVisible();
  });

  test("contact form validates empty required fields before submit", async ({ page }) => {
    let submitCount = 0;
    await page.route("**/functions/v1/submit-lead", async (route) => {
      submitCount += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });

    await gotoSmokePage(page, "/zh/contact");
    await page.waitForLoadState("load");
    await page.getByRole("button", { name: "发送信息" }).click();

    await expect(page.getByText("请输入姓名")).toBeVisible();
    await expect(page.getByText("请输入电话号码")).toBeVisible();
    await expect(page.getByText("请输入留言内容")).toBeVisible();
    expect(submitCount).toBe(0);
  });

  test("quote form rejects phone values that backend also rejects", async ({ page }) => {
    let submitCount = 0;
    await page.route("**/functions/v1/submit-lead", async (route) => {
      submitCount += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });

    await gotoSmokePage(page, "/zh/quote");
    await page.waitForLoadState("load");
    await page.locator("#quote-name").fill("验收测试");
    await page.locator("#quote-phone").fill("+601128853888999999999");
    await page.locator("#quote-location").fill("Kuala Lumpur");
    await page.locator("#quote-project-type").selectOption("Residential Renovation");
    await page.getByRole("button", { name: "提交报价请求" }).click();

    await expect(page.getByText("请输入有效的电话号码")).toBeVisible();
    expect(submitCount).toBe(0);
  });

  test("service detail exposes contextual quote links", async ({ page }) => {
    await gotoSmokePage(page, "/zh/services/renovation");
    await page.waitForLoadState("load");
    await expect(page.locator('a[href*="source=service"]').first()).toBeVisible();
  });
});

test.describe("admin access guard", () => {
  test("unauthenticated admin page redirects to /admin", async ({ page }) => {
    await gotoSmokePage(page, "/admin/dashboard");
    await page.waitForURL("**/admin", { timeout: 15_000 });
  });

  test("unauthenticated system health page redirects to /admin", async ({ page }) => {
    await gotoSmokePage(page, "/admin/system-health");
    await page.waitForURL("**/admin", { timeout: 15_000 });
  });

  test("unauthenticated lead reports page redirects to /admin", async ({ page }) => {
    await gotoSmokePage(page, "/admin/lead-reports");
    await page.waitForURL("**/admin", { timeout: 15_000 });
  });
});

test.describe("admin authenticated smoke", () => {
  test.skip(!process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD, "Set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD to run admin login smoke.");

  test("admin can sign in and open system health", async ({ page }) => {
    await gotoSmokePage(page, "/admin");
    await page.locator('input[type="email"]').fill(process.env.ADMIN_TEST_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.ADMIN_TEST_PASSWORD!);
    await page.getByRole("button", { name: /登录|Sign in/i }).click();
    await page.waitForURL("**/admin/dashboard", { timeout: 20_000 });

    await gotoSmokePage(page, "/admin/system-health");
    await page.waitForLoadState("load");
    await expect(page.getByRole("heading", { name: /系统健康|System Health/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /备份和恢复状态|Backup/i })).toBeVisible();
  });
});
