import { expect, test, type Page } from "@playwright/test";

const ready = (page: Page) => expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'ready', { timeout: 20000 });
const pageFeedback = '.public-route-scene[data-pending="true"]:not([data-region-only]) + .public-route-feedback[aria-busy="true"]';
const navigationLink = (page: Page, width: number, path: string) => page.locator(`${width < 768 ? '.scheme-a-mobile-dock' : width < 1180 ? '.scheme-a-directory' : '.scheme-a-chrome__primary'} a[href="${path}"]`);

async function navigate(page: Page, width: number, path: string) {
  if (width >= 768 && width < 1180) {
    await page.locator('.scheme-a-chrome__menu-trigger--compact').click();
    const group = page.locator('.scheme-a-directory__groups > section').filter({ has: page.locator(`a[href="${path}"]`) });
    if (await group.getAttribute('data-open') !== 'true') await group.locator('.scheme-a-directory__group-toggle').click();
  }
  await navigationLink(page, width, path).first().click();
}

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`real navigation has no previous-page layer or glyph outline at ${width}px`, async ({ page, browserName }, info) => {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ['zh', 'en']) {
      await page.goto(`/${language}`, { waitUntil: 'domcontentloaded' });
      await ready(page);
      const previousTitle = await page.locator("#main-content h1").innerText();
      await page.evaluate(() => {
        const audit = { frames: [] as { path: string; title: string; state: string; opacity: number; clones: number; titles: number; shadow: string; fill: string; color: string }[], stop: false };
        (window as unknown as { handoffAudit: typeof audit }).handoffAudit = audit;
        const sample = () => {
          const scene = document.querySelector('.public-route-scene');
          const heading = document.querySelector('#main-content h1');
          const glyph = heading ? getComputedStyle(heading) : null;
          audit.frames.push({ path: location.pathname, title: heading?.textContent?.trim().replace(/\s+/g, " ") || "", state: document.querySelector<HTMLElement>('.public-route-content')?.dataset.routeVisualState || '', opacity: scene ? Number(getComputedStyle(scene).opacity) : 0,
            clones: document.querySelectorAll('.public-route-retained').length, titles: document.querySelectorAll('#main-content h1').length,
            shadow: glyph?.textShadow || '', fill: glyph?.webkitTextFillColor || '', color: glyph?.color || '' });
          if (!audit.stop) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      // Exercise the actual top/bottom navigation, after scrolling away from the hero.
      if (browserName === "webkit") await page.evaluate(() => scrollTo(0, 420));
      else await page.mouse.wheel(0, 420);
      await page.waitForTimeout(120);
      if (browserName === "webkit") await page.evaluate(() => scrollTo(0, 320));
      else await page.mouse.wheel(0, -100);
      await navigate(page, width, `/${language}/materials`);
      await expect(page).toHaveURL(new RegExp(`/${language}/materials$`));
      await ready(page);
      await navigate(page, width, `/${language}/projects`);
      await ready(page);
      await page.goBack();
      await ready(page);
      const frames = await page.evaluate(() => {
        const audit = (window as unknown as { handoffAudit: { frames: object[]; stop: boolean } }).handoffAudit;
        audit.stop = true; return audit.frames;
      }) as { path: string; title: string; state: string; opacity: number; clones: number; titles: number; shadow: string; fill: string; color: string }[];
      expect(frames.length).toBeGreaterThan(10);
      expect(frames.some(frame => frame.state === 'waiting')).toBe(true);
      for (const frame of frames) {
        expect(frame.clones).toBe(0);
        if (frame.path !== `/${language}` && frame.title === previousTitle.trim().replace(/\s+/g, " ")) expect(frame.opacity, "previous title exposed after navigation").toBe(0);
        expect(frame.titles).toBeLessThanOrEqual(1);
        if (frame.state === 'waiting' || frame.state === 'timeout') expect(frame.opacity).toBe(0);
        expect(frame.fill).toBe(frame.color);
        if (frame.shadow) expect(frame.shadow).toBe('none');
      }
      expect(await page.locator('[data-route-loader="initial"]').count()).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await info.attach(`${language}-${width}-frames`, { body: JSON.stringify(frames), contentType: 'application/json' });
      if (language === 'en') await page.screenshot({ path: info.outputPath(`${width}-navigation.png`) });
    }
  });
}

test('latest rapid tap wins and language navigation keeps a single destination', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en'); await ready(page);
  await page.evaluate(() => {
    document.querySelector<HTMLAnchorElement>('.scheme-a-mobile-dock a[href="/en/materials"]')!.click();
    document.querySelector<HTMLAnchorElement>('.scheme-a-mobile-dock a[href="/en/projects"]')!.click();
  });
  await expect(page).toHaveURL(/\/en\/projects$/); await ready(page);
  await page.locator('.scheme-a-chrome .scheme-a-language-switch a[href="/zh/projects"]').click();
  await expect(page).toHaveURL(/\/zh\/projects$/); await ready(page);
  await page.waitForTimeout(600);
  await expect(page).toHaveURL(/\/zh\/projects$/);
  await expect(page.locator('.public-route-retained')).toHaveCount(0);
});

test.describe('network fault injection', () => {
// WebKit cannot intercept requests controlled by a service worker. Normal
// navigation above and the document-loading suite still exercise the worker.
test.use({ serviceWorkers: 'block' });
for (const width of [360, 390, 768, 1024, 1440]) {
test(`slow language changes show visible feedback and release real content at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  for (const [source, target, label] of [['en', 'zh', '页面加载中…'], ['zh', 'en', 'Loading page…']]) {
    await page.goto(`/${source}`); await ready(page);
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/rest/v1/materials*', async route => { await held; await route.continue(); });
    await page.route('**/rest/v1/site_pages*', async route => {
      if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
      await held; await route.continue();
    });
    try {
      await navigate(page, width, `/${source}/materials`);
      await expect(page.locator(pageFeedback)).toBeVisible();
      await page.locator(`.scheme-a-language-switch a[href="/${target}/materials"]`).click();
      const feedback = page.locator(pageFeedback);
      await expect(feedback).toBeVisible();
      await expect(feedback.locator('span')).toHaveText(label);
      const bounds = await feedback.locator('span').boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThan(80);
      expect(bounds!.height).toBeGreaterThan(30);
      expect(bounds!.y).toBeGreaterThanOrEqual(width < 768 ? 56 : 76);
      expect(bounds!.y + bounds!.height).toBeLessThan(844 - (width < 768 ? 82 : 32));
      await expect(page.locator('.public-route-content')).toHaveAttribute('inert');
      await expect(page.locator('.public-route-scene')).toHaveCSS('opacity', '0');
      await expect(page.locator('.scheme-a-chrome')).toBeVisible();
      if (width < 768) await expect(page.locator('.scheme-a-mobile-dock')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath(`${width}-${target}-waiting.png`)});
      release();
      await ready(page);
      await expect(feedback).toHaveCount(0);
      await expect(page.locator('.public-route-content')).not.toHaveAttribute('inert');
      await expect(page.locator('#main-content h1')).toBeVisible();
      await expect(page.locator('.public-route-retained')).toHaveCount(0);
    } finally {
      release();
      await page.unroute('**/rest/v1/materials*');
      await page.unroute('**/rest/v1/site_pages*');
    }
  }
});
}

test('slow language data retains visible retry and cancel recovery under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/en'); await ready(page);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/materials*', async route => { await held; await route.continue(); });
  await page.route('**/rest/v1/site_pages*', async route => {
    if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
    await held; await route.continue();
  });
  try {
    await navigationLink(page,390,'/en/materials').click();
    await expect(page.locator(pageFeedback + ' > span')).toBeVisible();
    await page.locator('.scheme-a-language-switch a[href="/zh/materials"]').click();
    await expect(page.locator(pageFeedback + ' > span')).toBeVisible();
    expect(await page.locator('.public-route-feedback > i').evaluate(element => getComputedStyle(element, '::after').animationName)).toBe('none');
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','timeout',{timeout:8000});
    const recovery = page.locator('.public-route-feedback__recovery');
    await expect(recovery.getByRole('button',{name:'重试',exact:true})).toBeVisible();
    await expect(recovery.getByRole('button',{name:'取消',exact:true})).toBeVisible();
    await expect(page.locator(pageFeedback)).toHaveCount(0);
    await recovery.getByRole('button',{name:'取消',exact:true}).click();
    await expect(page).toHaveURL(/\/en$/); await ready(page);
  } finally { release(); }
});

test('slow image navigation releases its placeholder and never restores an old page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/site_pages*', async route => {
    if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
    const response = await route.fetch();
    const rows = await response.json();
    await route.fulfill({ response, json: rows.map((row: Record<string, unknown>) => ({ ...row, image_url: '/images/heroes/v5/hero-materials-v5-desktop.webp' })) });
  });
  await page.route('**/images/**/hero-materials*', async route => { await held; await route.continue(); });
  try {
    await page.goto('/en'); await ready(page);
    await navigationLink(page, 390, '/en/materials').click();
    await expect(page).toHaveURL(/\/en\/materials$/);
    await expect(page.locator('.public-route-scene')).toHaveCSS('opacity', '0');
    await expect(page.locator('[data-route-loader="navigation"]')).toBeVisible();
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'degraded', { timeout: 8000 });
    await expect(page.locator('#main-content .smart-image-slow button').first()).toBeVisible();
    await expect(page.locator('.public-route-retained')).toHaveCount(0);
    // Navigation stays available while a dependency is slow.
    await navigationLink(page, 390, '/en/projects').click();
    release();
    await expect(page).toHaveURL(/\/en\/projects$/); await ready(page);
    await expect(page.locator('.public-route-feedback')).toHaveCount(0);
  } finally { release(); }
});

});

test('reduced motion and keyboard links keep native history and focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en'); await ready(page);
  const link = navigationLink(page, 1440, '/en/materials');
  await link.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/materials$/); await ready(page);
  await expect(page.locator('#main-content')).toBeFocused();
  expect(await page.locator('.public-route-scene').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.goBack(); await ready(page);
  await expect(page).toHaveURL(/\/en$/);
});
