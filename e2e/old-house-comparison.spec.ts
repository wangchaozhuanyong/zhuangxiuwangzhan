import { expect, test } from "@playwright/test";

test("old-house service page provides three usable terrace renovation comparisons", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/zh/services/old-house", { waitUntil: "domcontentloaded" });

  const comparisons = page.locator(".scheme-a-transformation__compare");
  await expect(comparisons).toHaveCount(3);
  await expect(page.getByText("现状示意", { exact: true })).toHaveCount(3);
  await expect(page.getByText("方案示意", { exact: true })).toHaveCount(3);
  await expect(page.getByText("概念改造示意，非客户完工实景证据", { exact: false })).toBeVisible();

  for (let index = 0; index < 3; index += 1) {
    const comparison = comparisons.nth(index);
    await comparison.scrollIntoViewIfNeeded();
    const images = comparison.locator("img");
    await expect(images).toHaveCount(2);
    await expect(comparison.locator('input[type="range"]')).toHaveAttribute("aria-label", /现状示意与拟议方案概念图/);
    await expect.poll(
      () => images.evaluateAll((nodes) => nodes.every((node) => node.complete && node.naturalWidth > 0 && node.currentSrc.includes("old-terrace-concept-v2"))),
      { message: `comparison ${index + 1} should load the versioned concept images` },
    ).toBe(true);
  }

  const firstComparison = comparisons.first();
  const slider = firstComparison.locator('input[type="range"]');
  await slider.focus();
  const initialValue = Number(await slider.inputValue());
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue(String(initialValue + 1));

  const bounds = await firstComparison.boundingBox();
  if (!bounds) throw new Error("Old-house comparison is not visible");
  await page.mouse.move(bounds.x + bounds.width * 0.35, bounds.y + bounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await expect(slider).toHaveValue(/^(7[4-6])$/);
});

test("English and mobile old-house comparisons disclose concepts in every image group", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/services/old-house", { waitUntil: "domcontentloaded" });

  const comparisons = page.locator(".scheme-a-transformation__compare");
  await expect(comparisons).toHaveCount(3);
  await expect(page.getByText("Existing concept", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Proposed concept", { exact: true })).toHaveCount(3);
  await expect(page.getByText("Concept renovation illustration, not evidence of a completed client project", { exact: false })).toBeVisible();
  for (const comparison of await comparisons.all()) {
    await comparison.scrollIntoViewIfNeeded();
    await expect(comparison.locator('input[type="range"]')).toHaveAttribute("aria-label", /illustrative existing and proposed concepts/);
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
