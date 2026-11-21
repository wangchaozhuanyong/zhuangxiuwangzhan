import { expect, test, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { ANZHE_SHOWROOM_ORIGIN as origin } from "../src/config/anzheShowroom";

const publicDirectory = resolve("public");
const modelPath = "/zh/lock/v37j-p16/";
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
let serveAnzheShowroom: typeof import("../functions/anzheShowroom").serveAnzheShowroom;

// Like anzhe-showroom-loading.spec.ts, route the public host to the static showroom
// on disk. Run the real handler too, so 404s and redirects exercise its allowlist.
async function serveShowroom(page: Page) {
  const assets = {
    async fetch(request: Request) {
      const { pathname } = new URL(request.url);
      const filename = resolve(publicDirectory, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
      if (!filename.startsWith(publicDirectory + sep)) return new Response(null, { status: 404 });
      try {
        const bytes = await readFile(filename);
        return new Response(new Uint8Array(bytes), {
          headers: { "content-type": contentTypes[extname(filename)] || "application/octet-stream" },
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
        throw error;
      }
    },
  };
  await page.route(origin + "/**", async route => {
    const response = await serveAnzheShowroom(
      new Request(route.request().url(), { method: route.request().method() }),
      assets, "zh", "playwright",
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

async function assertHeaderFits(page: Page) {
  const layout = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      headerBottom: box(".mast").bottom,
      headingTop: box("h1").top,
      languageRight: box(".lang-switch").right,
    };
  });
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.languageRight).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.headingTop).toBeGreaterThanOrEqual(layout.headerBottom);
}

test.use({ bypassCSP: false, reducedMotion: "reduce" });
test.beforeAll(async () => {
  // Bundle the Pages handler's shared cache imports, including their JSON assets.
  const { outputFiles } = await build({
    entryPoints: ["functions/anzheShowroom.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
  });
  const moduleUrl = "data:text/javascript;base64," + Buffer.from(outputFiles[0].contents).toString("base64");
  ({ serveAnzheShowroom } = await import(moduleUrl));
});
test.beforeEach(async ({ page }) => { await serveShowroom(page); });

test("renders one model heading and switches language on the same model", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(origin + modelPath);
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-type"]).toContain("text/html");
  const heading = page.locator("h1");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "V37J-P16 是 CNC 精雕铝合金锁身配钢化玻璃与隐藏式指纹头，含 C 级锁芯、4.5 英寸屏与掌静脉开锁，含安装价 RM2,360。",
  );
  await expect(heading).toHaveCount(1);
  await expect(heading).toContainText("V37J-P16");
  await expect(heading).toBeInViewport();
  await expect(page.locator(".hero-board img")).toHaveJSProperty("complete", true);
  expect(await page.locator(".hero-board img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await assertHeaderFits(page);
  await page.screenshot({ path: testInfo.outputPath("v37j-p16-desktop.png") });

  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(origin + "/en/lock/v37j-p16/");
  await expect(heading).toHaveText("V37J-P16 Palm Vein Digital Lock — RM2,360");
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", page.url());
  await page.getByRole("link", { name: "Bahasa Melayu", exact: true }).click();
  await expect(page).toHaveURL(origin + "/ms/lock/v37j-p16/");
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", "noindex");
});

test.describe("without JavaScript at mobile widths", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, hasTouch: true });

  test("keeps the installed price and specifications readable", async ({ page }, testInfo) => {
    expect((await page.goto(origin + modelPath))?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(/V37J-P16.*含安装 RM[\d,.]+/);
    await expect(page.locator("h1")).toBeInViewport();
    await expect(page.locator('#specifications [data-spec="access"]')).toContainText("指纹");
    await expect(page.locator("#faq article")).toHaveCount(3);
    await assertHeaderFits(page);
    await page.screenshot({ path: testInfo.outputPath("v37j-p16-mobile-no-js.png") });

    for (const width of [360, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      await assertHeaderFits(page);
    }
  });
});

test("returns 404 for a model outside the allowlist", async ({ page }) => {
  const response = await page.goto(origin + "/zh/lock/not-a-model/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(0);
});

test("serves the exact IndexNow key only at the allowlisted root path", async ({ page }) => {
  const key = "89a0d82405fcdd4e83a37a2c1608813e";
  const response = await page.goto(`${origin}/${key}.txt`);
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-type"]).toContain("text/plain");
  expect(await response?.text()).toBe(key);
  expect((await page.goto(`${origin}/en/${key}.txt`))?.status()).toBe(404);
  expect((await page.goto(`${origin}/${key.slice(1)}.txt`))?.status()).toBe(404);
});
