import { expect, test, type Page } from "@playwright/test";

test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

const ready = (page: Page) => expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'ready', { timeout: 20000 });
const pageFeedback = '.scheme-a-page-loader[data-feedback-scope="page"][data-route-loader="navigation"][aria-busy="true"]';
const navigationLink = (page: Page, width: number, path: string) => page.locator(`${width < 768 ? '.scheme-a-mobile-dock' : width < 1180 ? '.scheme-a-directory' : '.scheme-a-chrome__primary'} a[href="${path}"]`);

async function navigate(page: Page, width: number, path: string) {
  let link = navigationLink(page, width, path).first();
  if (width >= 768 && width < 1180 || await link.count() === 0) {
    await page.locator(width >= 1180 ? '.scheme-a-chrome__nav-more' : '.scheme-a-chrome__menu-trigger--compact').click();
    const group = page.locator('.scheme-a-directory__groups > section').filter({ has: page.locator(`a[href="${path}"]`) });
    if (await group.getAttribute('data-open') !== 'true') await group.locator('.scheme-a-directory__group-toggle').click();
    link = group.locator(`a[href="${path}"]`);
  }
  await link.click({ force: true });
  await expect(page).toHaveURL(new RegExp(`${path}$`));
}

for (const width of [390, 1440]) for (const native of [true, false]) {
  test(`continuous handoff has no blank frame at ${width}px, native=${native}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((available) => {
      const audit = { calls: 0 };
      (window as unknown as { nativeTransitionAudit: typeof audit }).nativeTransitionAudit = audit;
      Object.defineProperty(document, 'startViewTransition', { configurable: true, value: available ? () => {
        audit.calls++;
        throw new Error('Public navigation must not snapshot the document');
      } : undefined });
    }, native);
    let release = () => {};
    const aboutReady = new Promise<void>(resolve => { release = resolve; });
    await page.route(/\/(?:src\/pages\/About\.tsx|assets\/About-[^/]+\.js)(?:\?.*)?$/, async route => {
      await aboutReady;
      await route.continue();
    });
    try {
      await page.goto('/zh/services'); await ready(page);
      const auditStart = () => page.evaluate(() => {
        const audit = { stop: false, blank: 0, brand: 0, frames: 0 };
        (window as unknown as { continuityAudit: typeof audit }).continuityAudit = audit;
        const sample = () => {
          if (audit.stop) return;
          const scene = document.querySelector('.public-route-scene');
          const loader = document.querySelector('[data-route-loader="navigation"]');
          const sceneOpacity = scene ? Number(getComputedStyle(scene).opacity) : 0;
          const coverOpacity = loader ? Number(getComputedStyle(loader).opacity) : 0;
          if (sceneOpacity < 0.01 && coverOpacity < 0.01) audit.blank++;
          if (loader?.querySelector('.scheme-a-page-loader__brand')) audit.brand++;
          audit.frames++;
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      const auditStop = () => page.evaluate(() => {
        const audit = (window as unknown as { continuityAudit: { stop: boolean; blank: number; brand: number; frames: number } }).continuityAudit;
        audit.stop = true;
        return audit;
      });
      await auditStart();
      await navigate(page, width, "/zh/about");
      await expect(page.locator('[data-route-loader="navigation"] .scheme-a-page-loader__brand')).toBeVisible();
      await page.locator('.scheme-a-chrome__brand').first().click({ trial: true });
      release(); await ready(page);
      await expect(page.locator('[data-route-loader]')).toHaveCount(0);
      const slow = await auditStop();
      expect(slow.frames).toBeGreaterThan(0);
      expect(slow.blank).toBe(0);
      await auditStart();
      await navigate(page, width, "/zh/services");
      await expect(page).toHaveURL(/\/zh\/services$/); await ready(page);
      await expect(page.locator('[data-route-loader]')).toHaveCount(0);
      const cached = await auditStop();
      expect(cached.blank).toBe(0);
      expect(await page.evaluate(() => (window as unknown as { nativeTransitionAudit: { calls: number } }).nativeTransitionAudit.calls)).toBe(0);
      await info.attach('continuity-frames', { body: JSON.stringify({ slow, cached }), contentType: 'application/json' });
    } finally { release(); }
  });
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
      await expect(page).toHaveURL(new RegExp(`/${language}/materials$`));
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

for (const width of [390, 1440]) {
  test(`real taps and content controls respond before decorative animation ends at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      // Extend only the decorative route fade so this tests readiness, not timing luck.
      const animate = HTMLElement.prototype.animate;
      HTMLElement.prototype.animate = function (keyframes, options) {
        const next = typeof options === 'number' ? { duration: options } : { ...options };
        if (this.matches('.public-route-scene, [data-public-results]')) next.duration = 60000;
        return animate.call(this, keyframes, next);
      };
      const audit = { clicks: [] as string[], nativeCalls: 0 };
      (window as unknown as { inputAudit: typeof audit }).inputAudit = audit;
      const native = document.startViewTransition?.bind(document);
      if (native) document.startViewTransition = (...args) => {
        audit.nativeCalls++;
        return native(...args);
      };
      document.addEventListener('click', event => {
        const link = event.target instanceof Element ? event.target.closest('a') : null;
        if (link) audit.clicks.push(link.getAttribute('href') || '');
      }, true);
    });
    await page.goto('/en'); await ready(page);
    // Warm both destinations, then exercise real pointer input during a live fade.
    for (const path of ['/en/materials', '/en/projects', '/en']) {
      await navigationLink(page, width, path).first().click({ force: true });
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await ready(page);
    }
    await navigationLink(page, width, '/en/materials').click({ force: true });
    await expect(page).toHaveURL(/\/en\/materials$/); await ready(page);
    expect(await page.locator('.public-route-scene').evaluate(element => element.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
    await navigationLink(page, width, '/en/projects').click({ force: true });
    await expect(page).toHaveURL(/\/en\/projects$/); await ready(page);
    await expect(page.locator('.public-route-content')).not.toHaveAttribute('inert');
    await expect(page.locator('[data-route-loader]')).toHaveCount(0);
    expect(await page.locator('.public-route-scene').evaluate(element => element.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
    const residential = page.locator('#main-content').getByRole('button', { name: 'Residential', exact: true });
    await residential.click({ force: true });
    await expect(page).toHaveURL(/filter=Residential/);
    await expect(residential).toHaveAttribute('aria-pressed', 'true');
    const input = await page.evaluate(() => (window as unknown as { inputAudit: { clicks: string[]; nativeCalls: number } }).inputAudit);
    expect(input.clicks.slice(-2)).toEqual(['/en/materials', '/en/projects']);
    expect(input.nativeCalls).toBe(0);
    await page.locator('.scheme-a-chrome .scheme-a-language-switch a[href^="/zh/projects"]').click({ force: true });
    await expect(page).toHaveURL(/\/zh\/projects(?:\?|$)/); await ready(page);
    await expect(page.locator('.public-route-retained')).toHaveCount(0);
  });
}

test.describe('network fault injection', () => {
// WebKit cannot intercept requests controlled by a service worker. Normal
// navigation above and the document-loading suite still exercise the worker.
test.use({ serviceWorkers: 'block' });
for (const width of [360, 390, 768, 1024, 1440]) {
test(`slow language changes show visible feedback and release real content at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  for (const [source, target, label] of [['en', 'zh', '空间正在显影'], ['zh', 'en', 'Bringing the space into focus']]) {
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
      await expect(feedback.locator('.scheme-a-page-loader__brand > span')).toHaveText(label);
      const bounds = await feedback.locator('.scheme-a-page-loader__brand').boundingBox();
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
    await expect(page.locator(pageFeedback + ' .scheme-a-page-loader__brand > span')).toBeVisible();
    await page.locator('.scheme-a-language-switch a[href="/zh/materials"]').click();
    await expect(page.locator(pageFeedback + ' .scheme-a-page-loader__brand > span')).toBeVisible();
    expect(await page.locator('.scheme-a-page-loader__brand > i').evaluate(element => getComputedStyle(element, '::after').transitionDuration)).toBe('0s');
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
    await expect(page.locator('[data-route-loader]')).toHaveCount(0);
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
