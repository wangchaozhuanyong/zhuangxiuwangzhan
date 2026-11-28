import { expect, test, type Locator, type Page } from "@playwright/test";

const widths = [360, 390, 768, 1024, 1440, 1920];

async function checkRows(list: Locator, columns: number) {
  const result = await list.evaluate(element => {
    const frame = element.getBoundingClientRect();
    const rows: { top: number; left: number; right: number; count: number }[] = [];
    for (const child of element.children) {
      const box = child.getBoundingClientRect();
      const row = rows.at(-1);
      if (row && Math.abs(row.top - box.top) < 1) {
        row.right = box.right;
        row.count++;
      } else {
        rows.push({ top: box.top, left: box.left, right: box.right, count: 1 });
      }
    }
    return {
      first: rows[0]?.count,
      total: element.children.length,
      offCentre: rows.filter(row => Math.abs((row.left - frame.left) - (frame.right - row.right)) > 1),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(result.first).toBe(Math.min(result.total, columns));
  expect(result.offCentre).toEqual([]);
  expect(result.overflow).toBe(false);
}

// Use the same first-document seed as Pages. Empty managed overrides preserve the bundled catalogue.
async function previewFurniture(page: Page) {
  await page.route(url => /^\/(?:en|zh|ms)\/furniture(?:\/|$)/.test(url.pathname), async route => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const url = new URL(route.request().url());
    const detailSlug = url.pathname.split("/product/")[1];
    const seed = JSON.stringify({ furnitureCatalog: { materials: [], setting: null, detailSlug } });
    const response = await route.fetch();
    const html = (await response.text()).replace(/<script\b[^>]*\bid="flashcast-public-data"[^>]*>[\s\S]*?<\/script>/i, "");
    await route.fulfill({ response, body: html.replace("</head>", () => `<script type="application/json" id="flashcast-public-data">${seed}</script></head>`) });
  });
}

for (const path of ["dining/sideboard", "bedroom/chest-drawer", "study/bookcase", "bedroom/standing-mirror"]) {
  test(`furniture cards balance real category rows on every screen for ${path}`, async ({ page }) => {
    await previewFurniture(page);
    await page.goto(`/zh/furniture/${path}?fc_test=1`, { waitUntil: "domcontentloaded" });
    const list = page.locator(".fc-furniture-grid");
    await expect(list.locator("article").first()).toBeVisible({ timeout: 30_000 });
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await checkRows(page.locator(".fc-furniture-primary"), width <= 900 ? 3 : 6);
      await checkRows(list, width <= 540 ? 1 : width <= 760 ? 2 : width <= 1050 ? 3 : 4);
      if (path === "dining/sideboard") {
        await expect(list.locator("article")).toHaveCount(1);
        const image = await list.locator(".fc-furniture-card__image").boundingBox();
        const description = await list.locator(".fc-furniture-card__body").boundingBox();
        expect(description!.x).toBeGreaterThanOrEqual(image!.x + image!.width - 1);
      }
    }
  });
}

test("product description uses both sides of the desktop section and stacks on mobile", async ({ page }) => {
  await previewFurniture(page);
  await page.goto("/en/furniture/product/ws-2102-wooden-bunk-bed-white?fc_test=1", { waitUntil: "domcontentloaded" });
  const section = page.locator(".fc-furniture-description");
  await expect(section.locator("h2")).toBeVisible({ timeout: 30_000 });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const heading = await section.locator("h2").boundingBox();
    const text = await section.locator(".fc-furniture-description__copy").boundingBox();
    if (width > 760) {
      expect(text!.x).toBeGreaterThan(heading!.x + heading!.width);
      const frame = await section.boundingBox();
      expect(Math.abs(text!.x + text!.width - frame!.x - frame!.width)).toBeLessThan(2);
    } else {
      expect(text!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
    }
  }
});

test("cabinet filters, partial rows and saved designs stay aligned", async ({ page }) => {
  await page.goto("/ms/custom-cabinets?limit=13&fc_test=1");
  const gallery = page.locator(".studio-gallery");
  await expect(gallery.locator("article")).toHaveCount(13, { timeout: 30_000 });
  const labels = page.locator(".studio-filter label");
  await expect(labels).toHaveCount(2);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await checkRows(gallery, width <= 600 ? 1 : width < 1180 ? 2 : 3);
    for (const label of await labels.all()) {
      const select = await label.getByRole("combobox").boundingBox();
      const caption = await label.locator("span").boundingBox();
      expect(caption!.x).toBeGreaterThan(select!.x + select!.width);
      expect(Math.abs((caption!.y + caption!.height / 2) - (select!.y + select!.height / 2))).toBeLessThan(1);
    }
  }
  const filters = page.locator(".studio-filter select");
  await filters.first().selectOption("living");
  await filters.last().selectOption("cream");
  await expect(gallery.locator("article")).toHaveCount(2);
  await checkRows(gallery, 3);
  const favourite = gallery.locator("button[aria-pressed]").first();
  await favourite.click();
  await expect(favourite).toHaveAttribute("aria-pressed", "true");
  await page.locator(".studio-collection-entry").click();
  await expect(page.getByRole("dialog").locator("[data-saved-id]")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await favourite.click();
  await expect(favourite).toHaveAttribute("aria-pressed", "false");
  await page.locator(".studio-results button").click();
  await expect(filters.last()).toHaveValue("");
});
