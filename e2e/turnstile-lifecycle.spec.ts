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
      await route.fulfill({ status: 200, json: { ok: true, id: "synthetic-lead-no-write" } });
      return;
    }
    if (url.pathname.includes("/rest/v1/")) {
      // The homepage RPC returns an object. An empty array would deliberately
      // activate the existing fallback notice and distort its layout screenshot.
      const json = url.pathname.endsWith("/rpc/get_public_home_bundle") ? { site_pages: [], hero_slides: [] } : [];
      await route.fulfill({ status: 200, json });
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
  return { counts: () => ({ submitCount, verifiedSubmitCount }) };
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
  for (const outcome of ["success", "error", "expired", "timeout", "token-timeout"] as const) {
    test(`${language} ${action}: ${outcome} executes once, cleans up and preserves submission safety`, async ({ page }, info) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await installSdkMock(page);
      const requests = await isolateRequests(page);
      await gotoReady(page, `/${language}/${action}`);
      await fillForm(page, action);
      if (outcome === "token-timeout") await page.clock.install();
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
        await page.clock.fastForward(10_001);
        await page.clock.resume();
      } else {
        await signalSdk(page, outcome);
      }
      await assertSdkCleaned(page, 1);
      const successTitle = action === "contact"
        ? (language === "zh" ? "信息已发送！" : "Message Sent!")
        : (language === "zh" ? "报价请求已提交！" : "Quote Request Submitted!");

      if (outcome === "success") {
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
    floating: geometry(".fc-furniture-floating"),
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
        const floating = page.locator(".fc-furniture-floating");
        await expect(floating).toBeVisible();
        const before = await chromeGeometry(page);
        expect(before.horizontalOverflow).toBe(false);
        expect(before.floating?.position).toBe("fixed");
        expect(before.floating?.right).toBeGreaterThanOrEqual(16);
        if (viewport.width < 768) {
          await expect(page.getByTestId("mobile-bottom-dock")).toHaveAttribute("data-mode", "navigation");
          await expect(page.locator(".scheme-a-mobile-dock")).toBeVisible();
          expect(before.dock?.width).toBe(viewport.width);
          expect(before.dock?.height).toBe(68);
          expect(before.dock?.bottom).toBe(0);
          expect(before.floating?.width).toBe(68);
          expect(before.floating?.height).toBe(68);
          expect(before.floating?.bottom).toBe(84);
          expect(before.floating?.right).toBe(16);
        } else {
          await expect(page.getByTestId("mobile-bottom-dock")).not.toBeVisible();
        }
        if (baseline) {
          await gotoReady(baseline, new URL(path, baselineUrl).href);
          await baseline.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await expect(baseline.locator(".fc-furniture-floating")).toBeVisible();
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
