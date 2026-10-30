import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import p from '../src/i18n/cabinetPaletteText.json' with { type: 'json' };
import t from '../src/i18n/cabinetStudioText.json' with { type: 'json' };
import pricing from '../src/i18n/cabinetPricingText.json' with { type: 'json' };

const evidence = resolve('reports/custom-cabinets-20261024/price-layout-20261029/browser');
mkdirSync(evidence, { recursive: true });
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

for (const lang of ['zh', 'en', 'ms'] as const) {
  for (const width of [360, 390, 768, 1024, 1440]) test(`consistent package pricing and enquiry ${lang} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width >= 768 ? 1000 : 844 });
    await page.goto(`/${lang}/custom-cabinets?fc_test=1&view=inspire`);
    const card = page.locator('[data-scheme="cream-1"]');
    await expect(card.locator('[data-campaign-amount]')).toHaveText('RM 9,574.80');
    await expect(card.locator('[data-standard-amount]')).toContainText('RM 11,968.50');
    await expect(card.locator('[data-offer-price]')).toContainText('99.74');
    await expect(card).not.toContainText(/RM\s?120/);
    await card.locator('.studio-card__actions button').click();
    const dialog = page.getByRole('dialog');
    const ready = () => expect(dialog.locator('[data-room-render-state]')).toHaveAttribute('data-room-render-state', 'ready');
    await ready();
    await expect(dialog.locator('[data-campaign-amount]')).toHaveText('RM 9,574.80');
    await expect(dialog.locator('[data-offer-price]')).toContainText('20%');
    await expect(dialog.locator('.cabinet-price-breakdown__saving')).toContainText('RM 2,393.70');
    await expect(dialog).not.toContainText(/RM\s?120/);
    const comparison = await dialog.locator('.cabinet-price-breakdown__comparison > div').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(); return { left: rect.left, top: rect.top, width: rect.width };
    }));
    expect(comparison).toHaveLength(2);
    expect(comparison[1].left).toBeGreaterThan(comparison[0].left + comparison[0].width);
    expect(Math.abs(comparison[0].top - comparison[1].top)).toBeLessThan(1);
    await page.screenshot({ path: resolve(evidence, `details-${lang}-${width}.png`) });
    await dialog.locator('.studio-product__specs summary').click();
    await expect(dialog.locator('.studio-product__specs')).toContainText(pricing[lang].basis);
    await expect(dialog.locator('.studio-product__specs')).toContainText(pricing[lang].scope);
    const specs = await dialog.locator('.studio-product__specs dd').allTextContents();
    expect(specs).toEqual([`10 ${t[lang].ft} × 850 ${t[lang].mm} × 600 ${t[lang].mm}`, `10 ${t[lang].ft} × 750 ${t[lang].mm} × 350 ${t[lang].mm}`, `6 ${t[lang].ft} × 2400 ${t[lang].mm} × 600 ${t[lang].mm}`]);
    await dialog.getByRole('button', { name: p[lang].customize, exact: true }).click();
    await dialog.locator('[data-finish="sage"]').click();
    await ready();
    await expect(dialog.locator('[data-price-state]')).toHaveAttribute('data-price-state', 'adjusted');
    await expect(dialog.locator('[data-campaign-amount]')).toHaveCount(0);
    const consult = dialog.getByRole('link', { name: p[lang].consult, exact: true });
    const modified = new URL((await consult.getAttribute('href'))!, 'http://localhost').searchParams.get('details')!;
    expect(modified).not.toContain('RM 9,574.80');
    await dialog.getByRole('button', { name: p[lang].restore, exact: true }).click();
    await ready();
    await expect(dialog.locator('[data-campaign-amount]')).toHaveText('RM 9,574.80');
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(consult).toBeInViewport();
    expect(await consult.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: resolve(evidence, `colours-${lang}-${width}.png`) });
    const details = new URL((await consult.getAttribute('href'))!, 'http://localhost').searchParams.get('details')!;
    expect(details).toContain('RM 9,574.80');
    expect(details).toContain('RM 11,968.50');
    expect(details).toContain('20%'); expect(details).toContain('99.74');
    expect(details).not.toMatch(/RM\s?120/);
    expect(details.length).toBeLessThanOrEqual(4000);
    await consult.click();
    await expect(page.locator('#quote-details')).toHaveValue(details);
    await expect(page.locator('#quote-form')).toBeInViewport();
  });

  test(`homepage cabinet entry moves to navigation ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${lang}?fc_test=1`);
    await expect(page.locator('[data-home-section="custom-cabinets"]')).toHaveCount(0);
    await expect(page.locator('.home-cabinets__packages')).toHaveCount(0);
    const entry = page.locator('.scheme-a-chrome__primary a[href$="/custom-cabinets"]');
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/custom-cabinets$`));
    await expect(page.locator('.studio-card').first()).toBeVisible();
  });
}
