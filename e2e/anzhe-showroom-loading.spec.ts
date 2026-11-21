import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";

function pendingAsset() {
  let release!: () => void;
  const wait = new Promise<void>(resolveWait => { release = resolveWait; });
  return { wait, release };
}

const origin = "https://locks.flashcast.com.my";

async function serveShowroom(page: Page, beforeAsset?: (path: string) => Promise<void>) {
  const showroom = resolve("public/anzhe-showroom");
  await page.route(origin + "/**", async route => {
    const path = new URL(route.request().url()).pathname;
    await beforeAsset?.(path);
    const file = path === "/public-section-spacing.css" ? resolve("public/public-section-spacing.css")
      : resolve(showroom, path === "/zh/" ? "zh/index.html" : "." + path);
    await route.fulfill({ path: file });
  });
}

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });

test("a delayed showroom stylesheet and visible lock photo keep their place in the initial mobile handoff", async ({ page }) => {
  const style = pendingAsset();
  const photo = pendingAsset();
  await serveShowroom(page, async path => {
    if (path === "/studio.css") await style.wait;
    if (path === "/assets/v37-out.webp") await photo.wait;
  });
  try {
    await page.goto(origin + "/zh/", { waitUntil: "commit" });
    const root = page.locator("#root");
    await expect(page.locator("#flashcast-public-boot")).toBeVisible();
    await expect(root).toHaveAttribute("inert", "");
    style.release();
    await page.waitForFunction(() => window.showroomInteractive && !document.querySelector('link[data-public-style]:not([media="all"])'));
    const image = page.locator('.hero-board img[src$="v37-out.webp"]');
    await expect(image).toBeInViewport();
    await expect(root).toHaveAttribute("inert", "");
    photo.release();
    await expect(root).not.toHaveAttribute("inert", "");
    expect(await image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally {
    style.release();
    photo.release();
  }
});

for (const section of ["hero", "specifications", "installation"]) {
  test(`recovers from delayed scripts while reading ${section}`, async ({ page }) => {
    const script = pendingAsset();
    await serveShowroom(page, async path => { if (path === "/studio.js") await script.wait; });
    try {
      await page.goto(origin + "/zh/", { waitUntil: "commit" });
      await page.locator('[data-boot-action="continue"]').click();
      const sheets = page.locator(".static-catalog article");
      await expect(sheets).toHaveCount(17);
      const sheet = sheets.nth(3);
      const installation = page.locator("#installation");
      let originalTop = 0;
      if (section === "specifications") await sheet.evaluate(el => el.scrollIntoView({ block: "start" }));
      if (section === "installation") {
        await installation.evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
        originalTop = (await installation.boundingBox())!.y;
      }
      script.release();
      await page.waitForFunction(() => window.showroomInteractive);
      if (section === "specifications") {
        await expect(sheet).toBeInViewport();
        await page.locator('.site-nav a[href="#collection"]').click();
      }
      await expect(sheets).toHaveCount(0);
      if (section === "installation") expect(Math.abs((await installation.boundingBox())!.y - originalTop)).toBeLessThan(2);
      await expect(page.locator("#directory")).toBeVisible();
      await page.locator('[data-dir-card="f8"]').click();
      await expect(page.locator("#details")).toBeVisible();
    } finally {
      script.release();
    }
  });
}

for (const selector of ['[data-dir-card="f8"]', '[data-show-featured]']) {
  test(`mobile detail from ${selector} respects touch and keyboard focus`, async ({ page }) => {
    await serveShowroom(page);
    await page.goto(origin + "/zh/");
    const opener = page.locator(selector);
    const dialog = page.locator("#details");
    const back = dialog.locator("[data-dir-back]");
    await opener.tap();
    await expect(dialog).toBeFocused();
    await expect(back).toHaveCSS("outline-style", "none");
    await back.tap();
    await expect(opener).toBeFocused();
    await opener.press("Enter");
    await expect(back).toBeFocused();
    await expect(back).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });
}

test("comparison cards, specification columns and the two footer actions stay aligned", async ({ page }) => {
  await serveShowroom(page);
  await page.goto(origin + "/zh/");
  await page.locator("[data-example]").click();
  for (const width of [320, 500, 640, 641, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    const panel = page.locator("#panel");
    const cards = panel.locator(".pn-pair > [data-slot]");
    const values = panel.locator(".pn-spec-table").first().locator("tbody tr").first().locator("td");
    for (const index of [0, 1]) {
      const card = (await cards.nth(index).boundingBox())!;
      const value = (await values.nth(index).boundingBox())!;
      expect(Math.abs(card.x - value.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(card.width - value.width)).toBeLessThanOrEqual(1);
    }
    const footer = panel.locator(".pn-comparison-actions");
    const row = (await footer.boundingBox())!;
    const first = (await footer.locator("a").boundingBox())!;
    const second = (await footer.locator("button").boundingBox())!;
    expect(Math.abs(first.width - second.width)).toBeLessThanOrEqual(1);
    expect(first.y).toBe(second.y);
    expect(Math.abs(first.x - row.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(second.x + second.width - row.x - row.width)).toBeLessThanOrEqual(1);
  }
});
