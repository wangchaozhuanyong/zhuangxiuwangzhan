import { expect, type Page } from '@playwright/test';

export async function protectPublicTestWrites(page: Page) {
  await page.route('**/*', route => {
    const request = route.request();
    // This exact RPC is SQL STABLE + SECURITY INVOKER and only SELECTs public
    // homepage data. Let it read real data; other POSTs remain intercepted.
    const readOnlyHomeRpc = request.method() === 'POST'
      && new URL(request.url()).pathname === '/rest/v1/rpc/get_public_home_bundle';
    return ['GET', 'HEAD'].includes(request.method()) || readOnlyHomeRpc
      ? route.fallback()
      : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

/** Watch actual brand markup, including nodes inserted and removed in one frame. */
export async function observeNavigationBrand(page: Page) {
  await expect(page.locator('.scheme-a-page-loader__brand, #flashcast-public-boot')).toHaveCount(0);
  await page.evaluate(() => {
    document.body.dataset.navigationBrandInsertions = '0';
    const brandSelector = '.scheme-a-page-loader__brand, #flashcast-public-boot';
    const feedbackSelector = '[role="status"], .public-route-feedback, .scheme-a-page-loader';
    const brandText = /\bFLASH\s*CAST\b/i;
    const foundBrand = () => {
      document.body.dataset.navigationBrandInsertions = String(Number(document.body.dataset.navigationBrandInsertions) + 1);
    };
    const isFeedback = (node: Node) => {
      const element = node instanceof Element ? node : node.parentElement;
      return !!element?.closest(feedbackSelector);
    };
    const inspect = (node: Node) => {
      const element = node instanceof Element ? node : node.parentElement;
      if (!element) return;
      const knownBrand = element.matches(brandSelector) || !!element.querySelector(brandSelector);
      const feedback = [element.closest(feedbackSelector), ...element.querySelectorAll(feedbackSelector)].filter((entry): entry is Element => !!entry);
      if (knownBrand || feedback.some(entry => brandText.test(entry.textContent || ''))) foundBrand();
    };
    new MutationObserver(records => {
      // Removed/replaced text no longer has a parent when the callback runs.
      // Retain the mutation target's feedback context across this whole batch.
      const feedbackNodes = new WeakSet<Node>();
      const remember = (node: Node) => {
        feedbackNodes.add(node);
        for (const child of node.childNodes) remember(child);
      };
      for (const record of records) if (record.type === 'childList' && isFeedback(record.target)) {
        remember(record.target);
        for (const node of [...record.addedNodes, ...record.removedNodes]) remember(node);
      }
      for (const record of records) {
        inspect(record.target);
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          inspect(node);
          if (feedbackNodes.has(node) && brandText.test(node.textContent || '')) foundBrand();
        }
        if (record.type === 'characterData' && (isFeedback(record.target) || feedbackNodes.has(record.target)) && brandText.test(record.oldValue || '')) foundBrand();
        if (record.type === 'attributes' && /scheme-a-page-loader__brand|flashcast-public-boot/.test(record.oldValue || '')) {
          foundBrand();
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, characterDataOldValue: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'id', 'role'] });
  });
}

export async function expectNoNavigationBrand(page: Page) {
  await expect(page.locator('.scheme-a-page-loader__brand, #flashcast-public-boot')).toHaveCount(0);
  await expect(page.locator('body')).toHaveAttribute('data-navigation-brand-insertions', '0');
}
