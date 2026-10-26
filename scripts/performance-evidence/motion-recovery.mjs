import fs from 'node:fs';
import { chromium, webkit, expect } from '@playwright/test';
import { start } from './server.mjs';

const profile = process.env.PERFORMANCE_BUILD_PROFILE || 'continuation-delivery';
const server = await start(profile), results = [];
try {
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !(request.method() === 'POST' && url.pathname === '/rest/v1/rpc/get_public_home_bundle')) {
          writes.push(url.pathname); return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        }
        if (/googletagmanager|google-analytics|doubleclick|googleadservices/.test(url.hostname)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* Collection disabled */' });
        // Fault injection is confined to this test; product timeouts stay intact.
        if (url.pathname.includes('home-daylight') && url.pathname.endsWith('.webp')) await new Promise(resolve => setTimeout(resolve, 6500));
        return route.continue();
      });
      await page.addInitScript(() => {
        window.__recoveryEvents = [];
        window.__lateBrands = 0;
        window.addEventListener('public-route-ready', event => {
          window.__recoveryEvents.push(event.detail);
          if (event.detail?.degraded) new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
            if (node instanceof Element && (node.matches('.scheme-a-page-loader__brand') || node.querySelector('.scheme-a-page-loader__brand'))) window.__lateBrands++;
          }))).observe(document.body, { subtree: true, childList: true });
        });
      });
      await page.goto(server.url + '/en', { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.locator('.public-route-content').getAttribute('data-route-visual-state'), { timeout: 20000 }).toBe('degraded');
      await expect.poll(() => page.locator('[data-cinematic-state]').count(), { timeout: 20000 }).toBeGreaterThan(0);
      const value = await page.evaluate(() => ({ events: window.__recoveryEvents, lateBrands: window.__lateBrands, state: document.querySelector('.public-route-content')?.dataset.routeVisualState, inert: document.querySelector('.public-route-content')?.hasAttribute('inert'), cinematicSections: document.querySelectorAll('[data-cinematic-state]').length, critical: [...document.querySelectorAll('img[data-critical-image="true"]')].map(image => ({ complete: image.complete, width: image.naturalWidth, loaded: image.dataset.imageState === 'loaded', selected: image.currentSrc, decoded: image.dataset.decodedSrc })) }));
      expect(value.events).toHaveLength(1);
      expect(value.events[0].degraded).toBe(true);
      expect(value.state).toBe('degraded');
      expect(value.lateBrands).toBe(0);
      expect(value.inert).toBe(false);
      expect(value.critical.every(image => image.complete && image.width > 0 && image.loaded && image.selected === image.decoded)).toBe(true);
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
      results.push({ browser: name, version: browser.version(), status: 'passed', ...value });
    } finally { await browser.close(); }
  }
} finally { await server.close(); fs.writeFileSync('tmp/performance-evidence/motion-recovery.json', JSON.stringify({ profile, results }, null, 2) + '\n'); }
console.log(JSON.stringify(results));
