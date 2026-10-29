import { test, expect } from '@playwright/test';
import p from '../src/i18n/cabinetPaletteText.json' with { type: 'json' };
import t from '../src/i18n/cabinetStudioText.json' with { type: 'json' };

test('service and material entry links open the cabinet catalogue in all locales', async ({ page }) => {
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    const read = request.method() === 'POST' && url.pathname === '/rest/v1/rpc/get_public_home_bundle';
    return (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !read)
      || /google-analytics|googletagmanager|cloudflareinsights|doubleclick/.test(url.hostname)
      || /submit-lead|notify-lead/.test(url.pathname) || url.pathname === '/__visit'
      ? route.abort() : route.continue();
  });
  for (const lang of ['zh', 'en', 'ms']) for (const path of ['/services/builtin', '/materials/category/whole-house-custom']) {
    await page.goto(`/${lang}${path}?fc_test=1`);
    const link = page.locator(`a[href="/${lang}/custom-cabinets"]`);
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page.locator('[data-scheme]')).toHaveCount(12);
  }
});

for (const lang of ['zh', 'en', 'ms'] as const) for (const width of [360, 1440]) {
  test(`cabinet release flow ${lang} ${width}`, async ({ page }, info) => {
    await page.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      const read = request.method() === 'POST' && url.pathname === '/rest/v1/rpc/get_public_home_bundle';
      return (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !read)
        || /google-analytics|googletagmanager|cloudflareinsights|doubleclick/.test(url.hostname)
        || /submit-lead|notify-lead/.test(url.pathname) || url.pathname === '/__visit'
        ? route.abort() : route.continue();
    });
    await page.setViewportSize({ width, height: width === 360 ? 844 : 1000 });
    await page.goto(`/${lang}?fc_test=1`);
    const entry = page.locator('[data-home-section="custom-cabinets"]');
    await expect(entry).toHaveCount(1);
    expect(await page.locator('[data-home-section="projects"]').evaluate(element => {
      const entry = document.querySelector('[data-home-section="custom-cabinets"]')!;
      return Boolean(entry.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);
    await entry.locator('.home-cabinets__actions a[href*="view=inspire"]').click();
    await expect(page.locator('[data-scheme]')).toHaveCount(12);
    await page.locator('[data-scheme="cream-1"] .studio-card__actions button').click();
    const dialog = page.getByRole('dialog');
    const preview = dialog.locator('[data-room-render-state]');
    await expect(preview).toHaveAttribute('data-room-render-state', 'ready');
    await expect(preview).toHaveAttribute('data-room-image', '/images/custom-cabinets/v2/cream-1-kitchen.webp');
    const publicHost = !['127.0.0.1', 'localhost'].includes(new URL(page.url()).hostname);
    if (publicHost) await expect(dialog.locator('[data-campaign-amount]')).toHaveCount(0);
    await expect(dialog).not.toContainText(/RM\s?120/);
    await dialog.getByRole('button', { name: p[lang].customize, exact: true }).click();
    await dialog.locator('[data-finish="walnut"]').click();
    await expect(preview).toHaveAttribute('data-room-render-state', 'ready');
    await expect(preview).toHaveAttribute('data-room-layer', 'material');
    await dialog.getByRole('button', { name: t[lang].save, exact: true }).click();
    await expect(dialog).toContainText(t[lang].savedOk);
    const encoded = new URL(page.url()).searchParams.get('d');
    await page.reload();
    await expect(dialog.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(preview).toHaveAttribute('data-room-render-state', 'ready');
    expect(new URL(page.url()).searchParams.get('d')).toBe(encoded);
    await page.keyboard.press('Escape');
    await page.locator('.studio-collection-entry').click();
    await expect(page.locator('.studio-collection-list article')).toHaveCount(1);
    await page.locator('.studio-collection-list').getByRole('button', { name: p[lang].customize, exact: true }).click();
    await expect(preview).toHaveAttribute('data-room-render-state', 'ready');
    await expect(dialog.locator('[data-finish="walnut"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath('verified-cabinet.png') });
    const consult = dialog.getByRole('link', { name: p[lang].consult, exact: true });
    const details = new URL((await consult.getAttribute('href'))!, page.url()).searchParams.get('details')!;
    expect(details).toContain('20%'); expect(details).toContain(encoded!);
    expect(details.length).toBeLessThanOrEqual(4000);
    expect(details).not.toMatch(/RM\s?120/);
    expect(details).not.toContain('RM 9,574.80');
    await consult.click();
    await expect(page.locator('#quote-details')).toHaveValue(details);
    await expect(page.locator('#quote-form')).toBeInViewport();
  });
}
