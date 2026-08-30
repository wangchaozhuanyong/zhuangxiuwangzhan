import { expect, test, type Page } from "@playwright/test";

type PublicStyleSignature = {
  bodyBackground: string;
  bodyFont: string;
  headerFont: string;
  headerHeight: number;
  heroSpanWhiteSpace: string | null;
  heroFirstSpanHeight: number | null;
  horizontalOverflow: number;
};

const readPublicStyleSignature = (page: Page) => page.evaluate<PublicStyleSignature>(() => {
  const bodyStyle = getComputedStyle(document.body);
  const header = document.querySelector<HTMLElement>(".scheme-a-chrome");
  const headerLink = document.querySelector<HTMLElement>(".scheme-a-chrome__primary a");
  const heroSpan = document.querySelector<HTMLElement>(".scheme-a-hero h1 span");

  if (!header || !headerLink) throw new Error("Missing canonical public chrome");

  return {
    bodyBackground: bodyStyle.backgroundColor,
    bodyFont: bodyStyle.fontFamily,
    headerFont: getComputedStyle(headerLink).fontFamily,
    headerHeight: Math.round(header.getBoundingClientRect().height),
    heroSpanWhiteSpace: heroSpan ? getComputedStyle(heroSpan).whiteSpace : null,
    heroFirstSpanHeight: heroSpan ? Math.round(heroSpan.getBoundingClientRect().height * 100) / 100 : null,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});

const expectStableSignature = (
  before: PublicStyleSignature,
  after: PublicStyleSignature,
) => {
  expect(after.bodyBackground).toBe(before.bodyBackground);
  expect(after.bodyFont).toBe(before.bodyFont);
  expect(after.headerFont).toBe(before.headerFont);
  expect(after.headerHeight).toBe(before.headerHeight);
  expect(after.heroSpanWhiteSpace).toBe(before.heroSpanWhiteSpace);
  expect(after.horizontalOverflow).toBeLessThanOrEqual(1);

  if (before.heroFirstSpanHeight !== null && after.heroFirstSpanHeight !== null) {
    expect(Math.abs(after.heroFirstSpanHeight - before.heroFirstSpanHeight)).toBeLessThanOrEqual(1);
  }
};

test.describe("public route style isolation", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`home keeps the same design after a quote round trip at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/zh", { waitUntil: "networkidle" });
      await expect(page.locator(".scheme-a-hero h1")).toBeVisible();

      const before = await readPublicStyleSignature(page);
      expect(before.bodyFont).toContain("Inter");
      expect(before.headerFont).toMatch(/PingFang SC|Noto Sans SC|Microsoft YaHei UI/);
      if (viewport.width < 768) expect(before.heroSpanWhiteSpace).toBe("normal");

      await page.locator('.scheme-a-hero a[href="/zh/quote#quote-form"]').first().click();
      await expect(page).toHaveURL(/\/zh\/quote#quote-form$/);
      await expect(page.locator(".fc-route-form-page")).toBeVisible();

      await page.locator('.scheme-a-chrome__brand[href="/zh"]').click();
      await expect(page).toHaveURL(/\/zh$/);
      await expect(page.locator(".scheme-a-hero h1")).toBeVisible();

      expectStableSignature(before, await readPublicStyleSignature(page));
    });
  }

  test("standard routes keep the same global chrome after visiting contact", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/zh/services", { waitUntil: "networkidle" });
    await expect(page.locator(".fc-route-hero h1")).toBeVisible();
    const before = await readPublicStyleSignature(page);

    await page.locator('a[href="/zh/contact"]:visible').first().click();
    await expect(page).toHaveURL(/\/zh\/contact$/);
    await expect(page.locator(".fc-route-form-page")).toBeVisible();

    await page.locator('a[href="/zh/services"]:visible').first().click();
    await expect(page).toHaveURL(/\/zh\/services$/);
    await expect(page.locator(".fc-route-hero h1")).toBeVisible();

    expectStableSignature(before, await readPublicStyleSignature(page));
  });
});
