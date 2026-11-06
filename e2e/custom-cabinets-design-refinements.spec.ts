import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import p from '../src/i18n/cabinetPaletteText.json' with { type: 'json' };
import t from '../src/i18n/cabinetStudioText.json' with { type: 'json' };
import l from '../src/i18n/cabinetStudioCatalog.json' with { type: 'json' };

const evidence = resolve(process.env.CABINET_EVIDENCE_DIR || 'reports/custom-cabinets-20261024/design-fixes-20261028/browser');
mkdirSync(evidence, { recursive: true });
type Language = 'zh' | 'en' | 'ms';
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const read = request.method() === 'POST' && url.pathname === '/rest/v1/rpc/get_public_home_bundle';
    return (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !read)
      || /google-analytics|googletagmanager|cloudflareinsights|doubleclick/.test(url.hostname)
      || /submit-lead|notify-lead/.test(url.pathname) || url.pathname === '/__visit'
      ? route.abort() : route.continue();
  });
});
const ready = (page: Page) => expect(page.locator('.studio-product [data-room-render-state]')).toHaveAttribute('data-room-render-state', 'ready');
async function open(page: Page, lang: Language) {
  await page.goto(`/${lang}/custom-cabinets?fc_test=1&view=inspire`);
  const card = page.locator('[data-scheme="natural-1"]');
  const quote = card.locator('[data-price-state="quote"]');
  if (await quote.count()) {
    expect(await quote.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(30);
    const gap = await card.evaluate(element => element.querySelector('.studio-card__actions button')!.getBoundingClientRect().top - element.querySelector('.studio-price > span')!.getBoundingClientRect().bottom);
    expect(gap).toBeLessThanOrEqual(32);
  }
  await card.locator('.studio-card__actions button').click();
  await ready(page);
  await expect.poll(() => page.getByRole('dialog').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
}
const order = (page: Page) => page.locator('[data-finish]').evaluateAll(elements => elements.map(element => element.getAttribute('data-finish')));

for (const [lang, width, height] of [
  ['zh',360,740], ['zh',390,844], ['zh',768,1024], ['zh',1024,768], ['zh',1440,900],
  ['en',360,740], ['en',1440,900], ['ms',360,740], ['ms',1440,900],
] as const) test(`palette layout and state preservation ${lang} ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height });
  await open(page, lang);
  await page.screenshot({ path: resolve(evidence, `details-${lang}-${width}.png`) });
  await page.getByRole('button', { name: p[lang].customize, exact: true }).click();
  await expect(page.locator('.studio-product')).toHaveAttribute('data-mode', 'colours');
  await ready(page);
  await expect(page.locator('[data-finish]')).toHaveCount(6);
  const originalOrder = await order(page);
  await page.locator('[data-finish="cream"]').click();
  await ready(page);
  await expect(page.locator('[data-finish="cream"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await order(page)).toEqual(originalOrder);
  await expect(page.locator('.studio-product__footer [data-price-state]')).toHaveAttribute('data-price-state', 'adjusted');
  const design = new URL(page.url()).searchParams.get('d');
  await page.getByRole('button', { name: p[lang].original, exact: true }).click();
  await expect(page.locator('.studio-product')).toHaveAttribute('data-mode', 'details');
  await expect(page.locator('.studio-product__included')).toContainText(l[lang].kinds.tv);
  expect(new URL(page.url()).searchParams.get('d')).toBe(design);
  await page.getByRole('button', { name: p[lang].customize, exact: true }).click();
  await ready(page);
  await expect(page.locator('[data-finish="cream"]')).toHaveAttribute('aria-pressed', 'true');
  expect(new URL(page.url()).searchParams.get('d')).toBe(design);
  await page.screenshot({ path: resolve(evidence, `colours-${lang}-${width}.png`) });
  expect(await page.getByRole('dialog').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const ratio = await page.locator('.studio-product .studio-room-preview__frame').evaluate(element => {
    const rect = element.getBoundingClientRect(); return rect.width / rect.height;
  });
  expect(ratio).toBeCloseTo(1.5, 2);
  if (width <= 600) {
    const layout = await page.locator('.studio-product__layout').evaluate(element => {
      const visual = element.querySelector('.studio-product__visual')!;
      const frame = visual.querySelector('.studio-room-preview__frame')!;
      return { width: frame.getBoundingClientRect().width, visualWidth: visual.getBoundingClientRect().width,
        position: getComputedStyle(visual).position, scrollbar: getComputedStyle(element).scrollbarWidth,
        webkitScrollbar: getComputedStyle(element, '::-webkit-scrollbar').display };
    });
    expect(layout.width).toBeGreaterThanOrEqual(layout.visualWidth - 1);
    expect(layout.position).toBe('static');
    expect(layout.scrollbar).toBe('none');
    expect(layout.webkitScrollbar).toBe('none');
    expect(await page.getByRole('dialog').evaluate(element => getComputedStyle(element).overflowY)).toBe('hidden');
    const footer = await page.locator('.studio-product__footer').boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(height);
    // Only the content region scrolls, and the image can return fully into view.
    await page.locator('.studio-product__layout').evaluate(element => { element.scrollTop = 0; });
    await expect(page.locator('.studio-product .studio-room-preview__frame')).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: resolve(evidence, `full-preview-${lang}-${width}.png`) });
  }
  await page.getByRole('button', { name: t[lang].share, exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: t[lang].share, exact: true })).toBeInViewport();
  if (width <= 600) expect(await page.locator('.studio-product__layout').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  const tools = await page.locator('.studio-product__tools button').evaluateAll(elements => elements.map(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    const textRects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    return { height: element.getBoundingClientRect().height, width: element.getBoundingClientRect().width, textHeight: Math.max(...textRects.map(rect => rect.height)) };
  }));
  expect(tools).toHaveLength(2);
  expect(Math.abs(tools[0].height - tools[1].height)).toBeLessThan(1);
  for (const tool of tools) { expect(tool.height).toBeGreaterThanOrEqual(44); expect(tool.textHeight).toBeLessThan(30); }
  await page.getByRole('button', { name: p[lang].original, exact: true }).click();
  await expect(page.locator('.studio-product')).toHaveAttribute('data-mode', 'details');
  await page.getByRole('button', { name: p[lang].customize, exact: true }).click();
  await ready(page);
  await page.getByRole('button', { name: l[lang].scenes.living, exact: true }).click();
  await ready(page);
  const roomDesign = new URL(page.url()).searchParams.get('d');
  await page.getByRole('button', { name: p[lang].original, exact: true }).click();
  await page.getByRole('button', { name: p[lang].customize, exact: true }).click();
  await ready(page);
  expect(new URL(page.url()).searchParams.get('d')).toBe(roomDesign);
  await expect(page.getByRole('button', { name: l[lang].scenes.living, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: t[lang].zoom, exact: true }).click();
  await expect(page.locator('.studio-product')).toHaveClass(/is-zoomed/);
  await expect(page.getByRole('button', { name: p[lang].closeZoom, exact: true })).toBeVisible();
  await page.getByRole('button', { name: p[lang].closeZoom, exact: true }).click();
  await expect(page.locator('.studio-product')).not.toHaveClass(/is-zoomed/);
  await page.reload(); await ready(page);
  expect(new URL(page.url()).searchParams.get('d')).toBe(roomDesign);
  await expect.poll(() => page.getByRole('dialog').evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-scheme]')).toHaveCount(12);
});

test('expanded finish order and keyboard choice remain stable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'zh');
  await page.getByRole('button', { name: p.zh.customize, exact: true }).click();
  await page.getByRole('button', { name: p.zh.more, exact: true }).click();
  const all = await order(page);
  await page.locator('[data-finish="dark-walnut"]').press('Enter');
  await ready(page);
  expect(await order(page)).toEqual(all);
  await expect(page.locator('[data-finish="dark-walnut"]')).toBeFocused();
  await page.getByRole('button', { name: p.zh.original, exact: true }).click();
  await page.getByRole('button', { name: p.zh.customize, exact: true }).click();
  await expect(page.locator('[data-finish="dark-walnut"]')).toHaveAttribute('aria-pressed', 'true');
});
