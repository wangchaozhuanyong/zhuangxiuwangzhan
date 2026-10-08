import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RenderOptions = {
  sitekey: string;
  action: string;
  execution?: string;
  callback: (token: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
};

type SdkFixture = {
  render: (container: HTMLElement, options: RenderOptions) => string;
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

const widgetId = "fixture-widget";
const testToken = "fixture-verification-response";
const browser = window as unknown as { turnstile?: SdkFixture };
const script = () => document.querySelector<HTMLScriptElement>("#cf-turnstile-api");
const loadModule = () => import("./turnstile");
// Fake timers place a zero-delay timer created inside another timer on the
// following millisecond, matching the next task used for SDK cleanup.
const flushCleanup = () => vi.advanceTimersByTimeAsync(1);

function installSdk() {
  const sdk = {
    render: vi.fn<SdkFixture["render"]>(() => widgetId),
    execute: vi.fn<SdkFixture["execute"]>(),
    remove: vi.fn<SdkFixture["remove"]>(),
  };
  browser.turnstile = sdk;
  return sdk;
}

async function beginVerification(api: Awaited<ReturnType<typeof loadModule>>, action: "contact" | "quote" = "quote") {
  const pending = api.getTurnstileToken(action);
  // Some SDK failures are synchronous. Attach a rejection handler before
  // advancing timers, while leaving the original promise available to assert.
  void pending.catch(() => undefined);
  await vi.advanceTimersByTimeAsync(0);
  return { pending };
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubEnv("DEV", false);
  vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "fixture-public-site-key");
  delete browser.turnstile;
  script()?.remove();
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete browser.turnstile;
  script()?.remove();
  document.body.innerHTML = "";
});

describe("production Turnstile verification lifecycle", () => {
  it.each(["contact", "quote"] as const)("explicitly executes one %s widget and cleans it once after success", async (action) => {
    const sdk = installSdk();
    const api = await loadModule();
    const { pending } = await beginVerification(api, action);
    expect(sdk.render).toHaveBeenCalledOnce();
    const [container, options] = sdk.render.mock.calls[0];
    expect(options).toMatchObject({ sitekey: "fixture-public-site-key", action, execution: "execute" });
    expect(sdk.execute).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(true);
    const css = getComputedStyle(container);
    // The SDK needs a rendered container within the viewport. Fixed positioning
    // preserves form layout while pointer isolation protects public controls.
    expect(css.display).not.toBe("none");
    expect(css.position).toBe("fixed");
    expect(css.top).toBe("0px");
    expect(css.left).toBe("0px");
    expect(css.pointerEvents).toBe("none");
    expect(container).toHaveAttribute("aria-hidden", "true");
    expect(sdk.remove).not.toHaveBeenCalled();
    options.callback(testToken);
    await expect(pending).resolves.toBe(testToken);
    await flushCleanup();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["error-callback", "Turnstile verification failed"],
    ["expired-callback", "Turnstile verification expired"],
    ["timeout-callback", "Turnstile verification timed out"],
  ] as const)("rejects %s and removes the widget and timeout", async (callback, message) => {
    const sdk = installSdk();
    const { pending } = await beginVerification(await loadModule());
    const [container, options] = sdk.render.mock.calls[0];
    options[callback]();
    await expect(pending).rejects.toThrow(message);
    await flushCleanup();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits for the 10 second verification deadline, then ignores late callbacks", async () => {
    const sdk = installSdk();
    const { pending } = await beginVerification(await loadModule());
    const [container, options] = sdk.render.mock.calls[0];
    const rejected = expect(pending).rejects.toThrow("Turnstile verification timed out");
    await vi.advanceTimersByTimeAsync(9999);
    expect(container.isConnected).toBe(true);
    expect(sdk.remove).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    await flushCleanup();
    options.callback("fixture-late-response");
    options["error-callback"]();
    options["expired-callback"]();
    options["timeout-callback"]();
    await flushCleanup();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("settles only the first success and ignores duplicate and late failure callbacks", async () => {
    const sdk = installSdk();
    const { pending } = await beginVerification(await loadModule());
    const [container, options] = sdk.render.mock.calls[0];
    options.callback(testToken);
    options.callback("fixture-duplicate-response");
    options["error-callback"]();
    options["expired-callback"]();
    options["timeout-callback"]();
    await expect(pending).resolves.toBe(testToken);
    await flushCleanup();
    expect(sdk.execute).toHaveBeenCalledOnce();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["error-callback", "verification failed"],
    ["expired-callback", "verification expired"],
    ["timeout-callback", "verification timed out"],
  ] as const)("ignores duplicate %s and success arriving after rejection", async (callback, message) => {
    const sdk = installSdk();
    const { pending } = await beginVerification(await loadModule());
    const [container, options] = sdk.render.mock.calls[0];
    options[callback]();
    options[callback]();
    options.callback("fixture-late-response");
    await expect(pending).rejects.toThrow(message);
    await flushCleanup();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans the container and timeout when render throws", async () => {
    const sdk = installSdk();
    sdk.render.mockImplementation(() => { throw new Error("Fixture render failure"); });
    const { pending } = await beginVerification(await loadModule());
    const container = sdk.render.mock.calls[0][0];
    await expect(pending).rejects.toThrow("Fixture render failure");
    await flushCleanup();
    expect(sdk.execute).not.toHaveBeenCalled();
    expect(sdk.remove).not.toHaveBeenCalled();
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans the known widget, container and timeout when execute throws", async () => {
    const sdk = installSdk();
    sdk.execute.mockImplementation(() => { throw new Error("Fixture execution failure"); });
    const { pending } = await beginVerification(await loadModule());
    const [container, options] = sdk.render.mock.calls[0];
    await expect(pending).rejects.toThrow("Fixture execution failure");
    await flushCleanup();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    options.callback("fixture-late-response");
    await flushCleanup();
    expect(sdk.execute).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    ["callback", "success"],
    ["error-callback", "error"],
    ["expired-callback", "expired"],
    ["timeout-callback", "timeout"],
  ] as const)("cleans an ID returned after a synchronous render %s without executing a settled widget", async (callback, outcome) => {
    const sdk = installSdk();
    sdk.render.mockImplementation((_container, options) => {
      if (callback === "callback") options.callback(testToken);
      else options[callback]();
      return widgetId;
    });
    const { pending } = await beginVerification(await loadModule());
    const [container, options] = sdk.render.mock.calls[0];
    if (outcome === "success") await expect(pending).resolves.toBe(testToken);
    else await expect(pending).rejects.toThrow(outcome === "error" ? "verification failed" : outcome === "expired" ? "verification expired" : "verification timed out");
    await flushCleanup();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    options.callback("fixture-late-response");
    await flushCleanup();
    expect(sdk.execute).not.toHaveBeenCalled();
    expect(sdk.remove).toHaveBeenCalledExactlyOnceWith(widgetId);
    expect(container.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("Turnstile script loading and existing skip conditions", () => {
  it("shares one script and one pending promise between concurrent preloads", async () => {
    const api = await loadModule();
    const first = api.preloadTurnstile();
    const second = api.preloadTurnstile();
    expect(first).toBe(second);
    expect(document.querySelectorAll("#cf-turnstile-api")).toHaveLength(1);
    expect(script()?.src).toBe("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
    installSdk();
    script()!.dispatchEvent(new Event("load"));
    await Promise.all([first, second]);
    await api.preloadTurnstile();
    expect(document.querySelectorAll("#cf-turnstile-api")).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("removes a failed script and successfully retries with a fresh script", async () => {
    const api = await loadModule();
    const first = api.preloadTurnstile();
    const failedScript = script()!;
    const rejected = expect(first).rejects.toThrow("Turnstile could not be loaded");
    failedScript.dispatchEvent(new Event("error"));
    await rejected;
    expect(failedScript.isConnected).toBe(false);
    const retry = api.preloadTurnstile();
    const retryScript = script()!;
    expect(retryScript).not.toBe(failedScript);
    expect(document.querySelectorAll("#cf-turnstile-api")).toHaveLength(1);
    installSdk();
    retryScript.dispatchEvent(new Event("load"));
    await retry;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("removes a script that times out at eight seconds and allows a fresh retry", async () => {
    const api = await loadModule();
    const first = api.preloadTurnstile();
    const firstScript = script()!;
    const rejected = expect(first).rejects.toThrow("Turnstile load timed out");
    await vi.advanceTimersByTimeAsync(8000);
    await rejected;
    expect(firstScript.isConnected).toBe(false);
    const retry = api.preloadTurnstile();
    const retryScript = script()!;
    expect(retryScript).not.toBe(firstScript);
    installSdk();
    retryScript.dispatchEvent(new Event("load"));
    await retry;
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["development", "missing site key"] as const)("preserves the existing %s skip without loading or executing the SDK", async (condition) => {
    if (condition === "development") vi.stubEnv("DEV", true);
    else vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
    const sdk = installSdk();
    const api = await loadModule();
    await api.preloadTurnstile();
    await expect(api.getTurnstileToken("contact")).resolves.toBeUndefined();
    expect(sdk.render).not.toHaveBeenCalled();
    expect(sdk.execute).not.toHaveBeenCalled();
    expect(script()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
