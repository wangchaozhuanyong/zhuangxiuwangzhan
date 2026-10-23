import { expect, test } from "@playwright/test";
import { startSwNavigationFixture } from "./fixtures/sw-navigation-compat.mjs";

test("compatibility worker leaves document requests to the browser", async ({ page }) => {
  await page.goto("/zh", { waitUntil: "load" });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => reject(new Error("Service Worker did not take control.")), 5_000);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.clearTimeout(timeoutId);
        resolve();
      }, { once: true });
    });
  });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const cacheKeys = await page.evaluate(async () => caches.keys());
  expect(cacheKeys).not.toContain("flashcast-offline-v2");

  const response = await page.reload({ waitUntil: "load" });
  expect(response?.ok()).toBe(true);
  expect(response?.fromServiceWorker()).toBe(false);
});

test("upgrades the existing worker without clearing drafts, storage, or caches", async ({ context, page }) => {
  const fixture = await startSwNavigationFixture();
  try {
    await page.goto(`${fixture.origin}/zh`, { waitUntil: "load" });
    await page.getByRole("button", { name: "安装旧版本", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("旧版本已接管");
    await page.getByLabel("未提交的测试草稿").fill("不要丢失这份未提交草稿");
    const originalDocument = await page.locator("#document-id").textContent();
    const probe = await context.newPage();
    expect((await probe.goto(`${fixture.origin}/zh/services`))?.fromServiceWorker()).toBe(true);
    fixture.setOffline(true);
    await probe.goto(`${fixture.origin}/zh/services?old-offline=1`);
    await expect(probe.getByRole("heading", { name: "旧版定制离线页" })).toBeVisible();
    fixture.setOffline(false);
    await probe.close();

    await page.getByRole("button", { name: "升级候选版本", exact: true }).click();
    await expect(page.getByRole("status")).toContainText('"draftPreserved": true');
    const checks = JSON.parse(await page.getByRole("status").innerText()) as Record<string, boolean>;
    expect(Object.keys(checks)).toHaveLength(7);
    expect(Object.values(checks).every(Boolean)).toBe(true);
    await expect(page.locator("#document-id")).toHaveText(originalDocument!);
    await expect(page.getByLabel("未提交的测试草稿")).toHaveValue("不要丢失这份未提交草稿");

    const candidateProbe = await context.newPage();
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await candidateProbe.goto(`${fixture.origin}/zh/services?candidate=${attempt}`);
      expect(response?.ok()).toBe(true);
      expect(response?.fromServiceWorker()).toBe(false);
    }
    fixture.setOffline(true);
    // A rejected goto can arrive before Chromium commits its native error page.
    // Wait for that document before restoring the server and navigating again.
    const nativeOfflineDocument = candidateProbe.waitForEvent("framenavigated", {
      predicate: (frame) => frame === candidateProbe.mainFrame() && frame.url() === "chrome-error://chromewebdata/",
    });
    await expect(candidateProbe.goto(`${fixture.origin}/zh/services?new-offline=1`)).rejects.toThrow();
    await nativeOfflineDocument;
    fixture.setOffline(false);
    expect((await candidateProbe.goto(`${fixture.origin}/zh`))?.ok()).toBe(true);
    await expect(page.getByLabel("未提交的测试草稿")).toHaveValue("不要丢失这份未提交草稿");
  } finally {
    fixture.setOffline(false);
    await fixture.close();
  }
});
