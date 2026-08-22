import { expect, test } from "@playwright/test";

test("uses a dedicated offline page without caching live HTML", async ({ context, page }) => {
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
  expect(cacheKeys).toContain("flashcast-offline-v2");

  await context.setOffline(true);
  await page.goto("/zh/services", { waitUntil: "domcontentloaded" }).catch((error: unknown) => {
    if (!(error instanceof Error) || !error.message.includes("net::ERR_ABORTED")) throw error;
  });
  await expect(page.getByRole("heading", { name: "当前网络不可用" })).toBeVisible();
  await expect(page.locator("body")).toContainText("不会继续使用旧 HTML");
  await context.setOffline(false);
});
