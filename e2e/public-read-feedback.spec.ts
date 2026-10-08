import { expect, test } from "@playwright/test";

for (const width of [360, 390, 768, 1024, 1440]) for (const language of ["zh", "en"] as const) {
  test(`${language} ${width}px background refresh stays quiet and keeps failure recovery`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.clock.install();
    let materialReads = 0;
    let refreshStarted = false;
    let failRefresh = true;
    let release!: () => void;
    const response = new Promise<void>((resolve) => { release = resolve; });
    // Local read fixtures isolate request timing and errors from the live CMS.
    await page.route("**/rest/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith("/materials") && url.searchParams.get("or")?.includes("category.neq.furniture") && !url.searchParams.has("limit")) {
        materialReads++;
        if (refreshStarted) {
          await response;
          if (failRefresh) {
            await route.fulfill({ status: 500, json: { message: "Synthetic refresh failure" } });
            return;
          }
        }
      }
      await route.fulfill({ json: [] });
    });
    try {
      await page.goto(`/${language}/materials`, { waitUntil: "domcontentloaded" });
      const content = page.locator(".public-route-content");
      const results = page.locator("#main-content [data-public-results]");
      const feedback = page.locator('[data-interaction-feedback="public"]');
      await expect(content).toHaveAttribute("data-route-visual-state", "ready", { timeout: 20000 });
      await expect(results).not.toHaveAttribute("aria-busy", "true");
      const initialReads = materialReads;
      const heading = await page.locator("#main-content h1").innerText();
      const firstCard = results.getByRole("heading").first();
      const previousCardTitle = await firstCard.innerText();

      // Return to a now-stale page through the existing visibility refresh path.
      refreshStarted = true;
      await page.clock.fastForward(61000);
      await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
      await expect.poll(() => materialReads).toBeGreaterThan(initialReads);
      await expect(results).toHaveAttribute("aria-busy", "true");
      await page.clock.runFor(5500);
      await expect(feedback).toHaveCount(0);
      await expect(content).toHaveAttribute("data-route-visual-state", "ready");
      await expect(page.locator("#main-content h1")).toHaveText(heading);
      await expect(firstCard).toHaveText(previousCardTitle);
      await expect(page.locator("[data-route-loader]")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width < 768) await expect(page.locator(".scheme-a-mobile-dock")).toBeVisible();
      await page.screenshot({ path: info.outputPath("quiet-background-refresh.png") });

      await page.clock.resume();
      release();
      await expect(feedback).toContainText(language === "zh"
        ? "更新未完成，已保留上次取得的内容。"
        : "Update failed. Previously loaded content has been kept.", { timeout: 10000 });
      await expect(results).not.toHaveAttribute("aria-busy", "true");
      await expect(firstCard).toHaveText(previousCardTitle);
      failRefresh = false;
      await feedback.getByRole("button", { name: language === "zh" ? "重试" : "Retry", exact: true }).click();
      await expect(feedback).toHaveCount(0);
      await expect(results).not.toHaveAttribute("aria-busy", "true");
      await expect(page.locator("#main-content h1")).toHaveText(heading);
      await info.attach("refresh-lifecycle", { body: JSON.stringify({ language, width, materialReads, slowRefreshQuiet: true, failureRetryRecovered: true }), contentType: "application/json" });
    } finally {
      release();
      await page.unrouteAll({ behavior: "wait" });
    }
  });
}
