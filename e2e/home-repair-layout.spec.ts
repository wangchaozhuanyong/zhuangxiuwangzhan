import { expect, test } from "@playwright/test";

test("sparse homepage content uses the available space and only advertises scrolling when needed", async ({ page }) => {
  const image = "/images/services/design/material-board-v2-1200.webp";
  const product = { slug: "preview-chair", name: "预览座椅", image, categoryKey: "living" };
  const payload = {
    homeFurniture: { zh: [product] },
    homeJournalPosts: [{ slug: "preview-article", title_zh: "预览文章", cover_image_url: image }],
    homeServiceAreas: Array.from({ length: 5 }, (_, i) => ({ slug: `area-${i}`, title_zh: `地区 ${i}` })),
    homeContentBundle: { projects: [
      { slug: "project-one", title_zh: "案例一", image_url: image },
      { slug: "project-two", title_zh: "案例二", image_url: "/images/services/renovation-works.webp" },
    ] },
  };
  await page.route("**/zh", async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(/<script[^>]*id="flashcast-public-data"[^>]*>[\s\S]*?<\/script>/, "");
    await route.fulfill({ response, body: html.replace("</head>", `<script id="flashcast-public-data" type="application/json">${JSON.stringify(payload)}</script></head>`) });
  });
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await page.locator(".home-furniture__layout").waitFor({ state: "attached" });
  await expect(page.locator(".home-furniture__product-copy")).toContainText("预览座椅");
  await expect(page.locator(".home-journal__copy")).toContainText("预览文章");
  await expect(page.locator(".home-areas__links > li")).toHaveCount(5);
  await expect(page.locator(".scheme-a-project__collection-item")).toHaveCount(1);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const selector of [".home-journal__grid", ".home-furniture__products", ".scheme-a-project__collection", ".home-areas__links"]) {
      const gap = await page.locator(selector).evaluate((grid) => {
        const contentEdge = grid.getBoundingClientRect().right - parseFloat(getComputedStyle(grid).paddingRight);
        return Math.abs(grid.lastElementChild!.getBoundingClientRect().right - contentEdge);
      });
      expect(gap, `${selector} at ${width}px`).toBeLessThan(2);
    }
    if (width === 1440) {
      const regions = await page.locator(".home-areas__links > li").evaluateAll((items) => items.map(item => item.getBoundingClientRect().top));
      expect(regions.filter(top => Math.abs(top - regions[0]) < 1)).toHaveLength(3);
      expect(regions.filter(top => Math.abs(top - regions[4]) < 1)).toHaveLength(2);
    }
    await expect(page.locator(".scheme-a-project__collection-hint,.home-furniture__swipe-hint")).toHaveCount(0);
    if (width >= 768) {
      const link = page.locator(".home-journal__link");
      const media = await link.locator(".home-journal__image").boundingBox();
      const copy = await link.locator(".home-journal__copy").boundingBox();
      expect(copy!.x).toBeGreaterThan(media!.x + media!.width);
    }
  }
});

test("repair form is open on arrival and generates a local enquiry at phone and desktop sizes", async ({ page }) => {
  await page.goto("/zh/services/surface-repair", { waitUntil: "domcontentloaded" });
  await page.locator(".consult-layout").waitFor({ state: "attached" });
  await expect(page.locator("#repair-category")).toBeVisible();
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const images = await page.locator(".photo-list").boundingBox();
    const panel = await page.locator(".consult-panel").boundingBox();
    if (width === 360) expect(panel!.y).toBeGreaterThan(images!.y + images!.height);
    else {
      expect(panel!.x).toBeGreaterThan(images!.x + images!.width);
      expect(Math.abs(panel!.y - images!.y)).toBeLessThan(2);
      const first = await page.locator(".repair-faq-list .faq").nth(0).boundingBox();
      const second = await page.locator(".repair-faq-list .faq").nth(1).boundingBox();
      expect(second!.x).toBeGreaterThan(first!.x + first!.width);
      expect(Math.abs(second!.y - first!.y)).toBeLessThan(2);
    }
    const region = width === 360 ? "Cheras" : "Kuala Lumpur";
    await page.locator("#repair-region").fill("");
    await page.locator(".generate").click();
    await expect(page.locator("#repair-region")).toBeFocused();
    await page.locator("#repair-region").fill(region);
    await page.locator("#repair-description").fill("柜门有两个缺口");
    await page.locator(".generate").click();
    await expect(page.locator("#repair-message")).toHaveValue(new RegExp(region));
    await expect(page.locator("#repair-message")).toHaveValue(/柜门有两个缺口/);
  }
  await page.locator(".assessment-detail summary").first().click();
  await expect(page.locator(".assessment-detail[open] > p")).toBeVisible();
});

test("consultation actions stay with their introduction on directories and detail pages", async ({ page }) => {
  for (const path of ["services", "services/renovation", "locations/kuala-lumpur", "projects/modern-condo-mont-kiara"]) {
    await page.goto(`/zh/${path}`, { waitUntil: "domcontentloaded" });
    const banner = page.locator(".scheme-a-page-cta");
    await expect(banner, path).toBeAttached({ timeout: 30_000 });
    const quote = banner.locator(".scheme-a-page-cta__button--primary");
    const whatsapp = banner.locator(".scheme-a-page-cta__button--secondary");
    await expect(quote).toHaveAttribute("href", /\/zh\/quote(?:[?#]|$)/);
    await expect(whatsapp).toHaveAttribute("href", /^https:\/\//);
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const intro = await banner.locator(".scheme-a-page-cta__copy").boundingBox();
      const actions = await banner.locator(".scheme-a-page-cta__actions").boundingBox();
      if (!intro || !actions) throw new Error(`Missing consultation controls on ${path}`);
      expect(Math.abs(intro.x + intro.width / 2 - actions.x - actions.width / 2)).toBeLessThan(2);
      expect(actions.y - intro.y - intro.height).toBeGreaterThanOrEqual(0);
      expect(actions.y - intro.y - intro.height).toBeLessThanOrEqual(32);
      for (const link of [quote, whatsapp]) {
        const box = await link.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
});
