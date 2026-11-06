import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import copy from '../src/i18n/cabinetPaletteText.json' with { type: 'json' };
import text from '../src/i18n/cabinetStudioText.json' with { type: 'json' };
import labels from '../src/i18n/cabinetStudioCatalog.json' with { type: 'json' };
import { customCabinetsHomeText } from '../src/i18n/customCabinetsHomeText';

// Historical v2 fixture is independent of production serialization and defaults.
const storageKey = 'flashcast.cabinet-studio.v2';
const baseline = [2, 'modern-1', 'modern', 'kitchen', [
  ['base', 'base', 3048, 850, 600], ['wall', 'wall', 3048, 750, 350],
  ['wardrobe', 'wardrobe', 2438, 2400, 600], ['tv', 'tv', 1829, 450, 400],
  ['shoe', 'shoe', 1219, 2100, 350], ['sideboard', 'sideboard', 1800, 900, 400],
  ['bookcase', 'bookcase', 1800, 2200, 350],
].map(c => [...c, 'white', 'smoked-oak', 'smoked-oak', 'warm-stone', 'flat', 'hidden', 'vertical', []])];
const encodeFixture = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const homeSchemes = ['cream-1', 'natural-1', 'modern-2', 'midcentury-1'];
const evidence = resolve('reports/custom-cabinets-20261024/preflight-fixes-20261029/browser');
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
  test(`homepage entry and all package details use the new flow ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: lang === 'zh' ? 390 : 1440, height: 900 });
    await page.goto(`/${lang}?fc_test=1`);
    const entry = page.locator('[data-home-section="custom-cabinets"]');
    const packages = await entry.locator('.home-cabinets__packages a').evaluateAll(elements => elements.map(element => element.getAttribute('href')!));
    expect(packages).toHaveLength(4);
    for (const href of packages) { expect(href).not.toMatch(/cabinet-config|[?&](o|p|s|c)=/); }
    await entry.getByRole('link', { name: customCabinetsHomeText[lang].browse, exact: true }).click();
    await expect(page.locator('[data-scheme]')).toHaveCount(12);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#cabinet-packages')).toBeInViewport();
    for (const [index, href] of packages.entries()) {
      await page.goto(href);
      await expect(page.locator('.studio-product')).toHaveAttribute('data-mode', 'details');
      await expect(page.locator('[data-package-detail]')).toHaveAttribute('data-package-detail', homeSchemes[index]);
      await expect(page.locator('.studio-product__included')).not.toBeEmpty();
      await expect(page.getByRole('button', { name: copy[lang].customize, exact: true })).toBeVisible();
      await expect(page.locator('.studio-product [data-room-render-state]')).toHaveAttribute('data-room-render-state', 'ready');
    }
    await page.screenshot({ path: resolve(evidence, `home-package-${lang}.png`) });
  });

  test(`empty old plans recover to catalogue and saved titles follow locale ${lang}`, async ({ page }) => {
    const design = structuredClone(baseline);
    const stored = [
      { id: 'old-generated', name: `${labels.zh.styles.modern} · 1`, updated: 1, encoded: encodeFixture(design) },
      { id: 'old-custom', name: 'My apartment', updated: 2, encoded: encodeFixture(design) },
    ];
    await page.addInitScript(({ key, value }) => { localStorage.setItem(key, value); }, { key: storageKey, value: JSON.stringify(stored) });
    await page.goto(`/${lang}/custom-cabinets?fc_test=1&p=free#cabinet-config`);
    await expect(page.locator('[data-scheme]')).toHaveCount(12);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText(copy[lang].emptyPlan);
    const empty = encodeFixture([2, 'modern-1', 'modern', 'kitchen', []]);
    await page.goto(`/${lang}/custom-cabinets?view=design&v=2&d=${empty}`);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.locator('.studio-collection-entry').click();
    await expect(page.locator('[data-saved-id="old-generated"] h3')).toHaveText(`${labels[lang].styles.modern} · 1`);
    await expect(page.locator('[data-saved-id="old-custom"] h3')).toHaveText('My apartment');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey)).toEqual(stored);
    await page.screenshot({ path: resolve(evidence, `saved-${lang}.png`) });
  });
}

for (const lang of ['en', 'ms'] as const) test(`long legacy enquiry retains restorable state after backend limit ${lang}`, async ({ page }) => {
  const design = structuredClone(baseline);
  const cabinets = design[4] as unknown[][];
  while (cabinets.length < 12) cabinets.push([`base-extra-${cabinets.length}`, ...cabinets[0].slice(1)]);
  const encoded = encodeFixture(design);
  await page.goto(`/${lang}/custom-cabinets?fc_test=1&view=design&v=2&d=${encoded}`);
  const consult = page.getByRole('link', { name: copy[lang].consult, exact: true });
  const href = await consult.getAttribute('href');
  const details = new URL(href!, 'http://localhost').searchParams.get('details')!;
  expect(details.length).toBeLessThanOrEqual(4000);
  const link = details.split('\n').find(line => line.startsWith('https://flashcast.com.my/'))!;
  expect(new URL(link).searchParams.get('d')).toBe(encoded);
  expect(details.slice(0, 4000)).toContain(link);
  await consult.click();
  await expect(page.locator('#quote-details')).toHaveValue(details);
  await expect(page.locator('#quote-form')).toBeInViewport();
  await expect(page.getByRole('button', { name: text[lang].share, exact: true })).toHaveCount(0);
});
