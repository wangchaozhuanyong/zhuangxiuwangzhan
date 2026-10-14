import { expect, test } from "@playwright/test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { expectNoNavigationBrand, expectPageNavigationBrand, observeNavigationBrand, protectPublicTestWrites } from './public-loader-audit';

const furnitureCatalog = JSON.parse(readFileSync(path.resolve("src/data/furnitureCatalog.json"), "utf8")) as {
  products: { slug: string; images: string[] }[];
};

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await protectPublicTestWrites(page); });
test.afterEach(async ({ page }) => { await page.unrouteAll({ behavior: "wait" }); });

const loader = ".scheme-a-page-loader--overlay";
const criticalImage = "#main-content img[data-critical-image='true']";

test('brand audit detects navigation-tagged branding inserted and removed within one frame', async ({ page }) => {
  await page.setContent('<main>Navigation audit fixture</main>');
  await observeNavigationBrand(page);
  for (const brandedMarkup of ['<div class="scheme-a-page-loader__brand" data-route-loader="navigation">FLASHCAST</div>', '<div role="status" data-route-loader="navigation"><strong>FLASH CAST</strong></div>']) {
    await page.evaluate(markup => {
      document.body.dataset.navigationBrandInsertions = '0';
      const container = document.createElement('div');
      container.innerHTML = markup;
      document.body.append(container);
      container.remove();
    }, brandedMarkup);
    await expect(page.locator('body')).not.toHaveAttribute('data-navigation-brand-insertions', '0');
    await observeNavigationBrand(page);
    await expectNoNavigationBrand(page);
  }
});

test('brand audit retains transient rewritten text after its feedback node is removed', async ({ page }) => {
  for (const update of ['textContent', 'characterData', 'detachedCharacterData']) {
    await page.setContent('<div id="audit-feedback" role="status">Loading</div>');
    await observeNavigationBrand(page);
    await page.evaluate(mode => {
      const feedback = document.getElementById('audit-feedback')!;
      if (mode === 'textContent') {
        feedback.textContent = 'FLASH CAST';
        feedback.textContent = 'Loading';
      } else {
        const text = feedback.firstChild as Text;
        text.data = 'FLASH CAST';
        if (mode === 'detachedCharacterData') text.remove();
        text.data = 'Loading';
      }
      feedback.remove();
    }, update);
    await expect(page.locator('body'), update).not.toHaveAttribute('data-navigation-brand-insertions', '0');
  }
});

test("does not hold a mobile product detail for offscreen gallery thumbnails", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // WebKit may request horizontally offscreen lazy images immediately. Hold a
  // real last-thumbnail request rather than assuming currentSrc stays empty.
  const product = furnitureCatalog.products.find((item) => item.slug === "ws-2102-wooden-bunk-bed-white")!;
  const offscreenImage = path.parse(product.images.at(-1)!).name;
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "image") return route.fallback();
    if (route.request().url().includes(offscreenImage)) await held;
    await route.fulfill({ path: path.join(process.cwd(), "public/logo-flashcast.png"), contentType: "image/png" });
  });
  try {
    await page.goto("/zh/furniture/product/ws-2102-wooden-bunk-bed-white", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".fc-furniture-gallery__main img")).toHaveAttribute("data-image-state", "loaded");
    const offscreenThumbnails = await page.locator(".fc-furniture-gallery__thumbs img").evaluateAll((images) =>
      images.filter((image) => image.getBoundingClientRect().left >= window.innerWidth && image.getAttribute("data-image-state") !== "loaded").length,
    );
    expect(offscreenThumbnails).toBeGreaterThan(0);
    await expect(page.locator(loader)).toBeHidden({ timeout: 3000 });
  } finally { release(); }
});

test("keeps initial branding unique, brands real page waits and leaves warmed navigation unbranded", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const initial = page.locator('[data-route-loader="initial"]');
  const navigation = page.locator('.public-route-feedback[data-route-loader="navigation"]');
  const ready = () => expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready", { timeout: 10_000 });
  const navLink = (href: string) => page.locator(`.scheme-a-chrome__primary a[href="${href}"]`).first();
  let releaseImages = () => {};
  let imagesReady = new Promise<void>((resolve) => { releaseImages = resolve; });
  let releaseAbout = () => {};
  const aboutReady = new Promise<void>((resolve) => { releaseAbout = resolve; });
  // Hold real dependencies instead of relying on an arbitrary delay or CMS data.
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "image") return route.fallback();
    await imagesReady;
    await route.continue();
  });
  await page.route(/\/(?:src\/pages\/About\.tsx|assets\/About-[^/]+\.js)(?:\?.*)?$/, async (route) => {
    await aboutReady;
    await route.continue();
  });
  try {
    await page.goto("/zh/services", { waitUntil: "domcontentloaded" });
    await expect(initial).toBeVisible();
    await expect(initial.locator(".scheme-a-page-loader__brand strong")).toHaveText("FLASHCAST");
    await expect(page.locator('.scheme-a-page-loader__brand')).toHaveCount(1);
    await expect(navigation).toHaveCount(0);
    await expect(page.locator(".public-route-feedback__pending")).toHaveCount(0);
    releaseImages();
    await ready();
    await expect(page.locator(loader)).toHaveCount(0);
    await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
    await expect(page.locator(".scheme-a-chrome__brand img").first()).toHaveAttribute("data-image-state", "loaded");

    imagesReady = new Promise<void>((resolve) => { releaseImages = resolve; });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(initial).toBeVisible();
    await expect(initial.locator(".scheme-a-page-loader__brand strong")).toHaveText("FLASHCAST");
    await expect(page.locator('.scheme-a-page-loader__brand')).toHaveCount(1);
    await expect(navigation).toHaveCount(0);
    await expect(page.locator(".public-route-feedback__pending")).toHaveCount(0);
    releaseImages();
    await ready();
    await expect(page.locator(loader)).toHaveCount(0);

    await page.locator(".scheme-a-chrome__nav-more").click();
    await page.locator('.scheme-a-directory a[href="/zh/about"]').click();
    await expect(page).toHaveURL(/\/zh\/about$/);
    await expectPageNavigationBrand(page);
    await expect(initial).toHaveCount(0);
    await expect(page.locator(".public-route-feedback__pending")).toHaveCount(0);
    // A real click must still reach the shared navigation while About is pending.
    await navLink("/zh/services").click();
    await expect(page).toHaveURL(/\/zh\/services$/);
    await ready();
    await expect(page.locator(loader)).toHaveCount(0);

    releaseAbout();
    await page.locator(".scheme-a-chrome__nav-more").click();
    await page.locator('.scheme-a-directory a[href="/zh/about"]').click();
    await expect(page).toHaveURL(/\/zh\/about$/);
    await ready();
    await expect(page.locator(loader)).toHaveCount(0);
    await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
    expect(await page.locator(criticalImage).evaluate((img: HTMLImageElement) => img.currentSrc && img.naturalWidth > 0)).toBeTruthy();

    // The real About page is now ready; audit cached POP and local language work.
    await observeNavigationBrand(page);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/zh\/services$/);
    await ready();
    await expect(page.locator(loader)).toHaveCount(0);
    await page.locator('.scheme-a-language-switch a[href="/en/services"]').first().click();
    await expect(page).toHaveURL(/\/en\/services$/);
    await ready();
    await expect(page.locator(loader)).toHaveCount(0);
    await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
    await expectNoNavigationBrand(page);
  } finally {
    releaseImages();
    releaseAbout();
  }
});

for (const width of [390, 1440]) {
test(`a real click during initial handoff never overlaps document and page brands at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const clicks: { bootState: string; href: string }[] = [];
    (window as unknown as { initialHandoffClicks: typeof clicks }).initialHandoffClicks = clicks;
    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (link?.getAttribute('href') === '/zh/materials') clicks.push({
        bootState: (window as unknown as { __flashcastPublicBoot?: { state: string } }).__flashcastPublicBoot?.state || '',
        href: link.getAttribute('href')!,
      });
    }, true);
  });
  let releaseImages = () => {};
  const imagesReady = new Promise<void>(resolve => { releaseImages = resolve; });
  let releaseData = () => {};
  const dataReady = new Promise<void>(resolve => { releaseData = resolve; });
  await page.route('**/*', async route => {
    if (route.request().resourceType() !== 'image') return route.fallback();
    await imagesReady;
    await route.continue();
  });
  await page.route('**/rest/v1/materials*', async route => { await dataReady; await route.continue(); });
  await page.route('**/rest/v1/site_pages*', async route => {
    if (new URL(route.request().url()).searchParams.get('page_key') !== 'eq.materials') return route.fallback();
    await dataReady;
    await route.continue();
  });
  try {
    await page.goto('/zh', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#flashcast-public-boot .scheme-a-page-loader__brand')).toBeVisible();
    await page.evaluate(() => {
      const audit = { stop: false, overlappingMutations: 0, blank: 0, frames: [] as { path: string; bootState: string; brands: number; sceneOpacity: number; coverOpacity: number }[] };
      (window as unknown as { initialHandoffAudit: typeof audit }).initialHandoffAudit = audit;
      const brandsIn = (node: Node) => node instanceof Element
        ? [...(node.matches('.scheme-a-page-loader__brand') ? [node] : []), ...node.querySelectorAll('.scheme-a-page-loader__brand')]
        : [];
      const activeBrands = new Set(document.querySelectorAll('.scheme-a-page-loader__brand'));
      new MutationObserver(records => {
        if (audit.stop) return;
        for (const record of records) {
          for (const node of record.removedNodes) for (const brand of brandsIn(node)) activeBrands.delete(brand);
          for (const node of record.addedNodes) {
            for (const brand of brandsIn(node)) activeBrands.add(brand);
            if (activeBrands.size > 1) audit.overlappingMutations++;
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
      const sample = () => {
        if (audit.stop) return;
        const scene = document.querySelector('.public-route-scene');
        const covers = [...document.querySelectorAll('#flashcast-public-boot, .public-route-feedback[data-feedback-scope="page"]')];
        const sceneOpacity = scene ? Number(getComputedStyle(scene).opacity) : 0;
        const coverOpacity = Math.max(0, ...covers.map(cover => Number(getComputedStyle(cover).opacity)));
        if (sceneOpacity < 0.01 && coverOpacity < 0.01) audit.blank++;
        audit.frames.push({ path: location.pathname,
          bootState: (window as unknown as { __flashcastPublicBoot?: { state: string } }).__flashcastPublicBoot?.state || '',
          brands: document.querySelectorAll('.scheme-a-page-loader__brand').length, sceneOpacity, coverOpacity });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    releaseImages();
    // Observe the real 420ms homepage handoff and issue an actual pointer click
    // immediately. No sleep, clock override or extended decorative animation.
    await page.waitForFunction(() => (window as unknown as { __flashcastPublicBoot?: { state: string } }).__flashcastPublicBoot?.state === 'handoff');
    await page.locator(`${width < 768 ? '.scheme-a-mobile-dock' : '.scheme-a-chrome__primary'} a[href="/zh/materials"]`).click();
    await expect(page).toHaveURL(/\/zh\/materials$/);
    expect(await page.evaluate(() => (window as unknown as { initialHandoffClicks: { bootState: string; href: string }[] }).initialHandoffClicks)).toEqual([{ bootState: 'handoff', href: '/zh/materials' }]);
    await expectPageNavigationBrand(page);
    expect(await page.evaluate(() => (window as unknown as { __flashcastPublicBoot?: { state: string } }).__flashcastPublicBoot?.state)).toBe('ready');
    releaseData();
    await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'ready', { timeout: 10_000 });
    await expect(page.locator('.scheme-a-page-loader__brand')).toHaveCount(0);
    const audit = await page.evaluate(() => {
      const audit = (window as unknown as { initialHandoffAudit: { stop: boolean; overlappingMutations: number; blank: number; frames: object[] } }).initialHandoffAudit;
      audit.stop = true;
      return audit;
    });
    expect(audit.frames.length).toBeGreaterThan(0);
    expect(audit.blank).toBe(0);
    expect(audit.overlappingMutations).toBe(0);
    for (const frame of audit.frames as { brands: number }[]) expect(frame.brands).toBeLessThanOrEqual(1);
    await info.attach('initial-handoff-brand-frames', { body: JSON.stringify(audit), contentType: 'application/json' });
  } finally { releaseImages(); releaseData(); }
});
}

test("supports both languages at the requested viewport widths", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["zh", "en"]) {
      await page.goto(`/${language}/about`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
      await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded");
      expect(await page.locator(criticalImage).evaluate((img: HTMLImageElement) => img.currentSrc && img.naturalWidth > 0)).toBeTruthy();
    }
  }
});

test("shows a visible retry state when a hero image fails", async ({ page }) => {
  await page.route("**/*", (route) => route.request().resourceType() === "image" && !route.request().url().includes("logo") ? route.abort() : route.fallback());
  await page.goto("/zh/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  await expect(page.locator("#main-content .smart-image-failure")).toBeVisible();
  await expect(page.locator("#main-content .smart-image-failure button")).toBeVisible();
  await page.unroute("**/*");
  await page.locator("#main-content .smart-image-failure button").click();
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded", { timeout: 10_000 });
});

test("requests deferred home media before it scrolls into view", async ({ page }) => {
  await page.goto("/zh", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeHidden({ timeout: 10_000 });
  const projectMedia = page.locator(".scheme-a-project__media .smart-image-placeholder").first();
  const image = projectMedia.locator("img.smart-image");
  await expect(image).toHaveCount(1);
  await projectMedia.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("loading", "eager");
  await expect(image).toHaveAttribute("data-image-state", "loaded", { timeout: 10_000 });
});

test("releases a slow hero to its placeholder and exposes single-image retry", async ({ page }) => {
  await page.route("**/*", (route) => { if (route.request().resourceType() !== "image" || route.request().url().includes("logo") || route.request().url().includes("image_retry=")) return route.fallback(); /* Hold only the original transfer; retry must reach the network. */ });
  await page.goto("/en/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator(loader)).toBeHidden({ timeout: 8_000 });
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loading");
  await expect(page.locator("#main-content .smart-image-slow button").first()).toBeVisible();
  await page.locator("#main-content .smart-image-slow button").first().click();
  await expect(page.locator(criticalImage)).toHaveAttribute("data-image-state", "loaded", { timeout: 10_000 });
  await page.unroute("**/*");
});

test("covers every navigation frame until the selected visible images have decoded", async ({ page }) => {
  await page.goto("/zh/services", { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-route-loader]")).toBeHidden();
  await page.route("**/rest/v1/site_pages*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("page_key") !== "eq.materials") return route.fallback();
    // This case controls image decoding, not live CMS content. Use the existing
    // row fields to avoid a fetch/fulfill race when a browser cancels prefetch.
    await route.fulfill({ status: 200, contentType: "application/json", json: [{
      page_key: "materials", path: "/materials", status: "published",
      image_url: "/images/heroes/v5/hero-materials-v5-desktop.webp",
    }] });
  });
  await page.route("**/images/**/hero-materials*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.evaluate(() => {
    document.body.dataset.emptyHeroFrames = "0";
    const sample = () => {
      const images = Array.from(document.querySelectorAll<HTMLImageElement>("#main-content img[data-critical-image='true']"));
      const exposed = document.querySelector(".public-route-content")?.getAttribute("aria-hidden") !== "true";
      const pending = images.some((img) => {
        const rect = img.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0
          && img.dataset.imageState !== "error"
          && (img.dataset.imageState !== "loaded" || img.dataset.decodedSrc !== img.currentSrc);
      });
      if (exposed && pending) document.body.dataset.emptyHeroFrames = String(Number(document.body.dataset.emptyHeroFrames) + 1);
      if (document.body.dataset.sampleNavigation !== "stop") requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator('a[href="/zh/materials"]').first().click();
  await expectPageNavigationBrand(page);
  await expect(page.locator('#flashcast-public-boot, [data-route-loader="initial"]')).toHaveCount(0);
  await expect(page.locator('[data-route-loader="navigation"]')).toBeHidden({ timeout: 15_000 });
  expect(await page.locator("body").getAttribute("data-empty-hero-frames")).toBe("0");
  await page.evaluate(() => { document.body.dataset.sampleNavigation = "stop"; });
  await observeNavigationBrand(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/zh\/services$/);
  await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'ready', { timeout: 15_000 });
  await page.goForward();
  await expect(page).toHaveURL(/\/zh\/materials$/);
  await expect(page.locator('.public-route-content')).toHaveAttribute('data-route-visual-state', 'ready', { timeout: 15_000 });
  await expectNoNavigationBrand(page);
});

test("keeps detail loading geometry stable until the first published data result", async ({ page }) => {
  for (const path of ["/zh/projects/corporate-office-petaling-jaya", "/zh/materials/acrylic-cabinet-gloss-white"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    let release = () => {};
    const pending = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/rest/v1/**", async (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) return route.fallback();
      await pending;
      await route.continue();
    });
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator('#main-content [data-route-pending="true"]')).toBeAttached();
      await expect(page.locator(loader)).toBeVisible();
      await expect(page.locator("main h1")).toHaveCount(0);
      const footerTop = await page.locator(".scheme-a-footer").evaluate((footer) => footer.getBoundingClientRect().top);
      expect(footerTop).toBeGreaterThanOrEqual(844);
      release();
      await expect(page.locator('[data-route-pending="true"]')).toHaveCount(0, { timeout: 20_000 });
      await expect(page.locator("main h1")).toBeVisible();
    } finally {
      release();
      await page.unroute("**/rest/v1/**");
    }
  }
});
