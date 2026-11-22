import { expect, test, type Page } from "@playwright/test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { runInNewContext } from "node:vm";
import { ANZHE_SHOWROOM_ORIGIN as origin } from "../src/config/anzheShowroom";

type Model = {
  id: string;
  name: string;
  price: number;
  group: string;
  access: { zh: string };
  copy: { zh: string };
  screen: number | null;
};

const publicDirectory = resolve("public");
const modelPath = "/zh/lock/v37j-p16/";
const languages = ["zh", "en", "ms"] as const;
const categories = [
  { slug: "type/entrance-door", count: 14, matches: (model: Model) => model.group === "entrance" },
  { slug: "type/interior-door", count: 2, matches: (model: Model) => model.group === "room" },
  { slug: "type/aluminium-door", count: 1, matches: (model: Model) => model.group === "slim" },
  { slug: "feature/face-recognition", count: 10, matches: (model: Model) => model.access.zh.includes("人脸") },
  { slug: "feature/palm-vein", count: 9, matches: (model: Model) => model.access.zh.includes("掌静脉") },
  { slug: "feature/video-intercom", count: 6, matches: (model: Model) => model.screen !== null && /对讲|门铃/.test(model.copy.zh) },
];
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
let serveAnzheShowroom: typeof import("../functions/anzheShowroom").serveAnzheShowroom;
let catalogue: { lockCatalog: Model[]; formatShowroomPrice: (price: number) => string };

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
  const catalogueSource = await readFile(resolve(publicDirectory, "anzhe-showroom/catalog.js"), "utf8");
  catalogue = runInNewContext(catalogueSource + "\nglobalThis;", {}, { timeout: 1000 });
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
  await expect(page.locator('[data-model-categories] a[href="/zh/lock/type/entrance-door/"]')).toBeVisible();
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("v37j-p16-desktop-category-footer.png") });

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
    await expect(page.locator('[data-model-categories] a[href="/zh/lock/feature/palm-vein/"]')).toBeVisible();
    await page.locator(".site-footer").scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("v37j-p16-mobile-category-footer.png") });

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

test.describe("public lock categories without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, hasTouch: true });

  for (const { slug, count, matches } of categories) {
    test(`lists the catalogue's ${slug} models in all three languages`, async ({ page }) => {
      const models = catalogue.lockCatalog.filter(matches);
      expect(models).toHaveLength(count);
      for (const language of languages) {
        const url = `${origin}/${language}/lock/${slug}/`;
        const response = await page.goto(url);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator("[data-category-answer]")).toHaveText(/RM[\d,.]+/);
        await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", url);
        await expect(page.locator("link[hreflang]")).toHaveCount(4);
        await expect(page.locator("#selection h2")).toHaveCount(3);
        await expect(page.locator("#faq article")).toHaveCount(3);
        await expect(page.locator("a[href^='https://wa.me/']")).toBeVisible();
        const robots = page.locator("meta[name=robots]");
        if (language === "ms") await expect(robots).toHaveAttribute("content", "noindex");
        else await expect(robots).toHaveCount(0);

        const cards = page.locator("a[data-category-model][href]");
        await expect(cards).toHaveCount(count);
        const listed = await cards.evaluateAll(anchors => anchors.map(anchor => ({
          href: anchor.getAttribute("href"),
          name: anchor.querySelector("figcaption strong")?.textContent,
          price: anchor.querySelector("figcaption b")?.firstChild?.textContent?.trim(),
        })));
        expect(listed).toEqual(models.map(model => ({
          href: `/${language}/lock/${model.id}/`,
          name: model.name,
          price: catalogue.formatShowroomPrice(model.price),
        })));
        if (slug === "type/interior-door") {
          await expect(cards.locator("b").filter({ hasText: "RM635.20" })).toBeVisible();
        }
        const { "@graph": schema } = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "");
        expect(schema).toEqual([
          expect.objectContaining({ "@type": "CollectionPage", url, mainEntity: { "@id": url + "#models" } }),
          expect.objectContaining({
            "@type": "ItemList",
            "@id": url + "#models",
            numberOfItems: count,
            itemListElement: models.map((model, index) => ({
              "@type": "ListItem", position: index + 1, name: model.name,
              url: `${origin}/${language}/lock/${model.id}/`,
            })),
          }),
          expect.objectContaining({ "@type": "BreadcrumbList", itemListElement: expect.any(Array) }),
          expect.objectContaining({ "@type": "FAQPage", mainEntity: expect.any(Array) }),
        ]);
        expect(schema[3].mainEntity).toHaveLength(3);
        await assertHeaderFits(page);
      }
    });
  }
});

test("retains the interactive home filters alongside ordinary category links", async ({ page }, testInfo) => {
  for (const language of languages) {
    expect((await page.goto(`${origin}/${language}/`))?.status()).toBe(200);
    const navigation = page.locator("nav[data-lock-category-links]");
    await expect(navigation.locator("a")).toHaveCount(4);
    await expect(navigation.locator('a[href="#model-details"]')).toBeVisible();
    for (const { slug } of categories.slice(0, 3)) {
      await expect(navigation.locator(`a[href="/${language}/lock/${slug}/"]`)).toBeVisible();
    }
    const allFilter = page.locator('button[data-dir-filter="all"]');
    await allFilter.click();
    await expect(allFilter).toHaveAttribute("aria-pressed", "true");
    const slimFilter = page.locator('button[data-dir-filter="slim"]');
    await slimFilter.click();
    await expect(slimFilter).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#directory .dir-index-list [data-dir-model]")).toHaveCount(1);
    const aluminiumLink = navigation.locator(`a[href="/${language}/lock/type/aluminium-door/"]`);
    await expect(aluminiumLink).toBeVisible();
    await aluminiumLink.click();
    await expect(page).toHaveURL(`${origin}/${language}/lock/type/aluminium-door/`);
    await expect(page.locator('[data-category-model="d10b"]')).toContainText("RM1,220");
    if (language === "zh") await page.screenshot({ path: testInfo.outputPath("category-desktop.png") });
  }
});

test("canonicalizes only valid category paths and keeps Malay categories out of the sitemap", async ({ page }) => {
  const path = "/zh/lock/type/entrance-door";
  for (const [suffix, target] of [["", "/"], ["/index.html?from=test", "/?from=test"]]) {
    const response = await serveAnzheShowroom(new Request(origin + path + suffix, { method: "HEAD" }), undefined, "zh", "playwright");
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(origin + path + target);
  }
  for (const invalid of [
    "/zh/lock/type/wooden-door/", "/zh/lock/type/palm-vein/", "/en/lock/feature/entrance-door/",
    "/ms/lock/feature/g13/", "/fr/lock/type/entrance-door/",
  ]) {
    expect((await page.goto(origin + invalid))?.status()).toBe(404);
  }
  const sitemap = await page.goto(origin + "/sitemap.xml");
  expect(sitemap?.status()).toBe(200);
  const xml = await sitemap!.text();
  expect(xml.match(/<loc>/g)).toHaveLength(66);
  for (const { slug } of categories) {
    for (const lang of ["zh", "en"]) expect(xml).toContain(`<loc>${origin}/${lang}/lock/${slug}/</loc>`);
    expect(xml).not.toContain(`${origin}/ms/lock/${slug}/`);
  }
});
