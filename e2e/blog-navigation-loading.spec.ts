import { expect, test, type Page } from "@playwright/test";

const slug = "blog-transition-regression";
const post = {
  id: "blog-transition-regression",
  slug,
  title_zh: "文章加载回归检查",
  title_en: "Article loading regression check",
  excerpt_zh: "仅供本地浏览器回归测试的文章摘要。",
  excerpt_en: "A local browser regression fixture.",
  content_zh: "<h2>正文加载完成</h2><p>用于确认正文替换占位区域。</p>",
  content_en: "<h2>Article ready</h2><p>The article replaces its placeholder.</p>",
  cover_image_url: "/images/services/kitchen-renovation.webp",
  category: "kitchen-cabinetry",
  published_at: "2026-09-30T00:00:00Z",
  status: "published",
  tags: [],
};

const preloadListing = async (page: Page, fullContent: boolean) => {
  const listingPost = fullContent ? post : { ...post, content_zh: "", content_en: "" };
  await page.route("**/zh/blog", async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const preload = `<script id="flashcast-public-data" type="application/json">${JSON.stringify({ blogPosts: [listingPost] })}</script>`;
    await route.fulfill({ response, body: html.replace("</head>", `${preload}</head>`) });
  });
};

test("opens immediately from a complete listing even while detail requests are pending", async ({ page }) => {
  await preloadListing(page, true);
  let releaseBody!: () => void;
  const bodyAvailable = new Promise<void>((resolve) => { releaseBody = resolve; });
  await page.route("**/rest/v1/blog_posts*", async (route) => {
    if (new URL(route.request().url()).searchParams.has("slug")) await bodyAvailable;
    await route.fulfill({ json: post });
  });
  try {
    await page.goto("/zh/blog");
    await expect(page.locator(".scheme-a-page-loader--overlay")).toBeHidden();
    await page.locator(`.fc-blog-articles a[href='/zh/blog/${slug}']`).click();
    // Another-language prefetch may still request details. The current article
    // must render from its own complete cache before any such request resolves.
    await expect(page.locator(".blog-editorial-article")).toContainText("正文加载完成");
    await expect(page.locator(".forest-state-page, .blog-content-loading")).toHaveCount(0);
    await expect(page.locator(".scheme-a-page-loader--overlay")).toHaveCount(0);
  } finally {
    releaseBody();
  }
});

for (const width of [390, 1440]) {
  test(`keeps the selected article shell while its body is delayed at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await preloadListing(page, false);
    let releaseBody!: () => void;
    const bodyAvailable = new Promise<void>((resolve) => { releaseBody = resolve; });
    await page.route("**/rest/v1/blog_posts*", async (route) => {
      if (new URL(route.request().url()).searchParams.has("slug")) {
        await bodyAvailable;
        await route.fulfill({ json: post });
      } else {
        await route.fulfill({ json: [{ ...post, content_zh: "", content_en: "" }] });
      }
    });
    try {
      await page.goto("/zh/blog");
      await expect(page.locator(".scheme-a-page-loader--overlay")).toBeHidden();
      await page.locator(`.fc-blog-articles a[href='/zh/blog/${slug}']`).click();
      await expect(page.locator("main h1")).toHaveText(post.title_zh);
      await expect(page.locator(".blog-content-loading")).toBeVisible();
      await expect(page.locator(".blog-editorial-article")).toHaveAttribute("aria-busy", "true");
      await expect(page.locator(".forest-state-page")).toHaveCount(0);
      await expect(page.locator(".scheme-a-page-loader--overlay")).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`article-pending-${width}.png`), fullPage: true });
      releaseBody();
      await expect(page.locator(".blog-editorial-article")).toContainText("正文加载完成");
      await expect(page.locator(".blog-content-loading")).toHaveCount(0);
      await expect(page.locator("main h1")).toHaveText(post.title_zh);
      await expect(page.locator(".blog-editorial-article")).toHaveAttribute("aria-busy", "false");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    } finally {
      releaseBody();
    }
  });
}

test("uses the article skeleton while the first article code download is pending", async ({ page }, testInfo) => {
  await preloadListing(page, true);
  let releaseModule!: () => void;
  const moduleAvailable = new Promise<void>((resolve) => { releaseModule = resolve; });
  await page.route(/\/(?:src\/pages\/BlogDetail\.tsx|assets\/BlogDetail-[^/]+\.js)(?:\?.*)?$/, async (route) => {
    await moduleAvailable;
    await route.continue();
  });
  try {
    await page.goto("/zh/blog");
    await expect(page.locator(".scheme-a-page-loader--overlay")).toBeHidden();
    await page.locator(`.fc-blog-articles a[href='/zh/blog/${slug}']`).click();
    await expect(page.locator(".blog-loading-page")).toBeVisible();
    await expect(page.locator(".blog-loading-page")).toHaveAttribute("data-route-pending", "true");
    await expect(page.locator(".forest-state-page")).toHaveCount(0);
    await expect(page.locator("main h1, main h2")).toHaveCount(0);
    await expect(page.locator(".scheme-a-page-loader--overlay")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("article-code-pending.png"), fullPage: true });
    releaseModule();
    await expect(page.locator(".blog-editorial-article")).toContainText("正文加载完成");
    await expect(page.locator(".blog-loading-page")).toHaveCount(0);
  } finally {
    releaseModule();
  }
});
