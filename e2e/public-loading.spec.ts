import { expect, test, type Page } from "@playwright/test";

// First-paint evidence must not wait for optional web fonts (or document load).
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = "1";

type Glyph = { color: string; fill: string; stroke: string; adaptive: boolean; optedIn: boolean };
type Frame = { time: number; boot: string; brand: number; rootVisible: boolean; state: string; glyphs: Record<string, Glyph> };

async function startFrames(page: Page) {
  await page.addInitScript(() => {
    const state = { frames: [] as Frame[], ready: 0, layout: 0, stop: false };
    (window as unknown as { loadingAudit: typeof state }).loadingAudit = state;
    window.addEventListener("public-route-ready", () => state.ready++);
    window.addEventListener("public-route-layout", () => state.layout++);
    const sample = () => {
      if (state.stop) return;
      const root = document.getElementById("root");
      const glyphs: Record<string, Glyph> = {};
      for (const [key, selector] of Object.entries({
        nav: ".scheme-a-chrome__primary a", title: "#main-content h1",
        quote: ".scheme-a-chrome__quote", heroQuote: ".scheme-a-hero .scheme-a-button--paper",
        photoLead: ".scheme-a-hero__lead,.fcd-design-hero__lead",
        brandText: "#flashcast-public-boot strong em",
      })) {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element || element.closest(".public-route-retained")) continue;
        const css = getComputedStyle(element);
        if (css.visibility !== "visible") continue;
        glyphs[key] = { color: css.color, fill: css.getPropertyValue("-webkit-text-fill-color") || css.color,
          stroke: css.getPropertyValue("-webkit-text-stroke"), adaptive: element.hasAttribute("data-adaptive-contrast"), optedIn: element.hasAttribute("data-adaptive-text") };
      }
      const brand = Array.from(document.querySelectorAll<HTMLElement>("[data-route-loader='initial']")).filter((node) =>
        getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden").length;
      state.frames.push({ time: Math.round(performance.now()), boot: document.documentElement.dataset.publicBoot || "",
        brand, rootVisible: !!root && getComputedStyle(root).visibility === "visible" && !!root.firstElementChild,
        state: document.querySelector<HTMLElement>("[data-route-visual-state]")?.dataset.routeVisualState || "", glyphs });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function auditFrames(page: Page, label: string) {
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator("[data-route-visual-state]")).toHaveAttribute("data-route-visual-state", "ready");
  await page.waitForTimeout(250);
  const audit = await page.evaluate(() => {
    const state = (window as unknown as { loadingAudit: { frames: Frame[]; ready: number; layout: number; stop: boolean } }).loadingAudit;
    state.stop = true;
    return { ...state, timeOrigin: performance.timeOrigin,
      paintTiming: performance.getEntriesByType("paint").map((entry) => ({ name: entry.name, startTime: entry.startTime })) };
  });
  expect(audit.ready, label).toBe(1);
  expect(audit.layout, label).toBe(1);
  for (const frame of audit.frames) {
    if (["waiting", "timeout"].includes(frame.boot)) expect(frame.brand, label + " first head/body paint").toBe(1);
  }
  const painted = audit.frames.filter((frame) => frame.brand || frame.rootVisible);
  expect(painted.length, label).toBeGreaterThan(1);
  expect(painted[0].brand, label + " first document frame").toBe(1);
  let completed = false;
  const colors = new Map<string, Set<string>>();
  for (const frame of painted) {
    expect(frame.brand, label + " duplicate brand").toBeLessThanOrEqual(1);
    if (!frame.brand && frame.rootVisible) completed = true;
    if (completed) expect(frame.brand, label + " reopened brand").toBe(0);
    if (["waiting", "timeout"].includes(frame.boot)) expect(frame.rootVisible, label + " exposed destination").toBe(false);
    for (const [key, glyph] of Object.entries(frame.glyphs)) {
      expect(glyph.fill, label + " " + key + " glyph fill").toBe(glyph.color);
      if (!glyph.optedIn) {
        expect(glyph.adaptive, label + " fixed theme " + key).toBe(false);
      }
      if (!colors.has(key)) colors.set(key, new Set());
      colors.get(key)!.add([glyph.color, glyph.fill, glyph.stroke].join("|"));
    }
  }
  for (const [key, values] of colors) expect(values.size, label + " " + key + " color changes: " + [...values].join(", ")).toBe(1);
  return audit;
}

test.beforeEach(async ({ page }) => {
  // Local fault tests must never write analytics/error records to live CMS.
  await page.route("**/rest/v1/**", (route) =>
    route.request().method() === "GET" || route.request().url().includes("/rpc/")
      ? route.continue() : route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
});

test("prepaints the brand before entry JS or CSS, then hands off the same DOM once", async ({ page }, info) => {
  const compositor = await page.context().newCDPSession(page);
  const paints: { data: string; timestamp: number }[] = [];
  compositor.on("Page.screencastFrame", (event) => {
    // A queued acknowledgment can race with browser teardown after recording.
    void compositor.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
    if (new URL(page.url()).pathname === "/zh") paints.push({ data: event.data, timestamp: event.metadata.timestamp });
  });
  await compositor.send("Page.startScreencast", { format: "jpeg", quality: 80, everyNthFrame: 1 });
  await startFrames(page);
  let release!: () => void;
  const entry = new Promise<void>((resolve) => release = resolve);
  await page.route("**/assets/index-*.js", async (route) => { await entry; await route.continue(); });
  await page.goto("/zh", { waitUntil: "commit" });
  await expect(page.locator("#flashcast-public-boot")).toBeVisible();
  await expect(page.locator("#root")).toBeEmpty();
  const screen = await page.locator("#flashcast-public-boot").evaluate((node) => {
    node.setAttribute("data-test-original", "true");
    const evidence = { seen: false, sameNode: false, count: 0 };
    (window as unknown as { bootHandoffEvidence: typeof evidence }).bootHandoffEvidence = evidence;
    const observer = new MutationObserver(() => {
      if (node.getAttribute("data-boot-state") !== "handoff") return;
      evidence.seen = true;
      evidence.sameNode = document.getElementById("flashcast-public-boot") === node;
      evidence.count = document.querySelectorAll("[data-route-loader='initial']").length;
      observer.disconnect();
    });
    observer.observe(node, { attributes: true, attributeFilter: ["data-boot-state"] });
    return node.textContent;
  });
  expect(screen).toContain("FLASH");
  try { await page.screenshot({ path: info.outputPath("01-brand-before-react.png"), timeout: 5000 }); }
  finally { release(); }
  // Persist the 240ms handoff observation: locator polling can miss the whole
  // phase after a real network request without any application regression.
  await page.waitForFunction(() => (window as unknown as { bootHandoffEvidence: { seen: boolean } }).bootHandoffEvidence.seen,
    undefined, { timeout: 15_000 });
  expect(await page.evaluate(() => (window as unknown as { bootHandoffEvidence: unknown }).bootHandoffEvidence))
    .toEqual({ seen: true, sameNode: true, count: 1 });
  await page.screenshot({ path: info.outputPath("02-single-handoff.png") });
  const audit = await auditFrames(page, "prepaint");
  const firstPaint = audit.paintTiming.find((entry) => entry.name === "first-paint");
  const firstContent = audit.paintTiming.find((entry) => entry.name === "first-contentful-paint");
  expect(firstContent).toBeDefined();
  expect(firstPaint?.startTime, "the first document paint already contains the brand").toBe(firstContent?.startTime);
  await page.screenshot({ path: info.outputPath("03-ready.png") });
  await compositor.send("Page.stopScreencast");
  compositor.removeAllListeners("Page.screencastFrame");
  await compositor.detach();
  expect(paints.length).toBeGreaterThan(3);
  for (const [index, paint] of paints.entries()) await info.attach(`paint-${String(index + 1).padStart(3, "0")}.jpg`, { body: Buffer.from(paint.data, "base64"), contentType: "image/jpeg" });
  await info.attach("paint-timestamps", { body: JSON.stringify(paints.map(({ timestamp }) => timestamp)), contentType: "application/json" });
  await info.attach("frames", { body: JSON.stringify(audit, null, 2), contentType: "application/json" });
});

const routes = ["", "/about", "/services", "/services/design", "/services/surface-repair", "/projects", "/materials", "/furniture",
  "/furniture/product/ws-2102-wooden-bunk-bed-white", "/blog", "/quote", "/contact", "/faq", "/process",
  "/locations", "/promotions", "/before-after", "/privacy", "/loading-audit-missing-page"];
for (const width of [360, 390, 768, 1024, 1440]) for (const language of ["zh", "en"]) {
  test(`${language} ${width}px route families keep one handoff and stable glyph fills`, async ({ page }, info) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height: 900 });
    await startFrames(page);
    const results: Record<string, unknown> = {};
    for (const route of routes) {
      const path = `/${language}${route}`;
      await page.goto(path, { waitUntil: "domcontentloaded" });
      results[path] = await auditFrames(page, path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), path).toBeLessThanOrEqual(1);
    }
    await info.attach("route-frame-matrix", { body: JSON.stringify(results), contentType: "application/json" });
  });
}

test("managed detail waits for its own data, exposes recovery and invalidates stale attempts", async ({ page }) => {
  let release!: () => void;
  const response = new Promise<void>((resolve) => release = resolve);
  await page.route("**/rest/v1/materials**", async (route) => {
    if (!route.request().url().includes("slug=eq.loading-audit-chair")) return route.fallback();
    await response;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      id: "loading-audit-chair", slug: "loading-audit-chair", category: "furniture", subcategory: "dining",
      title_en: "Loading audit chair", title_zh: "加载验证餐椅", excerpt_en: "Local fault fixture",
      content_en: "Local test content", image_url: "/logo-flashcast.png", price_mode: "quote",
    }) });
  });
  await page.route("**/rest/v1/material_images**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await startFrames(page);
  await page.goto("/en/furniture/product/loading-audit-chair", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#flashcast-public-boot")).toBeVisible();
  await expect(page.locator("[data-boot-recovery]")).toBeVisible({ timeout: 7_000 });
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.locator("[data-boot-recovery]")).toBeHidden();
  release();
  await auditFrames(page, "managed detail retry");
  await expect(page.locator("#main-content h1")).toContainText("Loading audit chair");
});

test("font delays and background refresh cannot reopen the completed initial loader", async ({ page }) => {
  await startFrames(page);
  await page.route("**/fonts.googleapis.com/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ contentType: "text/css", body: "/* delayed optional font CSS */" });
  });
  await page.goto("/en/about", { waitUntil: "domcontentloaded" });
  await auditFrames(page, "delayed fonts");
  await page.evaluate(() => {
    (window as unknown as { loadingAudit: { stop: boolean } }).loadingAudit.stop = false;
    document.fonts.dispatchEvent(new Event("loadingdone"));
    window.dispatchEvent(new Event("focus"));
  });
  await page.waitForTimeout(300);
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
});

test("photo copy and solid actions keep stable design colors without glyph outlines", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const language of ["zh", "en"]) for (const service of ["design", "surface-repair"]) {
    await page.goto(`/${language}/services/${service}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0, { timeout: 15_000 });
    const heading = page.locator("#main-content h1");
    await expect(heading).not.toHaveAttribute("data-adaptive-contrast");
    for (const selector of ["#main-content h1", ".fcd-design-hero__lead", ".fcd-design-hero__primary", ".scheme-a-chrome__quote"]) {
      const glyph = await page.locator(selector).evaluate((element) => {
        const css = getComputedStyle(element);
        return { color: css.color, fill: css.getPropertyValue("-webkit-text-fill-color"), adaptive: element.hasAttribute("data-adaptive-contrast"), shadow: css.textShadow, stroke: css.webkitTextStrokeWidth };
      });
      expect(glyph.fill).toBe(glyph.color);
      expect(glyph.adaptive).toBe(false);
      if (selector.endsWith("__quote")) expect(glyph.shadow).toBe("none");
      else expect(glyph.shadow).toBe("rgba(0, 0, 0, 0.75) 0px 1px 4px, rgba(0, 0, 0, 0.35) 0px 0px 12px");
      expect(glyph.stroke).toBe("0px");
    }
    if (language === "zh" && service === "design") await page.screenshot({ path: info.outputPath("04-photo-copy-and-solid-actions.png") });
  }
});

test("continuing a slow request is explicitly degraded and late data cannot repeat readiness", async ({ page }) => {
  let release!: () => void;
  const response = new Promise<void>((resolve) => release = resolve);
  await page.route("**/rest/v1/materials**", async (route) => {
    if (!route.request().url().includes("slug=eq.loading-audit-degraded")) return route.fallback();
    await response;
    await route.fulfill({ json: { id: "local-degraded", slug: "loading-audit-degraded", category: "furniture",
      subcategory: "dining", title_en: "Degraded recovery chair", title_zh: "降级恢复餐椅",
      excerpt_en: "Local fixture", image_url: "/logo-flashcast.png", price_mode: "quote" } });
  });
  await page.route("**/rest/v1/material_images**", (route) => route.fulfill({ json: [] }));
  await startFrames(page);
  try {
    await page.goto("/en/furniture/product/loading-audit-degraded", { waitUntil: "domcontentloaded" });
    const proceed = page.locator('[data-boot-action="continue"]');
    await expect(proceed).toBeVisible({ timeout: 7_000 });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(proceed).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".public-route-content:has(> #main-content)")).toHaveAttribute("data-route-visual-state", "degraded");
    await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
    await expect(page.locator("#main-content")).toBeFocused();
    release();
    await expect(page.locator("#main-content h1")).toHaveText("Degraded recovery chair");
    await page.waitForTimeout(300);
    await expect(page.locator(".public-route-content:has(> #main-content)")).toHaveAttribute("data-route-visual-state", "degraded");
    await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { loadingAudit: { ready: number } }).loadingAudit.ready)).toBe(1);
  } finally { release(); }
});

for (const asset of ["css", "entry-js", "route-chunk"]) {
  test(`${asset} failure keeps an accessible recovery entry`, async ({ page }) => {
    await page.route("**/assets/**", (route) => {
      const url = route.request().url();
      const fail = asset === "css" ? url.endsWith(".css") : asset === "entry-js"
        ? /\/index-[^/]+\.js$/.test(url) : /\/About-[^/]+\.js$/.test(url);
      return fail ? route.abort() : route.continue();
    });
    await page.goto("/en/about", { waitUntil: "domcontentloaded" });
    if (asset === "route-chunk") {
      await expect(page.locator("#flashcast-public-boot")).toBeHidden({ timeout: 15_000 });
      await expect(page.locator("#main-content button")).toBeVisible();
    } else {
      await expect(page.locator("#flashcast-public-boot")).toBeVisible();
      const retry = page.locator('[data-boot-action="retry"]');
      await expect(retry).toBeVisible({ timeout: 7_000 });
      await page.keyboard.press("Tab");
      await expect(retry).toBeFocused();
    }
    await page.unroute("**/assets/**");
    await (asset === "route-chunk" ? page.locator("#main-content button") : page.locator('[data-boot-action="retry"]')).click();
    await expect(page.locator("#flashcast-public-boot")).toBeHidden({ timeout: 15_000 });
    await expect(page.locator("#main-content h1")).toBeVisible();
  });
}

test("admin refresh is isolated from public theme, loader and adaptive color ownership", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-public-theme");
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
  await expect(page.locator("[data-adaptive-contrast]")).toHaveCount(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator("html")).not.toHaveAttribute("data-public-theme");
});

test("CMS primary content stays covered until its declared data arrives", async ({ page }) => {
  await page.route("**/rest/v1/cms_pages**", async (route) => {
    if (!route.request().url().includes("path=eq.%2Floading-audit-cms")) return route.fallback();
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.fulfill({ json: [{ id: "local-audit-cms", path: "/loading-audit-cms", title_en: "CMS loading audit",
      title_zh: "CMS 加载验证", description_en: "Local fixture", cms_sections: [] }] });
  });
  await startFrames(page);
  await page.goto("/en/loading-audit-cms", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#flashcast-public-boot")).toBeVisible();
  await auditFrames(page, "CMS critical content");
  await expect(page.locator("#main-content h1")).toHaveText("CMS loading audit");
});

test("refresh, back, language, listing filters and anchors do not create another brand layer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startFrames(page);
  await page.goto("/zh/furniture", { waitUntil: "domcontentloaded" });
  await auditFrames(page, "listing initial");
  await page.reload({ waitUntil: "domcontentloaded" });
  await auditFrames(page, "listing reload");
  await page.locator('a[href="/zh/furniture/bedroom"]:visible').first().click();
  await expect(page).toHaveURL(/\/zh\/furniture\/bedroom$/);
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
  await expect(page.locator(".public-route-content:has(> #main-content)")).toHaveAttribute("data-route-visual-state", "ready");
  await page.locator('#main-content .fc-furniture-pagination a[href$="?page=2"]').click();
  await expect(page).toHaveURL(/\/zh\/furniture\/bedroom\?page=2$/);
  await expect(page.locator(".public-route-content:has(> #main-content)")).toHaveAttribute("data-route-visual-state", "ready");
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/zh\/furniture\/bedroom$/);
  await expect(page.locator(".public-route-content:has(> #main-content)")).toHaveAttribute("data-route-visual-state", "ready");
  await page.goBack();
  await expect(page).toHaveURL(/\/zh\/furniture$/);
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
  await page.locator('header .scheme-a-language-switch a[href="/en/furniture"]').click();
  await expect(page).toHaveURL(/\/en\/furniture$/);
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
  await page.getByRole("button", { name: "Open the complete site directory", exact: true }).click();
  await page.locator('.scheme-a-directory__foot a[href="/en/quote#quote-form"]').click();
  await expect(page).toHaveURL(/\/en\/quote#quote-form$/);
  await expect(page.locator("#quote-form")).toBeVisible();
  await expect(page.locator("[data-route-loader='initial']")).toHaveCount(0);
});

test("no JavaScript keeps the middleware's readable page summary visible", async ({ page, browser }, info) => {
  const html = await (await page.request.get("/zh")).text();
  test.skip(!html.includes("<noscript"), "Run against the Pages middleware preview for readable HTML.");
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: info.project.use.baseURL });
  try {
    const noScript = await context.newPage();
    await noScript.goto("/zh", { waitUntil: "domcontentloaded" });
    await expect(noScript.locator("noscript h1")).toBeVisible();
    await expect(noScript.locator("#flashcast-public-boot")).toBeHidden();
  } finally { await context.close(); }
});
