import { createServer, type Server } from "node:http";
import { contactEntryText } from "../src/i18n/contactEntryText";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type FormAction = "contact" | "quote";
type Signal = "success" | "error" | "expired" | "timeout";
type SdkSnapshot = {
  renders: { id: string; action: string; execution: string }[];
  executeCalls: string[];
  automaticExecutions: string[];
  duplicateExecutions: string[];
  removed: string[];
  connectedContainers: number;
};
type MockWindow = {
  __turnstileLifecycle: {
    snapshot: () => SdkSnapshot;
    signal: (signal: Signal, index?: number) => void;
  };
};

// These tests must target a local production-mode build with nonempty PUBLIC
// fixture configuration. Execution assertions intentionally fail if DEV bypasses
// verification or the build omits VITE_TURNSTILE_SITE_KEY.
// The deliberately invalid fixture API origin is outside production CSP. Only
// this local test disables CSP; production headers are never changed.
test.use({ bypassCSP: true });
const assertLocalUrl = (url: string) => {
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
};

test.beforeEach(({ baseURL }) => {
  expect(baseURL).toBeTruthy();
  assertLocalUrl(baseURL!);
});

// WebKit performs real CORS preflights before routing the mocked POST.
// The production-mode fixture uses http://127.0.0.1:65530 as its fake API.
let preflightServer: Server;
let fixtureFrontendOrigin = "";
let moduleGate: Promise<void> | null = null;
let releaseModule: (() => void) | null = null;
let servedPanelRequests = 0;
let servedQrRequests = 0;
let strictScriptFixture = false;
let failedAssetPrefix: string | null = null;
let forcedScriptFailures = 0;
const preloadRequests = new Map<string, number>();
let loopbackCounts = { submitCount: 0, verifiedSubmitCount: 0 };
test.beforeEach(() => {
  loopbackCounts = { submitCount: 0, verifiedSubmitCount: 0 };
  strictScriptFixture = false; failedAssetPrefix = null; forcedScriptFailures = 0; preloadRequests.clear();
});
test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) throw new Error("Local fixture URL required");
  assertLocalUrl(baseURL);
  fixtureFrontendOrigin = new URL(baseURL).origin;
  preflightServer = createServer(async (req, res) => {
    const origin = String(req.headers.origin || "http://127.0.0.1:65530");
    const path = new URL(req.url!, "http://fixture").pathname;
    if (req.method === "GET" && !path.startsWith("/rest/v1/") && !path.startsWith("/functions/")) {
      if (path.startsWith("/assets/") && /\.(?:js|css)$/.test(path)) preloadRequests.set(path, (preloadRequests.get(path) || 0) + 1);
      if (failedAssetPrefix && path.startsWith(`/assets/${failedAssetPrefix}`)) {
        failedAssetPrefix = null; forcedScriptFailures++;
        res.writeHead(503, { "Content-Type": path.endsWith(".css") ? "text/css" : "text/javascript", "Cache-Control": "no-store" });
        res.end("/* Intentional local recovery fixture */"); return;
      }
      if (/\/assets\/ContactEntryPanel-[^/]+\.js$/.test(path)) { servedPanelRequests++; if (moduleGate) await moduleGate; }
      if (path === "/images/contact/wechat-qr.webp") servedQrRequests++;
      const requested = new URL(req.url!, "http://fixture");
      const upstream = await fetch(new URL(requested.pathname + requested.search, fixtureFrontendOrigin));
      const headers: Record<string, string> = {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": strictScriptFixture && path.startsWith("/assets/") ? "public,max-age=31536000,immutable" : "no-store",
      };
      if (strictScriptFixture) headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'none'";
      res.writeHead(upstream.status, headers);
      res.end(Buffer.from(await upstream.arrayBuffer())); return;
    }
    const allowed = /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);
    if (!allowed) { res.writeHead(405); res.end(); return; }
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": String(req.headers["access-control-request-headers"] || "content-type,apikey,authorization,x-client-info"),
      "Content-Type": "application/json", "Cache-Control": "no-store",
    };
    if (req.method === "OPTIONS") { res.writeHead(204, headers); res.end(); return; }
    if (req.method === "POST" && path === "/functions/v1/submit-lead") {
      let text = "";
      for await (const chunk of req) text += chunk;
      let verified = false;
      try { verified = JSON.parse(text).turnstileToken === "synthetic-e2e-verification-value"; } catch { /* invalid synthetic request */ }
      loopbackCounts.submitCount++;
      if (verified) loopbackCounts.verifiedSubmitCount++;
      res.writeHead(verified ? 200 : 400, headers);
      res.end(JSON.stringify(verified ? { ok: true, id: "cf00cf00-1234-4234-8234-012345678901" } : { error: "Synthetic verification required" }));
      return;
    }
    if (path.startsWith("/rest/v1/") && (req.method === "GET" || req.method === "POST" && path === "/rest/v1/rpc/get_public_home_bundle")) {
      res.writeHead(200, headers); res.end(path.endsWith("/rpc/get_public_home_bundle") ? "{}" : "[]"); return;
    }
    res.writeHead(405); res.end();
  });
  await new Promise<void>((resolve, reject) => { preflightServer.once("error", reject); preflightServer.listen(65530, "127.0.0.1", resolve); });
});
test.afterEach(() => { releaseModule?.(); releaseModule = null; moduleGate = null; });
test.afterAll(async () => { if (preflightServer?.listening) await new Promise<void>((resolve, reject) => preflightServer.close(error => error ? reject(error) : resolve())); });

const networkFailures = new WeakMap<Page, { path: string; error: string | null }[]>();
test.beforeEach(({ page }) => {
  const failures: { path: string; error: string | null }[] = [];
  networkFailures.set(page, failures);
  page.on("requestfailed", request => failures.push({ path: new URL(request.url()).pathname, error: request.failure()?.errorText || null }));
});

const installSdkMock = async (page: Page) => {
  await page.addInitScript(() => {
    type Options = {
      action: string;
      execution?: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      "timeout-callback"?: () => void;
    };
    const widgets: { id: string; options: Options; container: HTMLElement; executing: boolean; removed: boolean }[] = [];
    const records: Omit<SdkSnapshot, "connectedContainers"> = {
      renders: [], executeCalls: [], automaticExecutions: [], duplicateExecutions: [], removed: [],
    };
    const target = window as unknown as MockWindow & {
      turnstile: {
        render: (container: HTMLElement, options: Options) => string;
        execute: (id: string) => void;
        remove: (id: string) => void;
      };
    };
    target.turnstile = {
      render(container, options) {
        const id = `synthetic-widget-${widgets.length + 1}`;
        const automatic = options.execution !== "execute";
        widgets.push({ id, options, container, executing: automatic, removed: false });
        records.renders.push({ id, action: options.action, execution: options.execution || "render" });
        if (automatic) records.automaticExecutions.push(id);
        return id;
      },
      execute(id) {
        records.executeCalls.push(id);
        const widget = widgets.find((entry) => entry.id === id);
        if (!widget || widget.removed) throw new Error("Synthetic SDK: unknown widget");
        if (widget.executing) {
          records.duplicateExecutions.push(id);
          console.warn("Synthetic SDK: widget is already executing");
          throw new Error("Synthetic SDK: widget is already executing");
        }
        widget.executing = true;
      },
      remove(id) {
        records.removed.push(id);
        const widget = widgets.find((entry) => entry.id === id);
        if (widget) widget.removed = true;
      },
    };
    target.__turnstileLifecycle = {
      snapshot: () => ({ ...records, connectedContainers: widgets.filter((widget) => widget.container.isConnected).length }),
      signal(signal, index = widgets.length - 1) {
        const widget = widgets[index];
        if (!widget) throw new Error("Synthetic SDK: no rendered widget");
        // Keep the callbacks after remove to exercise late SDK events.
        if (signal === "success") widget.options.callback("synthetic-e2e-verification-value");
        if (signal === "error") widget.options["error-callback"]();
        if (signal === "expired") widget.options["expired-callback"]();
        if (signal === "timeout") {
          if (!widget.options["timeout-callback"]) throw new Error("Synthetic SDK: timeout callback missing");
          widget.options["timeout-callback"]();
        }
      },
    };
  });
};

const snapshotSdk = (page: Page) => page.evaluate(() => (window as unknown as MockWindow).__turnstileLifecycle.snapshot());
const persistEvidence = async (info: TestInfo, name: string, evidence: unknown) => {
  const path = info.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(evidence, null, 2));
  await info.attach(name, { path, contentType: "application/json" });
};
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const sdk = await snapshotSdk(page).catch(() => undefined);
    if (sdk) await persistEvidence(info, "failed-sdk-evidence", sdk);
    await persistEvidence(info, "failed-network-evidence", networkFailures.get(page));
  }
});
const signalSdk = (page: Page, signal: Signal, index?: number) => page.evaluate(
  ({ signal, index }) => (window as unknown as MockWindow).__turnstileLifecycle.signal(signal, index),
  { signal, index },
);

const isolateRequests = async (page: Page) => {
  let submitCount = 0;
  let verifiedSubmitCount = 0;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS" && (url.pathname.includes("/functions/v1/") || url.pathname.includes("/rest/v1/"))) {
      await route.fulfill({ status: 204, headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type, apikey, authorization, x-client-info",
      } });
      return;
    }
    if (url.pathname.includes("/functions/v1/submit-lead")) {
      const body = request.postDataJSON() as { turnstileToken?: string };
      submitCount++;
      if (body.turnstileToken === "synthetic-e2e-verification-value") verifiedSubmitCount++;
      await route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, json: { ok: true, id: "cf00cf00-1234-4234-8234-012345678901" } });
      return;
    }
    if (url.pathname.includes("/rest/v1/")) {
      // The homepage RPC returns an object. An empty array would deliberately
      // activate the existing fallback notice and distort its layout screenshot.
      const json = url.pathname.endsWith("/rpc/get_public_home_bundle") ? { site_pages: [], hero_slides: [] } : [];
      await route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, json });
      return;
    }
    if (["flashcast.com.my", "www.flashcast.com.my"].includes(url.hostname)
      && request.resourceType() === "image" && url.pathname.startsWith("/logo-flashcast")) {
      const localUrl = new URL(`${url.pathname}${url.search}`, page.url());
      assertLocalUrl(localUrl.href);
      await route.fulfill({ response: await route.fetch({ url: localUrl.href }) });
      return;
    }
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      || url.pathname.includes("/functions/v1/")) {
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  return { counts: () => ({ submitCount: submitCount + loopbackCounts.submitCount, verifiedSubmitCount: verifiedSubmitCount + loopbackCounts.verifiedSubmitCount }) };
};

const gotoReady = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  assertLocalUrl(page.url());
  await expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready", { timeout: 20_000 });
};

const fillForm = async (page: Page, action: FormAction) => {
  await page.locator(`#${action}-name`).fill("Synthetic browser test");
  await page.locator(`#${action}-phone`).fill("+601100000000");
  if (action === "contact") {
    await page.locator("#contact-message").fill("Synthetic test. Request is intercepted locally; no customer record is written.");
  } else {
    await page.locator("#quote-location").fill("Synthetic fixture location");
    await page.locator("#quote-project-type").selectOption("Residential Renovation");
  }
};

const submitButton = (page: Page) => page.locator('form button[type="submit"]');
const assertSdkExecution = async (page: Page, action: FormAction, count: number) => {
  await expect.poll(async () => (await snapshotSdk(page)).executeCalls.length).toBe(count);
  const sdk = await snapshotSdk(page);
  expect(sdk.renders).toHaveLength(count);
  expect(sdk.renders.every((render) => render.action === action && render.execution === "execute"), JSON.stringify(sdk)).toBe(true);
  expect(sdk.automaticExecutions).toEqual([]);
  expect(sdk.duplicateExecutions).toEqual([]);
};
const assertSdkCleaned = async (page: Page, count: number) => {
  await expect.poll(async () => (await snapshotSdk(page)).connectedContainers).toBe(0);
  expect((await snapshotSdk(page)).removed).toHaveLength(count);
};

for (const language of ["zh", "en"] as const) for (const action of ["contact", "quote"] as const) {
  for (const outcome of ["success", "slow-success", "error", "expired", "timeout", "token-timeout"] as const) {
    test(`${language} ${action}: ${outcome} executes once, cleans up and preserves submission safety`, async ({ page }, info) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await installSdkMock(page);
      const requests = await isolateRequests(page);
      await gotoReady(page, `/${language}/${action}`);
      await fillForm(page, action);
      if (outcome === "token-timeout" || outcome === "slow-success") await page.clock.install();
      if (outcome === "success") await submitButton(page).dblclick();
      else await submitButton(page).click();
      await assertSdkExecution(page, action, 1);
      await expect(submitButton(page)).toBeDisabled();
      expect(requests.counts()).toEqual({ submitCount: 0, verifiedSubmitCount: 0 });

      // Exercise a second submit event while the real button is disabled.
      // Dispatch the event rather than requestSubmit(), which would also invoke
      // the browser's native document navigation when a locked handler returns.
      await page.locator("form").evaluate((form) => form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true })));
      await assertSdkExecution(page, action, 1);

      if (outcome === "token-timeout") {
        await page.clock.fastForward(30_001);
        await page.clock.resume();
      } else if (outcome === "slow-success") {
        await page.clock.fastForward(15_000);
        expect(requests.counts()).toEqual({ submitCount: 0, verifiedSubmitCount: 0 });
        await expect(submitButton(page)).toBeDisabled();
        await signalSdk(page, "success");
        await page.clock.resume();
      } else {
        await signalSdk(page, outcome);
      }
      await assertSdkCleaned(page, 1);
      const successTitle = action === "contact"
        ? (language === "zh" ? "信息已发送！" : "Message Sent!")
        : (language === "zh" ? "报价请求已提交！" : "Quote Request Submitted!");

      if (outcome === "success" || outcome === "slow-success") {
        await expect(page.getByRole("heading", { name: successTitle, exact: true })).toBeVisible();
        await signalSdk(page, "success", 0);
        await signalSdk(page, "error", 0);
        expect(requests.counts()).toEqual({ submitCount: 1, verifiedSubmitCount: 1 });
        await assertSdkCleaned(page, 1);
      } else {
        const error = action === "quote" ? page.locator("#quote-submit-error") : page.locator('main [role="alert"]');
        await expect(error).toContainText(language === "zh" ? "提交失败" : "Something went wrong");
        await expect(submitButton(page)).toBeEnabled();
        await expect(page.locator(`#${action}-name`)).toHaveValue("Synthetic browser test");
        await expect(page.locator(`#${action}-phone`)).toHaveValue("+601100000000");
        expect(requests.counts()).toEqual({ submitCount: 0, verifiedSubmitCount: 0 });
        await signalSdk(page, "success", 0);
        expect(requests.counts()).toEqual({ submitCount: 0, verifiedSubmitCount: 0 });
        await assertSdkCleaned(page, 1);

        await submitButton(page).click();
        await assertSdkExecution(page, action, 2);
        await expect(submitButton(page)).toBeDisabled();
        await signalSdk(page, "success");
        await assertSdkCleaned(page, 2);
        await expect.poll(() => requests.counts().submitCount).toBe(1);
        await expect(page.getByRole("heading", { name: successTitle, exact: true })).toBeVisible();
        expect(requests.counts()).toEqual({ submitCount: 1, verifiedSubmitCount: 1 });
      }
      await persistEvidence(info, "lifecycle-evidence", {
        language, action, outcome, sdk: await snapshotSdk(page), ...requests.counts(), submissionRequestsIntercepted: true,
        submissionTrigger: outcome === "success" ? "native-double-click" : "native-click",
        syntheticSecondSubmitEvent: true,
      });
      await page.screenshot({ path: info.outputPath("form-result.png") });
    });
  }
}

const chromeGeometry = (page: Page) => page.evaluate(() => {
  const geometry = (selector: string) => {
    const element = document.querySelector(selector);
    if (!(element instanceof HTMLElement)) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      right: innerWidth - rect.right, bottom: innerHeight - rect.bottom,
      position: style.position, display: style.display,
    };
  };
  return {
    floating: geometry(".fc-contact-entry"),
    floatingStack: geometry(".fc-contact-stack"),
    dock: geometry('[data-testid="mobile-bottom-dock"]'),
    navigation: geometry(".scheme-a-mobile-dock"),
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
  };
});

const viewports = [
  { width: 360, height: 844 }, { width: 390, height: 844 }, { width: 393, height: 852 },
  { width: 768, height: 1000 }, { width: 1024, height: 1000 }, { width: 1440, height: 1000 },
];
for (const language of ["zh", "en"] as const) for (const viewport of viewports) {
  test(`${language} ${viewport.width}x${viewport.height}: homepage/contact/quote retain shared navigation and floating geometry`, async ({ page, browser }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installSdkMock(page);
    await isolateRequests(page);
    const baselineUrl = process.env.TURNSTILE_LAYOUT_BASELINE_URL;
    if (baselineUrl) assertLocalUrl(baselineUrl);
    const baselineContext = baselineUrl ? await browser.newContext({ viewport, reducedMotion: "reduce", bypassCSP: true }) : undefined;
    const baseline = baselineContext ? await baselineContext.newPage() : undefined;
    if (baseline) {
      await installSdkMock(baseline);
      await isolateRequests(baseline);
    }
    try {
      const evidence = [];
      for (const route of ["", "/contact", "/quote"]) {
        const path = `/${language}${route}`;
        await gotoReady(page, path);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        const floating = page.locator(".fc-contact-entry");
        await expect(floating).toBeVisible();
        const before = await chromeGeometry(page);
        expect(before.horizontalOverflow).toBe(false);
        expect(before.floatingStack?.position).toBe("fixed");
        expect(before.floating?.right).toBeGreaterThanOrEqual(16);
        expect(before.floating?.width).toBeGreaterThanOrEqual(44);
        expect(before.floating?.height).toBeGreaterThanOrEqual(48);
        await expect(floating).toHaveAttribute("aria-haspopup", "dialog");
        if (viewport.width < 768) {
          await expect(page.getByTestId("mobile-bottom-dock")).toHaveAttribute("data-mode", "navigation");
          await expect(page.locator(".scheme-a-mobile-dock")).toBeVisible();
          expect(before.dock?.width).toBe(viewport.width);
          expect(before.dock?.height).toBe(68);
          expect(before.dock?.bottom).toBe(0);
          expect(before.floating?.bottom).toBe(84);
          expect(before.floating?.right).toBe(16);
          expect(before.floating!.bottom).toBeGreaterThan(before.dock!.height);
        } else {
          await expect(page.getByTestId("mobile-bottom-dock")).not.toBeVisible();
        }
        if (baseline) {
          await gotoReady(baseline, new URL(path, baselineUrl).href);
          await baseline.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await expect(baseline.locator(".fc-contact-entry")).toBeVisible();
          expect(before).toEqual(await chromeGeometry(baseline));
          await baseline.screenshot({ path: info.outputPath(`before-${route.slice(1) || "home"}.png`) });
        }
        await page.screenshot({ path: info.outputPath(`after-${route.slice(1) || "home"}.png`) });
        evidence.push({ route: path, geometry: before, exactBaselineCompared: Boolean(baseline) });
      }
      await persistEvidence(info, "layout-evidence", evidence);
    } finally {
      await baselineContext?.close();
    }
  });
}


for (const [language, width] of [["zh", 1440], ["en", 390], ["ms", 390]] as const) {
  test(`${language} ${width}: deferred contact panel loads on demand and restores focus`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 852 });
    await installSdkMock(page);
    await isolateRequests(page);
    let release!: () => void;
    servedPanelRequests = 0;
    servedQrRequests = 0;
    moduleGate = new Promise<void>(resolve => { release = resolve; releaseModule = resolve; });
    await gotoReady(page, `http://127.0.0.1:65530/${language}/contact`);
    expect(servedPanelRequests).toBe(0);
    expect(servedQrRequests).toBe(0);
    const trigger = page.locator(".fc-contact-entry");
    await trigger.dblclick();
    await expect(trigger).toHaveAttribute("aria-busy", "true");
    await expect(trigger).toHaveText(contactEntryText[language].loading);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    release();
    moduleGate = null;
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(servedPanelRequests).toBe(1);
    await expect.poll(() => servedQrRequests).toBe(1);
    await expect(dialog).toContainText(contactEntryText[language].title);
    await page.screenshot({ path: info.outputPath("contact-panel-open.png") });
    await dialog.getByRole("button", { name: contactEntryText[language].close, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await persistEvidence(info, "focus-diagnostic", await page.evaluate(() => ({
      active: document.activeElement?.outerHTML.slice(0, 400),
      stack: document.querySelector(".fc-contact-stack")?.outerHTML.slice(0, 700),
      viewport: { height: innerHeight, visual: visualViewport?.height },
      overlays: document.querySelectorAll("[data-dialog-overlay]").length,
    })));
    await expect(trigger).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/${language}/contact$`));
  });
}


test.describe("regular script hints with native browser caching", () => {
  // This local policy blocks external frames, collectors and writes while keeping
  // the HTTP cache enabled. Request routing would disable that cache in Playwright.
  test.use({ bypassCSP: false });
  for (const language of ["en", "zh", "ms"] as const) {
    test(`${language}: warm hints reuse scripts and survive native reload`, async ({ page }) => {
      strictScriptFixture = true;
      await installSdkMock(page);
      await page.addInitScript(() => window.addEventListener("public-route-ready", () => performance.mark("fixture-route-ready"), { once: true }));
      await gotoReady(page, `http://127.0.0.1:65530/${language}`);
      const hints = page.locator('head link[data-public-route-script]');
      await expect(hints).toHaveCount(language === "ms" ? 3 : 2);
      expect(await hints.evaluateAll(links => links.every(link => link.getAttribute("rel") === "preload" && link.getAttribute("as") === "script" && link.getAttribute("crossorigin") === "anonymous"))).toBe(true);
      await expect(page.locator('head link[rel="modulepreload"][href*="public-home-route-"]')).toHaveCount(0);
      const styleHint = page.locator('head link[data-public-route-style]');
      await expect(styleHint).toHaveCount(1);
      await expect(styleHint).toHaveAttribute("rel", "preload");
      await expect(styleHint).toHaveAttribute("as", "style");
      const urls = await page.locator('head link[data-public-route-script],head link[data-public-route-style]').evaluateAll(links => links.map(link => new URL((link as HTMLLinkElement).href).pathname));
      for (const url of urls) expect(preloadRequests.get(url)).toBe(1);
      await expect.poll(() => page.evaluate(() => Boolean(document.querySelector<HTMLLinkElement>('link[data-public-fonts]')?.sheet))).toBe(true);
      const fontTiming = await page.evaluate(() => ({
        ready: performance.getEntriesByName("fixture-route-ready")[0]?.startTime,
        font: performance.getEntriesByType("resource").find(entry => new URL(entry.name).pathname.includes("/fonts/noto-public-glyphs-"))?.startTime,
      }));
      expect(fontTiming.ready).toBeGreaterThan(0);
      expect(fontTiming.font).toBeGreaterThanOrEqual(fontTiming.ready!);
      const heading = await page.locator("main h1").innerText();
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready");
      await expect(page.locator("main h1")).toHaveText(heading);
    });
    for (const prefix of language === "ms" ? ["public-home-route-", "malayContent-", "public-pages-"] : ["public-home-route-", "public-pages-"]) {
      test(`${language}: native reload recovers after failed ${prefix} preload`, async ({ page }) => {
        strictScriptFixture = true;
        await installSdkMock(page);
        failedAssetPrefix = prefix;
        await page.goto(`http://127.0.0.1:65530/${language}`, { waitUntil: "domcontentloaded" });
        await expect.poll(() => forcedScriptFailures).toBe(1);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready", { timeout: 20_000 });
        await expect(page.locator("main h1")).toBeVisible();
        expect(forcedScriptFailures).toBe(1);
      });
    }
  }
});
