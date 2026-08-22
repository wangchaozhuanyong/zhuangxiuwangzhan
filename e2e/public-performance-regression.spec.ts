import { expect, test } from "@playwright/test";

test("mobile navigation remains stable while the header changes state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");

  const header = page.locator(".scheme-a-chrome");
  const switcher = page.getByTestId("mobile-bottom-dock");
  const dock = page.locator(".scheme-a-mobile-dock");
  const actionBar = page.locator(".scheme-a-contact-dock");
  await expect(header).toHaveClass(/is-overlay/);
  await expect(dock).toBeVisible();
  await expect(dock.locator("a")).toHaveCount(5);

  const heroHeight = await page.locator(".scheme-a-hero").evaluate((element) => element.getBoundingClientRect().height);
  await page.evaluate((target) => window.scrollTo({ top: target, behavior: "auto" }), heroHeight + 120);
  await expect(header).toHaveClass(/is-solid/);
  await expect(switcher).toHaveAttribute("data-mode", "actions");
  await expect(actionBar).toBeVisible();
  await expect(dock).not.toBeVisible();

  await page.evaluate(() => window.scrollBy({ top: -40, behavior: "auto" }));
  await expect(switcher).toHaveAttribute("data-mode", "navigation");
  await expect(dock).toBeVisible();

  await dock.locator('a[href="/zh/contact"]').click();
  await expect(page).toHaveURL(/\/zh\/contact$/);
  await page.waitForLoadState("networkidle");
  await expect(switcher).toHaveAttribute("data-mode", "navigation");
  await expect(dock).toBeVisible();

  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "auto" }));
  await expect(switcher).toHaveAttribute("data-mode", "actions");
  await expect(actionBar).toBeVisible();
  await expect(actionBar.locator("a")).toHaveCount(3);
  await expect(actionBar.locator('a[href="#contact-name"]')).toBeVisible();
  await page.waitForTimeout(300);
  await actionBar.locator('a[href="#contact-name"]').click();
  await expect(page.locator("#contact-name")).toBeFocused();
  await expect(switcher).toHaveAttribute("data-mode", "hidden");

  await page.goto("/en/quote", { waitUntil: "domcontentloaded" });
  await expect(switcher).toHaveAttribute("data-mode", "navigation");
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "auto" }));
  await expect(switcher).toHaveAttribute("data-mode", "actions");
  await expect(page.locator('.scheme-a-contact-dock a[href="#quote-name"]')).toBeVisible();
});

test("mobile pages keep native vertical scrolling while media loads", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cinematicMotionRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("PublicCinematicMotion")) cinematicMotionRequests.push(request.url());
  });
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await expect(page.locator(".scheme-a-home")).toBeVisible();
  await page.waitForTimeout(600);

  expect(cinematicMotionRequests).toEqual([]);

  const motionState = await page.locator("[data-cinematic-section]").evaluateAll((sections) =>
    sections.map((section) => {
      const element = section as HTMLElement;
      return {
        opacity: element.style.opacity,
        transform: element.style.transform,
      };
    }),
  );

  expect(motionState.length).toBeGreaterThan(0);
  expect(motionState.every(({ opacity, transform }) => opacity === "" && transform === "")).toBe(true);

  const comparison = page.locator(".scheme-a-compare input[type='range']");
  await expect(comparison).toHaveCSS("touch-action", "pan-y");

  const startY = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo({ top: 1600, behavior: "auto" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(startY + 1000);
});

test("desktop loads cinematic motion after the initial render", async ({ page }) => {
  const cinematicMotionRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("PublicCinematicMotion")) cinematicMotionRequests.push(request.url());
  });

  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".scheme-a-home")).toBeVisible();
  await expect.poll(() => cinematicMotionRequests.length).toBeGreaterThan(0);
});

test("before-and-after comparison keeps vertical touch panning available", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh/before-after", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");

  const comparison = page.locator(".scheme-a-transformation__compare input[type='range']").first();
  await expect(comparison).toBeVisible();
  await expect(comparison).toHaveCSS("touch-action", "pan-y");
});
