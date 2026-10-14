import { expect, test, type CDPSession, type Page } from "@playwright/test";
import { expectNoNavigationBrand, expectPageNavigationBrand, observeNavigationBrand, protectPublicTestWrites } from './public-loader-audit';

test.use({ serviceWorkers: 'block' });
type WarmWriteGuard = {
  session: CDPSession;
  blockedWrites: number;
  guardErrors: number;
  imageResponses: { url: string; cacheControl: string; fromDiskCache: boolean }[];
};
const warmWriteGuards = new WeakMap<Page, WarmWriteGuard>();

async function protectWarmTestWrites(page: Page) {
  const session = await page.context().newCDPSession(page);
  const audit: WarmWriteGuard = { session, blockedWrites: 0, guardErrors: 0, imageResponses: [] };
  warmWriteGuards.set(page, audit);
  await session.send('Network.enable');
  session.on('Network.responseReceived', ({ response }) => {
    if (new URL(response.url).pathname.includes('/heroes/')) audit.imageResponses.push({
      url: response.url, cacheControl: String(response.headers['Cache-Control'] || response.headers['cache-control'] || ''), fromDiskCache: !!response.fromDiskCache,
    });
  });
  session.on('Fetch.requestPaused', event => {
    const request = event.request;
    const readOnlyHomeRpc = request.method === 'POST' && new URL(request.url).pathname === '/rest/v1/rpc/get_public_home_bundle';
    // Native Fetch exposes OPTIONS preflights; they only authorize a later
    // request. The later write remains intercepted before it can reach a server.
    const operation = ['GET', 'HEAD', 'OPTIONS'].includes(request.method) || readOnlyHomeRpc
      ? session.send('Fetch.continueRequest', { requestId: event.requestId })
      : (audit.blockedWrites++, session.send('Fetch.fulfillRequest', {
        requestId: event.requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from('{}').toString('base64'),
      }));
    void operation.catch(() => { audit.guardErrors++; });
  });
  // Leave the browser's HTTP cache untouched. Playwright's page.route guard is
  // used by fault tests, but it globally disables the cache required here.
  await session.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
}

test.beforeEach(async ({ page, browserName }, info) => {
  if (browserName === 'chromium' && info.title.startsWith('warmed routes ')) await protectWarmTestWrites(page);
  else await protectPublicTestWrites(page);
});
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

const ready = (page: Page) => expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'ready', { timeout: 20000 });
const pageFeedback = '.public-route-feedback[data-feedback-scope="page"][data-route-loader="navigation"][aria-busy="true"]';
const regionFeedback = '.public-route-feedback[data-feedback-scope="region"][data-route-loader="navigation"][aria-busy="true"]';
const criticalImage = '#main-content img[data-critical-image="true"]';
const navigationLink = (page: Page, width: number, path: string) => page.locator(`${width < 768 ? '.scheme-a-mobile-dock' : width < 1180 ? '.scheme-a-directory' : '.scheme-a-chrome__primary'} a[href="${path}"]`);
type CachedRouteFrame = {
  path: string; title: string; state: string; presentation: string; waitReason: string;
  opacity: number; pending: boolean; hidden: boolean; inert: boolean; retained: number;
  pageFeedback: number; skeletons: number; paintedContent: boolean; viewport: number[];
  images: { selected: string; candidate: string; configuration: string; decoded: string; state: string; complete: boolean; width: number }[];
};
type CachedReadyEvent = { path: string; routeKey: string; degraded: boolean; imagesReady: boolean; dataPending: boolean };

// Await an actual paint, rather than adding a delay that can hide a bad frame.
const painted = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

async function successfulRoute(page: Page) {
  await ready(page);
  await expect(page.locator('#main-content [data-route-pending="true"]')).toHaveCount(0);
  await expect(page.locator('#main-content [data-content-state="error"], [data-interaction-feedback="public"]')).toHaveCount(0);
  await expect(page.locator('#main-content [data-public-results][aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator(criticalImage).first()).toHaveAttribute('data-image-state', 'loaded');
  await expect.poll(() => page.locator(criticalImage).evaluateAll(images => images.length > 0 && images.every(element => {
    const image = element as HTMLImageElement;
    const bounds = image.getBoundingClientRect();
    if (bounds.top >= innerHeight || bounds.bottom <= 0 || bounds.width === 0 || bounds.height === 0) return true;
    const selected = image.currentSrc || image.src;
    return image.complete && image.naturalWidth > 0 && image.dataset.imageState === 'loaded' && image.dataset.decodedSrc === selected;
  }))).toBe(true);
  await painted(page);
  return page.evaluate(() => ({
    title: document.querySelector('#main-content h1')?.textContent?.trim().replace(/\s+/g, ' ') || '',
    images: [...document.querySelectorAll<HTMLImageElement>('#main-content img[data-critical-image="true"]')].map(image => image.currentSrc || image.src),
    imageConfigurations: [...document.querySelectorAll<HTMLImageElement>('#main-content img[data-critical-image="true"]')].map(image => JSON.stringify([
      image.getAttribute('src'), image.getAttribute('srcset'), image.getAttribute('sizes'),
      [...image.closest('picture')?.querySelectorAll('source') || []].map(source => [source.getAttribute('media'), source.getAttribute('srcset'), source.getAttribute('sizes'), source.getAttribute('type')]),
    ])),
    viewport: [innerWidth, innerHeight, devicePixelRatio],
  }));
}

for (const width of [390, 1440]) for (const language of ['zh', 'en']) {
  test(`warmed routes never flash pending content at ${width}px in ${language}`, async ({ page, browser, browserName }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const writeGuard = warmWriteGuards.get(page);
    const paths = ['services', 'materials', 'projects'].map(name => `/${language}/${name}`);
    await page.goto(paths[0], { waitUntil: 'domcontentloaded' });
    const warmed: Record<string, Awaited<ReturnType<typeof successfulRoute>>> = {};
    warmed[paths[0]] = await test.step(`confirm successful warm ${paths[0]}`, () => successfulRoute(page));
    const writeProtection = await page.evaluate(async () => {
      const response = await fetch('/__codex_write_protection_probe__', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      return { status: response.status, body: await response.text() };
    });
    expect(writeProtection).toEqual({ status: 200, body: '{}' });
    if (writeGuard) expect(writeGuard.blockedWrites).toBeGreaterThan(0);
    for (const path of paths.slice(1)) {
      warmed[path] = await test.step(`warm ${path} through real navigation`, async () => {
        await navigate(page, width, path);
        return successfulRoute(page);
      });
    }
    // Cold destinations may legitimately brand; zero-brand auditing starts only
    // after every route has real data and selected-image decode evidence.
    await observeNavigationBrand(page);

    await page.evaluate(() => {
      const audit = { stop: false, frames: [] as CachedRouteFrame[], readyEvents: [] as CachedReadyEvent[] };
      (window as unknown as { cachedFrameAudit: typeof audit }).cachedFrameAudit = audit;
      window.addEventListener('public-route-ready', event => {
        if (audit.stop) return;
        const detail = (event as CustomEvent<{ routeKey: string; degraded: boolean }>).detail;
        const images = [...document.querySelectorAll<HTMLImageElement>('#main-content img[data-critical-image="true"]')];
        audit.readyEvents.push({ path: location.pathname, routeKey: detail.routeKey, degraded: detail.degraded,
          dataPending: !!document.querySelector('#main-content [data-route-pending="true"]'),
          imagesReady: images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0 && image.dataset.imageState === 'loaded' && image.dataset.decodedSrc === (image.currentSrc || image.src)),
        });
      });
      const sample = () => {
        if (audit.stop) return;
        const scene = document.querySelector<HTMLElement>('.public-route-scene');
        const heading = document.querySelector('#main-content h1');
        const bounds = scene?.getBoundingClientRect();
        const style = scene ? getComputedStyle(scene) : null;
        const content = document.querySelector<HTMLElement>('.public-route-content');
        audit.frames.push({
          path: location.pathname,
          title: heading?.textContent?.trim().replace(/\s+/g, ' ') || '',
          state: content?.dataset.routeVisualState || '',
          presentation: content?.dataset.routePresentation || '',
          waitReason: content?.dataset.routeWaitReason || '',
          opacity: style ? Number(style.opacity) : 0,
          pending: !!document.querySelector('.public-route-scene[data-pending="true"], #main-content [data-route-pending="true"]'),
          hidden: content?.getAttribute('aria-hidden') === 'true',
          inert: !!content?.hasAttribute('inert'),
          retained: document.querySelectorAll('.public-route-retained').length,
          pageFeedback: document.querySelectorAll('.public-route-feedback[data-feedback-scope="page"]').length,
          skeletons: document.querySelectorAll('.public-route-feedback__skeleton, #main-content [data-content-state="loading"]').length,
          paintedContent: !!heading && !!bounds && bounds.width > 0 && bounds.height > 0 && bounds.top < innerHeight && bounds.bottom > 0 && style?.visibility === 'visible',
          viewport: [innerWidth, innerHeight, devicePixelRatio],
          images: [...document.querySelectorAll<HTMLImageElement>('#main-content img[data-critical-image="true"]')].map(image => ({
            selected: image.currentSrc || image.src, candidate: image.currentSrc,
            configuration: JSON.stringify([image.getAttribute('src'), image.getAttribute('srcset'), image.getAttribute('sizes'),
              [...image.closest('picture')?.querySelectorAll('source') || []].map(source => [source.getAttribute('media'), source.getAttribute('srcset'), source.getAttribute('sizes'), source.getAttribute('type')])]),
            decoded: image.dataset.decodedSrc || '', state: image.dataset.imageState || '', complete: image.complete, width: image.naturalWidth,
          })),
        });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    // Revisit each successfully loaded destination repeatedly through real links.
    for (const [index, path] of [...paths, ...paths, ...paths].entries()) {
      await test.step(`cached navigation ${index + 1}: ${path}`, async () => {
        await navigate(page, width, path);
        expect(await successfulRoute(page)).toEqual(warmed[path]);
      });
    }
    // POP uses browser history rather than a Link commit; audit the same paints.
    await test.step(`cached browser back: ${paths[1]}`, async () => {
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${paths[1]}$`));
      expect(await successfulRoute(page)).toEqual(warmed[paths[1]]);
    });
    await test.step(`cached browser forward: ${paths[2]}`, async () => {
      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`${paths[2]}$`));
      expect(await successfulRoute(page)).toEqual(warmed[paths[2]]);
    });
    const { frames, readyEvents } = await page.evaluate(() => {
      const audit = (window as unknown as { cachedFrameAudit: { stop: boolean; frames: CachedRouteFrame[]; readyEvents: CachedReadyEvent[] } }).cachedFrameAudit;
      audit.stop = true;
      return { frames: audit.frames, readyEvents: audit.readyEvents };
    });
    const environment = {
      browserName, browserVersion: browser.version(), userAgent: await page.evaluate(() => navigator.userAgent),
      writeGuard: writeGuard ? 'native Fetch interception; default browser HTTP cache unchanged' : 'Playwright routing',
      guardErrors: writeGuard?.guardErrors, imageResponses: writeGuard?.imageResponses, writeProtection,
    };
    await info.attach('warmed-route-frames', { body: JSON.stringify({ environment, warmed, frames, readyEvents }), contentType: 'application/json' });
    expect(frames.length).toBeGreaterThan(0);
    for (const path of paths) expect(frames.some(frame => frame.path === path), `painted ${path}`).toBe(true);
    for (const frame of frames) {
      const evidence = `cached ${frame.path}: ${JSON.stringify(frame)}`;
      expect(frame.pending, evidence).toBe(false);
      expect(frame.hidden, evidence).toBe(false);
      expect(frame.inert, evidence).toBe(false);
      expect(frame.retained, evidence).toBe(0);
      expect(frame.pageFeedback, evidence).toBe(0);
      expect(frame.skeletons, evidence).toBe(0);
      expect(frame.opacity, evidence).toBe(1);
      expect(frame.paintedContent, evidence).toBe(true);
      expect(frame.title, evidence).toBe(warmed[frame.path].title);
      expect(frame.viewport, evidence).toEqual(warmed[frame.path].viewport);
      expect(frame.images.map(image => image.configuration), evidence).toEqual(warmed[frame.path].imageConfigurations);
      if (frame.state !== 'ready') {
        // Native disk-cache image remounts can still transfer/decode. That real
        // wait must stay image-only without hiding or locking the known page.
        expect(frame.state, evidence).toBe('waiting');
        expect(frame.presentation, evidence).toBe('image-only');
        expect(['image-transfer', 'image-decode'], evidence).toContain(frame.waitReason);
      }
      for (const [index, image] of frame.images.entries()) {
        if (image.state === 'loaded') {
          expect(image.complete && image.width > 0, evidence).toBe(true);
          expect(image.selected, evidence).toBe(warmed[frame.path].images[index]);
          expect(image.decoded, evidence).toBe(image.selected);
        } else {
          expect(frame.state, evidence).toBe('waiting');
          expect(image.state, evidence).toBe('loading');
          expect(image.decoded, evidence).toBe('');
          if (image.candidate) expect(image.candidate, evidence).toBe(warmed[frame.path].images[index]);
        }
      }
    }
    expect(readyEvents.length).toBeGreaterThanOrEqual(11);
    for (const event of readyEvents) {
      expect(event.imagesReady, `ready emitted before real decode: ${JSON.stringify(event)}`).toBe(true);
      expect(event.dataPending).toBe(false);
      expect(event.degraded).toBe(false);
      expect(event.routeKey.split('?')[0]).toBe(event.path);
    }
    await expectNoNavigationBrand(page);
    await expect(page.locator('.public-route-content')).not.toHaveAttribute('inert');
    if (writeGuard) expect(writeGuard.guardErrors).toBe(0);
    await page.screenshot({ path: info.outputPath('cached-navigation-ready.png') });
  });
}

async function navigate(page: Page, width: number, path: string) {
  let link = navigationLink(page, width, path).first();
  if (width >= 768 && width < 1180 || await link.count() === 0) {
    const directory = page.locator('.scheme-a-directory');
    // A prior real menu click may still be closing when a cached page is ready.
    // Wait for that actual chrome state, so toggling cannot re-close the menu.
    if (await directory.getAttribute('data-state') === 'closing') await expect(directory).toHaveAttribute('data-state', 'closed');
    if (await directory.getAttribute('data-state') !== 'open') {
      await page.locator(width >= 1180 ? '.scheme-a-chrome__nav-more' : '.scheme-a-chrome__menu-trigger--compact').click();
    }
    await expect(directory).toHaveAttribute('data-state', 'open');
    const group = page.locator('.scheme-a-directory__groups > section').filter({ has: page.locator(`a[href="${path}"]`) });
    if (await group.getAttribute('data-open') !== 'true') await group.locator('.scheme-a-directory__group-toggle').click();
    link = group.locator(`a[href="${path}"]`);
  }
  await link.click();
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
      await expect(page.locator('#flashcast-public-boot, [data-route-loader="initial"]')).toHaveCount(0);
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
          if (document.querySelector('.scheme-a-page-loader__brand, #flashcast-public-boot')) audit.brand++;
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
      await expectPageNavigationBrand(page);
      await page.locator('.scheme-a-chrome__brand').first().click({ trial: true });
      release(); await ready(page);
      await expect(page.locator('[data-route-loader]')).toHaveCount(0);
      const slow = await auditStop();
      expect(slow.frames).toBeGreaterThan(0);
      expect(slow.blank).toBe(0);
      expect(slow.brand).toBeGreaterThan(0);
      await observeNavigationBrand(page);
      await auditStart();
      await navigate(page, width, "/zh/services");
      await expect(page).toHaveURL(/\/zh\/services$/); await ready(page);
      await expect(page.locator('[data-route-loader]')).toHaveCount(0);
      const cached = await auditStop();
      expect(cached.blank).toBe(0);
      expect(cached.brand).toBe(0);
      await expectNoNavigationBrand(page);
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
      await expect(page.locator('#flashcast-public-boot, [data-route-loader="initial"]')).toHaveCount(0);
      const previousTitle = await page.locator("#main-content h1").innerText();
      await page.evaluate(() => {
        const audit = { frames: [] as { path: string; title: string; state: string; presentation: string; waitReason: string; dataPending: boolean; opacity: number; clones: number; titles: number; shadow: string; fill: string; color: string; navigationBrands: number; initialBrands: number }[], stop: false };
        (window as unknown as { handoffAudit: typeof audit }).handoffAudit = audit;
        const sample = () => {
          const scene = document.querySelector('.public-route-scene');
          const heading = document.querySelector('#main-content h1');
          const glyph = heading ? getComputedStyle(heading) : null;
          const content = document.querySelector<HTMLElement>('.public-route-content');
          audit.frames.push({ path: location.pathname, title: heading?.textContent?.trim().replace(/\s+/g, " ") || "", state: content?.dataset.routeVisualState || '', presentation: content?.dataset.routePresentation || '', waitReason: content?.dataset.routeWaitReason || '', dataPending: !!document.querySelector('#main-content [data-route-pending="true"]'), opacity: scene ? Number(getComputedStyle(scene).opacity) : 0,
            clones: document.querySelectorAll('.public-route-retained').length, titles: document.querySelectorAll('#main-content h1').length,
            shadow: glyph?.textShadow || '', fill: glyph?.webkitTextFillColor || '', color: glyph?.color || '',
            navigationBrands: document.querySelectorAll('.public-route-feedback .scheme-a-page-loader__brand').length,
            initialBrands: document.querySelectorAll('#flashcast-public-boot, [data-route-loader="initial"]').length });
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
      }) as { path: string; title: string; state: string; presentation: string; waitReason: string; dataPending: boolean; opacity: number; clones: number; titles: number; shadow: string; fill: string; color: string; navigationBrands: number; initialBrands: number }[];
      expect(frames.length).toBeGreaterThan(10);
      // Real dependencies may already be cached; navigation itself is not a wait.
      expect(frames.some(frame => frame.state === 'ready' && frame.opacity === 1)).toBe(true);
      for (const frame of frames) {
        expect(frame.initialBrands).toBe(0);
        expect(frame.clones).toBe(0);
        if (frame.path !== `/${language}` && frame.title === previousTitle.trim().replace(/\s+/g, " ")) expect(frame.opacity, "previous title exposed after navigation").toBe(0);
        expect(frame.titles).toBeLessThanOrEqual(1);
        if (frame.state === 'waiting' && frame.presentation === 'image-only') {
          expect(frame.opacity).toBe(1);
          expect(frame.dataPending).toBe(false);
          expect(['image-transfer', 'image-decode']).toContain(frame.waitReason);
          expect(frame.navigationBrands).toBe(0);
        } else if (frame.state === 'waiting') {
          expect(frame.opacity).toBe(0);
          expect(frame.navigationBrands).toBe(1);
        } else {
          if (frame.state === 'timeout') expect(frame.opacity).toBe(0);
          expect(frame.navigationBrands).toBe(0);
        }
        expect(frame.fill).toBe(frame.color);
        if (frame.shadow) expect(frame.shadow).toBe('none');
      }
      expect(await page.locator('[data-route-loader="initial"]').count()).toBe(0);
      await observeNavigationBrand(page);
      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`/${language}/projects$`));
      await ready(page);
      await expectNoNavigationBrand(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await info.attach(`${language}-${width}-frames`, { body: JSON.stringify(frames), contentType: 'application/json' });
      if (language === 'en') await page.screenshot({ path: info.outputPath(`${width}-navigation.png`) });
    }
  });
}

for (const width of [390, 1440]) {
  test(`real taps and content controls respond without whole-page fades at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      const audit = { clicks: [] as string[], nativeCalls: 0, sceneAnimations: 0 };
      (window as unknown as { inputAudit: typeof audit }).inputAudit = audit;
      // Keep a local results animation alive so actual input can interrupt it.
      const animate = HTMLElement.prototype.animate;
      HTMLElement.prototype.animate = function (keyframes, options) {
        const next = typeof options === 'number' ? { duration: options } : { ...options };
        if (this.matches('.public-route-scene')) audit.sceneAnimations++;
        if (this.matches('[data-public-results]')) next.duration = 60000;
        return animate.call(this, keyframes, next);
      };
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
    // Warm destinations, then exercise real pointer input on cached pages.
    for (const path of ['/en/materials', '/en/projects', '/en']) {
      await navigationLink(page, width, path).first().click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await ready(page);
    }
    await observeNavigationBrand(page);
    await navigationLink(page, width, '/en/materials').click();
    await expect(page).toHaveURL(/\/en\/materials$/); await ready(page);
    expect(await page.locator('.public-route-scene').evaluate(element => element.getAnimations().length)).toBe(0);
    await expect(page.locator('.public-route-scene')).toHaveCSS('opacity', '1');
    await navigationLink(page, width, '/en/projects').click();
    await expect(page).toHaveURL(/\/en\/projects$/); await ready(page);
    await expect(page.locator('.public-route-content')).not.toHaveAttribute('inert');
    await expect(page.locator('[data-route-loader]')).toHaveCount(0);
    expect(await page.locator('.public-route-scene').evaluate(element => element.getAnimations().length)).toBe(0);
    await expect(page.locator('.public-route-scene')).toHaveCSS('opacity', '1');
    const residential = page.locator('#main-content').getByRole('button', { name: 'Residential', exact: true });
    await residential.click();
    await expect(page).toHaveURL(/filter=Residential/);
    await expect(residential).toHaveAttribute('aria-pressed', 'true');
    await ready(page);
    expect(await page.locator('[data-public-results]').evaluate(element => element.getAnimations().some(animation => animation.playState === 'running'))).toBe(true);
    await page.locator('#main-content').getByRole('button', { name: 'All', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/projects$/);
    await expect(residential).toHaveAttribute('aria-pressed', 'false');
    await ready(page);
    const input = await page.evaluate(() => (window as unknown as { inputAudit: { clicks: string[]; nativeCalls: number; sceneAnimations: number } }).inputAudit);
    expect(input.clicks.slice(-2)).toEqual(['/en/materials', '/en/projects']);
    expect(input.nativeCalls).toBe(0);
    expect(input.sceneAnimations).toBe(0);
    await page.locator('.scheme-a-chrome .scheme-a-language-switch a[href^="/zh/projects"]').click();
    await expect(page).toHaveURL(/\/zh\/projects(?:\?|$)/); await ready(page);
    await expect(page.locator('.public-route-retained')).toHaveCount(0);
    await expectNoNavigationBrand(page);
  });
}

test.describe('network fault injection', () => {
// The whole suite blocks service workers so its write interception is effective.
for (const width of [390, 1440]) {
test(`a changed critical source cannot reuse another image's ready evidence at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  const originalSource = '/images/heroes/v5/hero-materials-v5-desktop.webp';
  const changedSource = '/images/heroes/v5/hero-process-v5-desktop.webp';
  let changed = false;
  let requestsHeld = 0;
  let release = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/site_pages*', async route => {
    if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
    await route.fulfill({ status: 200, contentType: 'application/json', json: [{
      page_key: 'materials', path: '/materials', status: 'published', image_url: changed ? changedSource : originalSource,
    }] });
  });
  await page.route('**/images/**/hero-process*', async route => {
    requestsHeld++;
    await held;
    await route.continue();
  });
  try {
    await page.goto('/en/materials', { waitUntil: 'domcontentloaded' });
    const original = await successfulRoute(page);
    await observeNavigationBrand(page);
    changed = true;
    await page.locator('.scheme-a-chrome .scheme-a-language-switch a[href="/zh/materials"]').click();
    await expect(page).toHaveURL(/\/zh\/materials$/);
    await expect.poll(() => requestsHeld).toBeGreaterThan(0);
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'waiting');
    await expect(page.locator(regionFeedback + ' [data-loading-progress="true"]')).toBeVisible();
    await expect(page.locator(criticalImage).first()).toHaveAttribute('data-image-state', 'loading');
    const replacementBindings = await page.locator(criticalImage).first().evaluate((image: HTMLImageElement) => [
      image.getAttribute('src'), image.getAttribute('srcset'),
      ...[...image.closest('picture')?.querySelectorAll('source') || []].map(source => source.getAttribute('srcset')),
    ].filter((value): value is string => !!value));
    expect(replacementBindings.length).toBeGreaterThan(0);
    expect(replacementBindings.every(source => source.includes('hero-process'))).toBe(true);
    expect(await page.locator(criticalImage).first().getAttribute('data-decoded-src')).toBeNull();
    await expect(page.locator('.public-route-scene')).toHaveCSS('opacity', '1');
    await expect(page.locator(pageFeedback)).toHaveCount(0);
    const retainedBitmap = page.locator('#main-content .smart-image-previous').first();
    await expect(retainedBitmap).toBeVisible();
    await expect.poll(() => retainedBitmap.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && getComputedStyle(image).opacity === '1')).toBe(true);
    expect(await retainedBitmap.evaluate((image: HTMLImageElement) => image.currentSrc || image.src)).toBe(original.images[0]);
    await expectNoNavigationBrand(page);
    // Actual navigation remains usable while the replacement source is held.
    await page.locator('.scheme-a-chrome .scheme-a-language-switch a[href="/en/materials"]').click();
    await expect(page).toHaveURL(/\/en\/materials$/);
    await successfulRoute(page);
    await expect(page.locator(pageFeedback)).toHaveCount(0);
    await page.locator('.scheme-a-chrome .scheme-a-language-switch a[href="/zh/materials"]').click();
    await expect(page).toHaveURL(/\/zh\/materials$/);
    await expect(page.locator(regionFeedback + ' [data-loading-progress="true"]')).toBeVisible();
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'waiting');
    await expect(page.locator(criticalImage).first()).toHaveAttribute('data-image-state', 'loading');
    release();
    const replacement = await successfulRoute(page);
    expect(replacement.images).not.toEqual(original.images);
    expect(replacement.images.every(source => source.includes('hero-process'))).toBe(true);
    await expect(page.locator('[data-route-loader]')).toHaveCount(0);
    await expectNoNavigationBrand(page);
    await info.attach('critical-source-replacement', { body: JSON.stringify({ original, replacement, requestsHeld }), contentType: 'application/json' });
  } finally { release(); }
});
}

for (const width of [360, 390, 768, 1024, 1440]) {
test(`cold-page language changes keep one page brand and release real content at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 844 });
  for (const [source, target, label] of [['en', 'zh', '空间正在显影'], ['zh', 'en', 'Bringing the space into focus']]) {
    await page.goto(`/${source}`); await ready(page);
    await expect(page.locator('#flashcast-public-boot, [data-route-loader="initial"]')).toHaveCount(0);
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/rest/v1/materials*', async route => { await held; await route.continue(); });
    await page.route('**/rest/v1/site_pages*', async route => {
      if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
      await held; await route.continue();
    });
    try {
      await navigate(page, width, `/${source}/materials`);
      await expectPageNavigationBrand(page);
      await page.locator(`.scheme-a-language-switch a[href="/${target}/materials"]`).click();
      const feedback = await expectPageNavigationBrand(page);
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
      await observeNavigationBrand(page);
      await expectNoNavigationBrand(page);
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
  await expect(page.locator('#flashcast-public-boot, [data-route-loader="initial"]')).toHaveCount(0);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/materials*', async route => { await held; await route.continue(); });
  await page.route('**/rest/v1/site_pages*', async route => {
    if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
    await held; await route.continue();
  });
  try {
    await navigationLink(page,390,'/en/materials').click();
    await expectPageNavigationBrand(page);
    await page.locator('.scheme-a-language-switch a[href="/zh/materials"]').click();
    await expectPageNavigationBrand(page);
    expect(await page.locator(pageFeedback + ' [data-loading-progress="true"]').evaluate(element => getComputedStyle(element, '::after').transitionDuration)).toBe('0s');
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','timeout',{timeout:8000});
    const recovery = page.locator('.public-route-feedback__recovery');
    await expect(recovery.getByRole('button',{name:'重试',exact:true})).toBeVisible();
    await expect(recovery.getByRole('button',{name:'取消',exact:true})).toBeVisible();
    await expect(page.locator(pageFeedback)).toHaveCount(0);
    await observeNavigationBrand(page);
    await expectNoNavigationBrand(page);
    // Retry may brand a new page wait, but cannot re-enter document boot.
    await recovery.getByRole('button',{name:'重试',exact:true}).click();
    await expectPageNavigationBrand(page);
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state','timeout',{timeout:8000});
    await observeNavigationBrand(page);
    await expectNoNavigationBrand(page);
    await recovery.getByRole('button',{name:'取消',exact:true}).click();
    await expect(page).toHaveURL(/\/en$/); await ready(page);
    await expectNoNavigationBrand(page);
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
    await expect(page.locator('#flashcast-public-boot, [data-route-loader="initial"]')).toHaveCount(0);
    await navigationLink(page, 390, '/en/materials').click();
    await expect(page).toHaveURL(/\/en\/materials$/);
    await expect(page.locator('.public-route-scene')).toHaveCSS('opacity', '0');
    await expectPageNavigationBrand(page);
    await navigationLink(page, 390, '/en/projects').click({ trial: true });
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'degraded', { timeout: 8000 });
    await expect(page.locator('.scheme-a-page-loader__brand')).toHaveCount(0);
    await expect(page.locator('#main-content .smart-image-slow button').first()).toBeVisible();
    await expect(page.locator('.public-route-retained')).toHaveCount(0);
    // Navigation stays available while a dependency is slow.
    await navigationLink(page, 390, '/en/projects').click();
    release();
    await expect(page).toHaveURL(/\/en\/projects$/); await ready(page);
    await expect(page.locator('[data-route-loader]')).toHaveCount(0);
    await observeNavigationBrand(page);
    await navigationLink(page, 390, '/en').click();
    await expect(page).toHaveURL(/\/en$/); await ready(page);
    await expectNoNavigationBrand(page);
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
  await observeNavigationBrand(page);
  await page.goBack(); await ready(page);
  await expect(page).toHaveURL(/\/en$/);
  await expectNoNavigationBrand(page);
  await page.goForward(); await ready(page);
  await expect(page).toHaveURL(/\/en\/materials$/);
  await expectNoNavigationBrand(page);
});
