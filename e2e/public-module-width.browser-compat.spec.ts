import { expect, test, type Locator } from "@playwright/test";

async function checkRows(list: Locator, expectedCounts?: number[]) {
  const rows = await list.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const measured: { top: number; left: number; right: number; count: number }[] = [];
    for (const child of element.children) {
      const box = child.getBoundingClientRect();
      const row = measured.at(-1);
      if (row && Math.abs(box.top - row.top) <= 1) {
        row.count++;
        row.right = box.right;
      } else {
        measured.push({ top: box.top, left: box.left, right: box.right, count: 1 });
      }
    }
    return measured.map(row => ({
      count: row.count,
      gap: Math.max(Math.abs(row.left - bounds.left), Math.abs(row.right - bounds.right)),
    }));
  });
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every(row => row.gap <= 1)).toBe(true);
  if (expectedCounts) expect(rows.map(row => row.count)).toEqual(expectedCounts);
}

for (const language of ["zh", "en", "ms"]) {
  test(`process steps fill their rows and retain sequential detail in ${language}`, async ({ page }) => {
    await page.goto(`/${language}/process`, { waitUntil: "domcontentloaded" });
    const list = page.locator(".fc-route-number-list");
    const steps = list.locator(":scope > li");
    await expect(steps).toHaveCount(6);
    await expect(steps.locator(":scope > b")).toHaveText(["01", "02", "03", "04", "05", "06"]);
    await expect(steps.locator("ul")).toHaveCount(6);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await checkRows(list, width >= 1200 ? [3, 3] : width >= 768 ? [2, 2, 2] : [1, 1, 1, 1, 1, 1]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}

test("material recommendations use both sides even with a short final row", async ({ page }) => {
  for (const path of ["/zh/materials", "/zh/materials/acrylic-cabinet-gloss-white"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const grid = page.locator(".fc-route-grid").first();
    await expect(grid.locator(":scope > a").first()).toBeVisible();
    for (const width of [390, 900, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await checkRows(grid);
    }
  }
});

test("comparison copy and slider share the section width on desktop and stack on mobile", async ({ page }) => {
  await page.goto("/zh/services/old-house", { waitUntil: "domcontentloaded" });
  const article = page.locator(".scheme-a-transformation").first();
  const slider = article.getByRole("slider");
  await expect(slider).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const copy = await article.locator("header").boundingBox();
    const media = await article.locator(".scheme-a-transformation__compare").boundingBox();
    if (!copy || !media) throw new Error("Missing comparison copy or media");
    if (width < 1024) {
      expect(media.y).toBeGreaterThanOrEqual(copy.y + copy.height - 1);
    } else {
      expect(media.x).toBeGreaterThan(copy.x + copy.width);
      expect(media.width).toBeGreaterThan(copy.width);
    }
  }
  const initial = Number(await slider.inputValue());
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue(String(initial + 1));
});
