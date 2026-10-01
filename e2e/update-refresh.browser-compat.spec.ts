import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// Build the old and repaired sources with legacy-old / candidate-before /
// candidate-after versions, then pass their parent directory as REFRESH_BUILD_ROOT.
const buildRoot = process.env.REFRESH_BUILD_ROOT;
const versions = ["legacy-old", "candidate-before", "candidate-after"];
const folders = ["legacy-dist", "current-dist", "next-dist"];
let server: Server;
let origin: string;
let phase = 1;
let slowDocument = false;
let pendingModules = 0;
let versionRequests = 0;
let serviceChunk: string;
let missingServiceChunk = false;
let networkUnavailable = false;
let documentId = 0;
let serverResponses: { url: string; status: number; at: number }[] = [];

const mime = (file: string) => ({ ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2" }[path.extname(file)] || "application/octet-stream");

test.skip(!buildRoot, "Requires three real production builds via REFRESH_BUILD_ROOT.");
test.beforeAll(async () => {
  const roots = folders.map((folder) => path.join(buildRoot!, folder));
  for (const root of roots) expect(existsSync(path.join(root, "index.html"))).toBe(true);
  serviceChunk = readdirSync(path.join(roots[1], "assets")).find((file) => /^ServiceDetail-.*\.js$/.test(file))!;
  expect(serviceChunk).toBeTruthy();
  server = createServer((req, res) => {
    res.on("finish", () => serverResponses.push({ url: req.url!, status: res.statusCode, at: Date.now() }));
    if (networkUnavailable) { req.socket.destroy(); return; }
    const url = new URL(req.url!, "http://fixture");
    // Fault the actual server response, including requests made through the unchanged Worker.
    if (missingServiceChunk && /^\/assets\/ServiceDetail-[^/]+\.js$/.test(url.pathname) && !url.search) {
      res.writeHead(404, { "Content-Type": "text/javascript", "Cache-Control": "no-store" });
      res.end("");
      return;
    }
    if (url.pathname === "/__flashcast/version") {
      versionRequests++;
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ deploymentVersion: versions[phase], contentVersion: "" }));
      return;
    }
    const relative = url.pathname === "/offline" ? "offline.html" : url.pathname.slice(1);
    let file = path.join(roots[phase], relative);
    if (url.pathname.startsWith("/assets/") && !existsSync(file)) {
      file = roots.map((root) => path.join(root, relative)).find(existsSync) || file;
    }
    const document = !path.extname(relative) && relative !== "offline";
    if (document) file = path.join(roots[phase], "index.html");
    const respond = () => {
      if (res.destroyed) return;
      if (!existsSync(file)) { res.writeHead(404, { "Cache-Control": "no-store" }); res.end("Missing file"); return; }
      let body = readFileSync(file);
      if (document) body = Buffer.from(body.toString().replace("<head>", `<head><meta name="fixture-build" content="${versions[phase]}"><meta name="fixture-document" content="${++documentId}">`));
      res.writeHead(200, { "Content-Type": mime(file), "Cache-Control": "no-store" });
      res.end(body);
    };
    if (url.searchParams.has("pending-import")) { pendingModules++; setTimeout(respond, 8_000); }
    else if (document && slowDocument) setTimeout(respond, 2_000);
    else respond();
  });
  await new Promise<void>((resolve) => server.listen(0, "::1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Fixture port unavailable");
  origin = `http://[::1]:${address.port}`;
});
test.afterAll(async () => {
  server?.closeAllConnections();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
});
test.beforeEach(async ({ context }) => {
  phase = 1; slowDocument = false; pendingModules = 0; versionRequests = 0; missingServiceChunk = false; networkUnavailable = false;
  serverResponses = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === "127.0.0.1" && url.port === "65530") {
      const headers = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS", "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info,accept-profile,prefer" };
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers, body: "" });
      if (route.request().method() === "GET") return route.fulfill({ status: 200, headers, contentType: "application/json", body: "[]" });
    }
    return route.abort();
  });
});

async function ready(page: Page, version = versions[phase]) {
  await expect(page.locator('meta[name="fixture-build"]')).toHaveAttribute("content", version);
  await expect.poll(() => page.evaluate(() => document.readyState)).toBe("complete");
  await expect(page.locator("main").first()).toBeVisible();
  await expect(page.locator(".public-update-notice")).toHaveCount(0);
}
async function pendingImport(page: Page) {
  const before = pendingModules;
  await page.evaluate((chunk) => { void import(`/assets/${chunk}?pending-import=${Math.random()}`); }, serviceChunk);
  await expect.poll(() => pendingModules).toBeGreaterThan(before);
}
function documentRequests(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) urls.push(request.url());
  });
  return urls;
}
async function noAutomaticRecovery(page: Page) {
  expect(new URL(page.url()).searchParams.has("__flashcast_refresh")).toBe(false);
  expect(await page.evaluate(() => sessionStorage.getItem("flashcast:chunk-load-recovery"))).toBeNull();
}
async function missingRouteAndRetry(page: Page, language: "zh" | "en") {
  const assetResponses: string[] = [];
  const errors: string[] = [];
  page.on("response", (response) => { if (response.url().includes("/assets/ServiceDetail-")) assetResponses.push(`${response.status()} ${response.url()}`); });
  page.on("pageerror", (error) => errors.push(error.message));
  missingServiceChunk = true;
  const documents = documentRequests(page);
  await page.goto(`${origin}/${language}/services/design`, { waitUntil: "load" });
  const title = language === "zh" ? "页面加载失败，请刷新重试" : "Page files could not load. Please refresh and try again.";
  const button = page.getByRole("button", { name: language === "zh" ? "刷新页面" : "Refresh page", exact: true });
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(button).toBeVisible();
  await page.waitForTimeout(600); // Observe the old immediate auto-recovery window.
  expect(documents).toHaveLength(1);
  await noAutomaticRecovery(page);
  missingServiceChunk = false;
  const beforeRetryResponses = serverResponses.length;
  const oldDocument = await page.locator('meta[name="fixture-document"]').getAttribute("content");
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), button.click()]);
  await expect(page.locator('meta[name="fixture-document"]')).not.toHaveAttribute("content", oldDocument!, { timeout: 15_000 });
  await ready(page);
  await expect.poll(() => serverResponses.slice(beforeRetryResponses).some((response) => response.status === 200 && /^\/assets\/ServiceDetail-[^/]+\.js$/.test(response.url))).toBe(true);
  await test.info().attach("route-retry-diagnostics", { body: JSON.stringify({ documents, assetResponses, errors, text: await page.locator("main").first().innerText(), serverResponses: serverResponses.filter((r) => r.url.includes("ServiceDetail-") || !path.extname(new URL(r.url, origin).pathname)) }), contentType: "application/json" });
  await expect(page.getByRole("heading", { name: title, exact: true })).toHaveCount(0);
  await expect(page.locator(".fc-design-service-page #fcd-hero-heading")).toBeVisible({ timeout: 20_000 });
  expect(documents).toHaveLength(2);
  await noAutomaticRecovery(page);
}

for (const language of ["zh", "en"] as const) {
  test(`${language}: real version switch, slow native reload and repeated refresh issue one navigation`, async ({ page }) => {
    await page.goto(`${origin}/${language}`, { waitUntil: "load" });
    await ready(page);
    const oldEntry = await page.locator('script[type="module"][src]').first().getAttribute("src");
    await expect.poll(() => versionRequests).toBeGreaterThan(0);
    await pendingImport(page);
    phase = 2;
    slowDocument = true;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    const notice = page.locator(".public-update-notice");
    await expect(notice).toBeVisible();
    const documents = documentRequests(page);
    await notice.locator("button").first().click();
    await ready(page, "candidate-after");
    expect(await page.locator('script[type="module"][src]').first().getAttribute("src")).not.toBe(oldEntry);
    expect(documents).toHaveLength(1);
    slowDocument = false;
    for (let round = 0; round < 3; round++) {
      await pendingImport(page);
      await page.reload({ waitUntil: "load" });
      await ready(page, "candidate-after");
      expect(documents).toHaveLength(round + 2);
      await noAutomaticRecovery(page);
    }
  });
  test(`${language}: a real route script 404 stays on the error page until explicit retry`, async ({ page }) => {
    await missingRouteAndRetry(page, language);
  });
}

test("legacy client migrates to the repaired build and subsequent refresh stays single", async ({ page }) => {
  phase = 0;
  await page.goto(`${origin}/zh`, { waitUntil: "load" });
  await ready(page, "legacy-old");
  await expect.poll(() => versionRequests).toBeGreaterThan(0);
  await pendingImport(page);
  phase = 1;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const notice = page.locator(".public-update-notice");
  await expect(notice).toBeVisible();
  const documents = documentRequests(page);
  await notice.locator("button").first().click();
  await ready(page, "candidate-before");
  await page.waitForTimeout(600);
  expect(documents.length).toBeGreaterThanOrEqual(1);
  expect(documents.length).toBeLessThanOrEqual(2); // Old running code can still initiate its one legacy retry.
  await noAutomaticRecovery(page);
  const before = documents.length;
  await pendingImport(page);
  await page.reload({ waitUntil: "load" });
  await ready(page);
  expect(documents).toHaveLength(before + 1);
});

for (const accept of [false, true]) {
  test(`native leave prompt ${accept ? "accepted" : "dismissed"} does not leave a recovery blocker`, async ({ page }) => {
    await page.goto(`${origin}/zh`, { waitUntil: "load" });
    await ready(page);
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.evaluate(() => {
      window.addEventListener("beforeunload", (event) => { event.preventDefault(); event.returnValue = "Unsaved fixture"; }, { once: true });
    });
    await pendingImport(page);
    const dialog = page.waitForEvent("dialog");
    const reload = page.reload({ waitUntil: "load", timeout: 5_000 }).catch(() => null);
    const prompt = await dialog;
    expect(prompt.type()).toBe("beforeunload");
    if (accept) await prompt.accept(); else await prompt.dismiss();
    await reload;
    await ready(page);
    await noAutomaticRecovery(page);
    // A subsequent genuine missing lazy route must remain recoverable after either decision.
    await missingRouteAndRetry(page, "zh");
  });
}

test("stopping an uncommitted WebKit reload does not suppress a later real route failure", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "WebKit retains the old document when this slow navigation is stopped.");
  await page.goto(`${origin}/zh`, { waitUntil: "load" });
  await ready(page);
  slowDocument = true;
  const navigation = page.waitForRequest((request) => request.isNavigationRequest());
  await page.evaluate(() => window.location.reload());
  await navigation;
  await page.evaluate(() => window.stop());
  slowDocument = false;
  await noAutomaticRecovery(page);
  await missingRouteAndRetry(page, "zh");
});

test("back/forward and offline recovery preserve business and language storage", async ({ context, page, browserName }) => {
  await page.goto(`${origin}/zh`, { waitUntil: "load" });
  await ready(page);
  await page.evaluate(() => {
    localStorage.setItem("fixture-business-draft", "keep");
    sessionStorage.setItem("fixture-login-state", "keep");
  });
  await page.goto(`${origin}/en`, { waitUntil: "load" });
  await ready(page);
  await page.goBack({ waitUntil: "load" });
  await expect(page).toHaveURL(`${origin}/zh`);
  await page.goForward({ waitUntil: "load" });
  await expect(page).toHaveURL(`${origin}/en`);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  networkUnavailable = true;
  // Playwright's WebKit offline switch aborts navigation with an internal engine
  // error before the Worker fallback runs. Disconnect the real fixture server instead.
  if (browserName !== "webkit") await context.setOffline(true);
  let offlineError = "";
  await page.goto(`${origin}/en/services?offline-check=1`, { waitUntil: "domcontentloaded" }).catch((error: unknown) => { offlineError = String(error); });
  await test.info().attach("offline-diagnostics", { body: JSON.stringify({ offlineError, ...await page.evaluate(async () => ({ url: location.href, title: document.title, text: document.body.textContent?.slice(0, 200), offlineCached: Boolean(await caches.match("/offline")) })) }), contentType: "application/json" });
  await expect(page.getByRole("heading", { name: "当前网络不可用" })).toBeVisible();
  if (browserName !== "webkit") await context.setOffline(false);
  networkUnavailable = false;
  await page.reload({ waitUntil: "load" });
  await ready(page);
  expect(await page.evaluate(() => [localStorage.getItem("fixture-business-draft"), sessionStorage.getItem("fixture-login-state")])).toEqual(["keep", "keep"]);
  await noAutomaticRecovery(page);
});
