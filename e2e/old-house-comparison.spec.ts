import { expect, test } from "@playwright/test";

test("old-house service page provides three usable terrace renovation comparisons", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/zh/services/old-house", { waitUntil: "domcontentloaded" });

  const comparisons = page.locator(".scheme-a-transformation__compare");
  await expect(comparisons).toHaveCount(3);
  await expect(page.getByText("改造前", { exact: true })).toHaveCount(3);
  await expect(page.getByText("改造后", { exact: true })).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const comparison = comparisons.nth(index);
    await comparison.scrollIntoViewIfNeeded();
    const images = comparison.locator("img");
    await expect(images).toHaveCount(2);
    await expect.poll(
      () => images.evaluateAll((nodes) => nodes.every((node) => node.complete && node.naturalWidth > 0)),
      { message: `comparison ${index + 1} images should load` },
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
