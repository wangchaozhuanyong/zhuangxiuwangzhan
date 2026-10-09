import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import command from "selenium-webdriver/lib/command.js";

export function publicDriverFailure(error) {
  const message = error instanceof Error ? error.message : '';
  return {
    unsupportedConfiguration: /unsupported|invalid.{0,30}(device|os.?version|capabilit)|not supported/i.test(message),
    authenticationFailure: /unauthorized|authentication|invalid.{0,25}(username|access.?key)/i.test(message),
    quotaExceeded: /quota|exceed.{0,40}(time|limit)|limit.{0,40}(exceed|reach)|trial.{0,40}(expire|over|end|exhaust)|minutes.{0,40}(exhaust|remain)|insufficient.{0,20}(balance|credit)/i.test(message),
    planUnavailable: /subscription|not.{0,20}(subscribed|entitled)|plan.{0,40}(expire|inactive|unavailable)|(?:upgrade|purchase).{0,30}(?:plan|subscription)/i.test(message),
    capacityUnavailable: /parallel|concurren|capacity|queue.{0,30}(full|limit)/i.test(message),
    transientNetworkFailure: /ECONN|ETIMEDOUT|ENOTFOUND|connection|socket|timeout|timed out/i.test(message),
  };
}

export async function closeBrowserSession(driver, result) {
  try {
    await driver.quit();
    result.sessionClosed = true;
  } catch (error) {
    result.ok = false;
    result.sessionClosed = false;
    result.cleanupFailed = true;
    result.cleanupDiagnostics = publicDriverFailure(error);
  }
  return result;
}

export function publicProviderPlan(httpStatus, payload) {
  const fields = ["parallel_sessions_running", "team_parallel_sessions_max_allowed",
    "parallel_sessions_max_allowed", "queued_sessions", "queued_sessions_max_allowed"];
  const metrics = Object.fromEntries(fields.map(name => {
    const value = payload && typeof payload === "object" ? payload[name] : null;
    return [name, Number.isSafeInteger(value) && value >= 0 ? value : null];
  }));
  const validMetrics = fields.every(name => metrics[name] !== null);
  const authorized = httpStatus === 200;
  return {
    httpStatus,
    authorized,
    authenticationFailure: httpStatus === 401 || httpStatus === 403,
    metrics,
    validMetrics,
    parallelCapacityAvailable: authorized && validMetrics
      ? metrics.parallel_sessions_running < Math.min(metrics.parallel_sessions_max_allowed, metrics.team_parallel_sessions_max_allowed)
      : null,
    // This endpoint reports concurrent capacity, not remaining trial minutes.
    trialMinutesRemaining: "NOT_MEASURED",
    ok: authorized && validMetrics,
  };
}

export function publicDriverHttpResponse(status, responseBody) {
  const bodyLimit = 128 * 1024;
  const raw = typeof responseBody === "string" ? responseBody.slice(0, bodyLimit) : "";
  const truncation = { responseBody: typeof responseBody === "string" && responseBody.length > bodyLimit,
    messageString: false, depth: false, nodes: false, arrayItems: false };
  let payload;
  try { payload = JSON.parse(raw); } catch { /* Non-JSON errors are classified without saving their body. */ }
  const messages = [];
  let visited = 0;
  // Legacy JSON Wire errors can put their cause in a string value or nested
  // wrapper. Inspect error fields only: successful capabilities may contain
  // credential or account strings that must not classify the response.
  const collect = (value, depth = 0) => {
    if (depth > 6) { truncation.depth = true; return; }
    if (++visited > 128) { truncation.nodes = true; return; }
    if (typeof value === "string") {
      if (value.length > 8192) truncation.messageString = true;
      const text = value.slice(0, 8192);
      try {
        const nested = JSON.parse(text);
        if (nested && typeof nested === "object") { collect(nested, depth + 1); return; }
      } catch { /* Ordinary error text stays in memory only. */ }
      messages.push(text);
      return;
    }
    if (Array.isArray(value)) {
      if (value.length > 16) truncation.arrayItems = true;
      value.slice(0, 16).forEach(item => collect(item, depth + 1));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const name of ["message", "reason", "error", "errors", "value", "details", "data"]) {
      if (Object.hasOwn(value, name)) collect(value[name], depth + 1);
    }
  };
  collect(payload);
  const errorText = payload === undefined ? raw : messages.join(" ");
  const diagnostics = publicDriverFailure(new Error(errorText));
  // Fixed public enums only; never serialize an arbitrary vendor-looking token.
  // https://www.browserstack.com/docs/automate/selenium/error-codes/browserstack-failed-to-start-browser
  // https://www.browserstack.com/docs/app-automate/appium/error-codes
  const vendorCodes = {
    BROWSERSTACK_FAILED_TO_START_BROWSER: null,
    BROWSERSTACK_ALL_PARALLELS_IN_USE: "capacityUnavailable",
    BROWSERSTACK_FEATURE_NOT_AVAILABLE_IN_CURRENT_PLAN: "planUnavailable",
    BROWSERSTACK_INVALID_DEVICE: "unsupportedConfiguration",
    BROWSERSTACK_INVALID_OS_VERSION: "unsupportedConfiguration",
    BROWSERSTACK_INCOMPATIBLE_OS_VERSION: "unsupportedConfiguration",
    BROWSERSTACK_NO_DEVICE_SPECIFIED: "unsupportedConfiguration",
  };
  const vendorErrorCodes = Object.keys(vendorCodes).filter(code =>
    new RegExp(`(?:^|[^A-Z0-9_])${code}(?=$|[^A-Z0-9_])`, "i").test(errorText));
  for (const code of vendorErrorCodes) if (vendorCodes[code]) diagnostics[vendorCodes[code]] = true;
  const objectPayload = payload && typeof payload === "object" && !Array.isArray(payload);
  const hasValue = objectPayload && Object.hasOwn(payload, "value"), value = hasValue ? payload.value : undefined;
  const legacy = objectPayload && typeof payload.status === "number";
  const legacyStatus = legacy && Number.isSafeInteger(payload.status) && payload.status >= 0 && payload.status <= 999 ? payload.status : null;
  const valueKind = !hasValue ? "MISSING" : value === null ? "NULL" : Array.isArray(value) ? "ARRAY"
    : ({ string: "STRING", object: "OBJECT", number: "NUMBER", boolean: "BOOLEAN" }[typeof value] || "OTHER");
  const protocol = legacy ? "LEGACY_JSON_WIRE" : objectPayload && payload.status === undefined && valueKind === "OBJECT"
    ? "W3C" : payload !== undefined ? "JSON_UNKNOWN" : "NON_JSON";
  const standardErrors = ["unknown error", "session not created", "invalid argument", "unsupported operation"];
  const standardError = standardErrors.includes(value?.error) ? value.error
    : legacyStatus === 13 ? "unknown error" : legacyStatus === 33 ? "session not created" : null;
  const classified = Object.values(diagnostics).some(Boolean);
  const httpStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
  const successfulSession = httpStatus !== null && httpStatus >= 200 && httpStatus < 300 &&
    ((legacyStatus === 0 && typeof payload.sessionId === "string" && payload.sessionId.length > 0)
      || (protocol === "W3C" && typeof value.sessionId === "string" && value.sessionId.length > 0 && value.capabilities && typeof value.capabilities === "object"));
  const rejection = !successfulSession && ((httpStatus !== null && httpStatus >= 400) || (legacy && payload.status !== 0)
    || typeof value?.error === "string" || messages.length > 0 || classified || vendorErrorCodes.length > 0);
  return {
    httpStatus,
    jsonResponseParsed: payload !== undefined,
    protocol, legacyStatus, valueKind,
    providerMessagePresent: messages.length > 0,
    standardError, vendorErrorCodes,
    failureCategory: !rejection ? null : vendorErrorCodes.length ? "PROVIDER_REJECTION_WITH_VENDOR_CODE"
      : classified ? "PROVIDER_REJECTION_CLASSIFIED" : "UNKNOWN_UNCLASSIFIED_PROVIDER_REJECTION",
    classificationSource: !rejection ? null : vendorErrorCodes.length ? "STATIC_VENDOR_CODE" : classified ? "EXISTING_MESSAGE_RULE" : "UNCLASSIFIED",
    truncated: Object.values(truncation).some(Boolean), truncation,
    ...diagnostics,
    rawResponseSaved: false,
  };
}

export async function withNativeDeviceContext(driver, action) {
  const executor = driver.getExecutor();
  executor.defineCommand("qaGetContexts", "GET", "/session/:sessionId/contexts");
  executor.defineCommand("qaGetContext", "GET", "/session/:sessionId/context");
  executor.defineCommand("qaSetContext", "POST", "/session/:sessionId/context");
  const run = (name, parameters = {}) => driver.execute(new command.Command(name).setParameters(parameters));
  const original = await run("qaGetContext");
  const contexts = await run("qaGetContexts");
  if (typeof original !== "string" || !Array.isArray(contexts) || !contexts.includes("NATIVE_APP")) {
    throw new Error("NATIVE_DEVICE_CONTEXT_UNAVAILABLE");
  }
  if (original !== "NATIVE_APP") await run("qaSetContext", { name: "NATIVE_APP" });
  let actionFailed = false;
  try { return await action(); }
  catch (error) { actionFailed = true; throw error; }
  finally {
    if (original !== "NATIVE_APP") {
      try { await run("qaSetContext", { name: original }); }
      catch (error) { if (!actionFailed) throw error; }
    }
  }
}

export async function hideNativeDeviceKeyboard(driver, ios = false) {
  driver.getExecutor().defineCommand("qaHideKeyboard", "POST", "/session/:sessionId/appium/device/hide_keyboard");
  return withNativeDeviceContext(driver, () => driver.execute(new command.Command("qaHideKeyboard").setParameters(ios ? { keyName: "Done" } : {})));
}

const baseUrl = (process.env.INSTALLED_BROWSER_BASE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const selectedTargets = (process.env.INSTALLED_BROWSER_TARGETS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);
const headless = process.env.INSTALLED_BROWSER_HEADLESS !== "0";

const windowsTargets = (env) => [
  {
    id: "chrome",
    name: "Google Chrome",
    candidates: [
      `${env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
      `${env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
      `${env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ],
  },
  {
    id: "edge",
    name: "Microsoft Edge",
    candidates: [
      `${env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ],
  },
  {
    id: "360",
    name: "360 Browser",
    candidates: [
      `${env.LOCALAPPDATA}\\360Chrome\\Chrome\\Application\\360chrome.exe`,
      `${env.ProgramFiles}\\360\\360Chrome\\Chrome\\Application\\360chrome.exe`,
      `${env["ProgramFiles(x86)"]}\\360\\360Chrome\\Chrome\\Application\\360chrome.exe`,
      `${env.ProgramFiles}\\360se6\\Application\\360se.exe`,
      `${env["ProgramFiles(x86)"]}\\360se6\\Application\\360se.exe`,
    ],
  },
  {
    id: "qq",
    name: "QQ Browser",
    candidates: [
      `${env.LOCALAPPDATA}\\Tencent\\QQBrowser\\QQBrowser.exe`,
      `${env.ProgramFiles}\\Tencent\\QQBrowser\\QQBrowser.exe`,
      `${env["ProgramFiles(x86)"]}\\Tencent\\QQBrowser\\QQBrowser.exe`,
    ],
  },
  {
    id: "uc",
    name: "UC Browser",
    candidates: [
      `${env.LOCALAPPDATA}\\UCBrowser\\Application\\UCBrowser.exe`,
      `${env.ProgramFiles}\\UCBrowser\\Application\\UCBrowser.exe`,
      `${env["ProgramFiles(x86)"]}\\UCBrowser\\Application\\UCBrowser.exe`,
    ],
  },
];

export function getBrowserTargets(platform = process.platform, environment = process.env) {
  if (platform === "win32") return windowsTargets(environment).map((target) => ({
    ...target,
    candidates: target.candidates.filter((candidate) => !candidate.includes("undefined")),
  }));
  const apps = ["/Applications", environment.HOME && path.join(environment.HOME, "Applications")].filter(Boolean);
  if (platform === "darwin") return [
    { id: "chrome", name: "Google Chrome", candidates: apps.map((directory) => `${directory}/Google Chrome.app/Contents/MacOS/Google Chrome`) },
    { id: "edge", name: "Microsoft Edge", candidates: apps.map((directory) => `${directory}/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`) },
  ];
  if (platform === "linux") return [
    { id: "chrome", name: "Google Chrome", candidates: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/opt/google/chrome/chrome"] },
    { id: "edge", name: "Microsoft Edge", candidates: ["/usr/bin/microsoft-edge", "/usr/bin/microsoft-edge-stable", "/opt/microsoft/msedge/msedge"] },
  ];
  return [];
}

export function selectRunnableTargets(targets, requested = []) {
  const unknown = requested.filter((id) => !targets.some((target) => target.id === id));
  if (unknown.length) throw new Error(`Unsupported browser target ids: ${unknown.join(", ")}`);
  const missing = targets.filter((target) => requested.includes(target.id) && !target.executablePath);
  if (missing.length) throw new Error(`Requested browsers are not installed: ${missing.map((target) => target.id).join(", ")}`);
  const available = targets.filter((target) => target.executablePath && (!requested.length || requested.includes(target.id)));
  if (!available.length) throw new Error("No supported local browser executable was found.");
  return available;
}

export function validateBrowserBaseUrl(value) {
  let url;
  try { url = new URL(value); }
  catch { throw new Error("Browser test base URL must be an HTTP(S) origin without credentials, query or fragment."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Browser test base URL must be an HTTP(S) origin without credentials, query or fragment.");
  }
  return url.origin;
}

export function publicDeviceIdentity(capabilities = {}, session = {}) {
  if (typeof capabilities.get === "function") {
    capabilities = Object.fromEntries(["browserName", "browserVersion", "version", "platformName", "platformVersion", "appium:platformVersion", "appium:deviceName", "deviceName", "bstack:options"].map(key => [key, capabilities.get(key)]));
  }
  const options = capabilities["bstack:options"] || {};
  const pick = (values, pattern) => values.find(value => typeof value === "string" && pattern.test(value)) || null;
  return {
    browserName: pick([session.browser, capabilities.browserName], /^(chrome|chromium|safari|firefox|edge|microsoftedge)$/i),
    browserVersion: pick([session.browser_version, capabilities.browserVersion, capabilities.version], /^\d+(?:\.\d+){0,5}$/),
    os: pick([session.os, capabilities.platformName, options.os], /^(ios|android|windows|mac|macos|os x)$/i),
    osVersion: pick([session.os_version, capabilities["appium:platformVersion"], capabilities.platformVersion, options.osVersion], /^\d+(?:\.\d+){0,4}$/),
    deviceName: pick([session.device, capabilities["appium:deviceName"], capabilities.deviceName, options.deviceName], /^(iPhone|Samsung Galaxy)[A-Za-z0-9 ._-]{0,70}$/i),
  };
}

export function assertRequestedDeviceIdentity(target, identity) {
  if (!identity.browserName || !identity.browserVersion || !identity.osVersion || !identity.deviceName || !/^(ios|android)$/i.test(identity.os || "")) {
    throw new Error("DEVICE_IDENTITY_NOT_RETURNED");
  }
  const requestedOs = /^iPhone/i.test(target.options.deviceName) ? "ios" : "android";
  const requestedVersion = target.options.osVersion.split(".").map(Number);
  const returnedVersion = identity.osVersion.split(".").map(Number);
  if (identity.os.toLowerCase() !== requestedOs || identity.browserName.toLowerCase() !== target.browserName.toLowerCase()
    || identity.deviceName.toLowerCase() !== target.options.deviceName.toLowerCase()
    || requestedVersion.some((part, index) => part !== (returnedVersion[index] ?? 0))
    || target.options.realMobile !== true) {
    throw new Error("DEVICE_IDENTITY_MISMATCH");
  }
  return true;
}

// Runs inside the browser through executeScript. Count and block attempts before
// they start: completed ResourceTiming entries cannot detect an in-flight write.
// Keep only counts; request URLs, headers, bodies and credentials are never saved.
export function negativeLeadRequestGuard(operation, scope = globalThis) {
  const key = "__qaNegativeLeadRequestGuard";
  if (operation === "arm") {
    if (scope[key]) throw new Error("NEGATIVE_FORM_GUARD_ALREADY_ACTIVE");
    const prototype = scope.XMLHttpRequest?.prototype;
    if (typeof scope.fetch !== "function" || typeof prototype?.open !== "function" || typeof prototype?.send !== "function") {
      throw new Error("NEGATIVE_FORM_NETWORK_GUARD_UNAVAILABLE");
    }
    const state = { attempts: 0, originalFetch: scope.fetch, originalOpen: prototype.open, originalSend: prototype.send };
    const leadRequests = new WeakSet();
    const isLeadRequest = input => {
      const value = typeof input === "string" ? input : input?.url ?? input?.href;
      return typeof value === "string" && /(?:^|\/)functions\/v1\/submit-lead(?:[/?#]|$)/.test(value);
    };
    state.fetch = function (...args) {
      if (isLeadRequest(args[0])) {
        state.attempts++;
        return Promise.reject(new Error("QA_INVALID_FORM_REQUEST_BLOCKED"));
      }
      return Reflect.apply(state.originalFetch, this, args);
    };
    state.open = function (...args) {
      if (isLeadRequest(args[1])) leadRequests.add(this);
      else leadRequests.delete(this);
      return Reflect.apply(state.originalOpen, this, args);
    };
    state.send = function (...args) {
      if (leadRequests.has(this)) {
        state.attempts++;
        throw new Error("QA_INVALID_FORM_REQUEST_BLOCKED");
      }
      return Reflect.apply(state.originalSend, this, args);
    };
    Object.defineProperty(scope, key, { configurable: true, value: state });
    scope.fetch = state.fetch;
    prototype.open = state.open;
    prototype.send = state.send;
  }
  const state = scope[key];
  if (!state) throw new Error("NEGATIVE_FORM_NETWORK_GUARD_UNAVAILABLE");
  const prototype = scope.XMLHttpRequest.prototype;
  const result = { guardInstalled: scope.fetch === state.fetch && prototype.open === state.open && prototype.send === state.send,
    leadRequestAttempts: state.attempts };
  if (operation === "restore") {
    if (scope.fetch === state.fetch) scope.fetch = state.originalFetch;
    if (prototype.open === state.open) prototype.open = state.originalOpen;
    if (prototype.send === state.send) prototype.send = state.originalSend;
    delete scope[key];
  } else if (!["arm", "snapshot"].includes(operation)) throw new Error("NEGATIVE_FORM_NETWORK_GUARD_INVALID_OPERATION");
  return result;
}

export function publicQaMetrics(value) {
  if (!value || typeof value !== "object") return {};
  const fields = ["realMobileRequested", "nativeContextAvailable", "restoredWebContextOnExit", "focusRestored", "nativeTouchNavigation",
    "tapObserved", "tapDeliveredToExpectedControl", "tapTrusted", "switchedToEnglish", "switchedBackToChinese", "touchPressFeedback", "shopOpened", "testTabClosed",
    "pressObserved", "pressed", "trusted", "touchPointer", "transformObserved", "pressDuration", "shopTabCreated", "probeArmed", "pointerDownObserved", "pointerUpObserved",
    "trustedTouchStartObserved", "trustedClickObserved", "pressedDuringEvent", "keyboardHeightBefore", "keyboardHeightAfter", "focusedName", "typedNamePresent",
    "height", "inputVisible", "inputTop", "inputBottom", "viewportOffset", "menuTop", "menuBottom", "viewportHeight", "keyboardDismissed", "invalidPhoneDisplayed",
    "leadRequestSent", "guardInstalled", "leadRequestAttempts", "networkGuardRestored", "validationMessagePresent", "firstInvalidFieldFocused", "whatsappTargetVerified",
    "clickedExternalMessageLink", "inspectedScrollPositions", "overlaps", "distinctNativeScrollPositions", "activeFrames", "reducedMotion", "maxAlignmentError", "maxButtonShift",
    "minimumViewportHeight", "maximumViewportHeight", "hasViewBox", "squareRatio", "insideViewport", "hiddenFrames", "visibleFrames", "firstVisibleX", "firstVisibleY",
    "finalX", "finalY", "finalFixed", "documentComplete", "pageVisible", "collectorResultPresent", "motionEntryPresent"];
  const result = Object.fromEntries(fields.filter(key => typeof value[key] === "boolean" || (typeof value[key] === "number" && Number.isFinite(value[key])))
    .map(key => [key, value[key]]));
  const strings = {
    browserName: /^(chrome|chromium|safari|firefox|edge|microsoftedge)$/i,
    browserVersion: /^\d+(?:\.\d+){0,5}$/,
    os: /^(ios|android|windows|mac|macos|os x)$/i,
    osVersion: /^\d+(?:\.\d+){0,4}$/,
    deviceName: /^(iPhone|Samsung Galaxy)[A-Za-z0-9 ._-]{0,70}$/i,
    menuStage: /^(open_first|close_first|open_second|expand_group|navigate_projects)$/,
    contactStage: /^(open_contact|keyboard_appearance|native_typing|native_keyboard_dismissal|menu_after_keyboard|keyboard_dismissal|invalid_form_submit)$/,
  };
  for (const [key, pattern] of Object.entries(strings)) if (typeof value[key] === "string" && pattern.test(value[key])) result[key] = value[key];
  if (Array.isArray(value.states)) result.states = [...new Set(value.states.filter(state => ["flying", "settling", "done", "skipped", "idle"].includes(state)))];
  return result;
}

// This browser-side eligibility check returns only a public path and a boolean.
// It excludes Admin, provider pages and any visible input containing user data.
export function publicScreenshotPage(baseOrigin, scope = globalThis) {
  const location = scope.location;
  if (location.origin !== baseOrigin || location.search || location.hash || !/^\/(?:zh|en)(?:\/(?:services|materials|projects|quote|contact|faq|blog))?\/?$/.test(location.pathname)
    || !scope.document.querySelector("main") || scope.document.querySelector('input[type="password"]')) return { eligible: false, path: null };
  const fields = Array.from(scope.document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea'));
  if (fields.some(field => field.value && !(field.id === "contact-name" && field.value === "QA keyboard only"))) return { eligible: false, path: null };
  return { eligible: true, path: location.pathname };
}

export function assertMobileMotion(observation) {
  if (!observation || observation.activeFrames < 3 || !observation.states?.includes("done")) throw new Error("MOTION_NOT_OBSERVED");
  if (!observation.reducedMotion && (!observation.states.includes("flying") || !observation.states.includes("settling"))) throw new Error("MOTION_PHASE_MISSING");
  if (!Number.isFinite(observation.maxAlignmentError) || observation.maxAlignmentError > 1.25 || observation.hasViewBox) throw new Error("MOTION_FRAME_MISALIGNED");
  if (!Number.isFinite(observation.maxButtonShift) || observation.maxButtonShift > 1) throw new Error("FLOATING_BUTTON_JUMPED");
  if (!Number.isFinite(observation.squareRatio) || Math.abs(observation.squareRatio - 1) > .025 || !observation.insideViewport) throw new Error("MOBILE_BUTTON_GEOMETRY_INVALID");
  return true;
}

const pages = [
  { path: "/zh", selectors: [".scheme-a-chrome__brand", "main", "footer", 'a[href^="tel:"]'], minTextLength: 800 },
  { path: "/en", selectors: [".scheme-a-chrome__brand", "main", "footer", 'a[href^="tel:"]'], minTextLength: 800 },
  { path: "/zh/services", selectors: [".scheme-a-chrome__brand", "main", "footer", 'a[href*="/quote"]'], minTextLength: 800 },
  { path: "/zh/materials", selectors: [".scheme-a-chrome__brand", "main", "footer"], minTextLength: 500 },
  { path: "/zh/projects", selectors: [".scheme-a-chrome__brand", "main", "footer", 'a[href*="/quote"]'], minTextLength: 500 },
  { path: "/zh/quote", selectors: ["main", "#quote-name", "#quote-phone", "#quote-project-type", "#quote-details"], minTextLength: 500 },
  { path: "/zh/contact", selectors: ["main", "#contact-name", "#contact-phone", "#contact-message", 'a[href^="tel:"]'], minTextLength: 500 },
  { path: "/admin", selectors: ['input[type="email"]', 'input[type="password"]', 'button[type="submit"]'], minTextLength: 100 },
];

const pathExists = async (path) => {
  if (!path || path.includes("undefined")) return false;
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const resolveTarget = async (target, exists = pathExists) => {
  for (const candidate of target.candidates) {
    if (await exists(candidate)) {
      return { ...target, executablePath: candidate };
    }
  }

  return target;
};

const waitForVisible = async (page, selector) => {
  // The directory and footer can contain the same link. A hidden directory
  // link must not mask a visible footer link in the current layout.
  const locator = page.locator(`${selector}:visible`).first();
  await locator.waitFor({ state: "visible", timeout: 20_000 });
};

const waitForPageUsable = async (page) => {
  try {
    await page.waitForLoadState("load", { timeout: 12_000 });
  } catch {
    await page.waitForTimeout(1_500);
  }
};

const assertPageHealthy = async (page, spec) => {
  const response = await page.goto(`${baseUrl}${spec.path}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  if (!response?.ok()) {
    throw new Error(`${spec.path} returned ${response?.status() ?? "no response"}`);
  }

  await waitForPageUsable(page);

  for (const selector of spec.selectors) {
    await waitForVisible(page, selector);
  }

  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const bodyText = document.body.innerText || "";
    const visibleBrokenImages = Array.from(document.images).filter((image) => {
      const rect = image.getBoundingClientRect();
      const isVisible = rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight;
      return isVisible && image.complete && image.naturalWidth === 0;
    });

    return {
      bodyTextLength: bodyText.trim().length,
      hasReplacementCharacter: bodyText.includes("\uFFFD"),
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      visibleBrokenImageCount: visibleBrokenImages.length,
      supportsCssGrid: CSS.supports("display", "grid"),
      supportsFlex: CSS.supports("display", "flex"),
      supportsClamp: CSS.supports("width", "clamp(1rem, 2vw, 2rem)"),
      supportsFetch: typeof window.fetch === "function",
    };
  });

  const errors = [];
  if (result.bodyTextLength < spec.minTextLength) errors.push(`text too short: ${result.bodyTextLength}`);
  if (result.hasReplacementCharacter) errors.push("replacement character found");
  if (result.scrollWidth > result.clientWidth + 1) errors.push(`horizontal overflow: ${result.scrollWidth} > ${result.clientWidth}`);
  if (result.visibleBrokenImageCount > 0) errors.push(`visible broken images: ${result.visibleBrokenImageCount}`);
  if (!result.supportsCssGrid) errors.push("CSS Grid unsupported");
  if (!result.supportsFlex) errors.push("Flexbox unsupported");
  if (!result.supportsClamp) errors.push("CSS clamp unsupported");
  if (!result.supportsFetch) errors.push("fetch unsupported");

  if (errors.length > 0) {
    throw new Error(`${spec.path}: ${errors.join("; ")}`);
  }
};

const assertMobileMenu = async (page) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/zh`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await waitForPageUsable(page);

  const menuButton = page.locator(".scheme-a-chrome__menu-trigger--compact");
  await menuButton.waitFor({ state: "visible", timeout: 20_000 });
  await menuButton.click();

  const menu = page.locator("#scheme-a-directory");
  await menu.waitFor({ state: "visible", timeout: 20_000 });
  await menu.locator('.scheme-a-directory__group-toggle[aria-controls="scheme-a-directory-group-services"]').click();
  await menu.locator('#scheme-a-directory-group-services a[href$="/services"]').first().click();
  await page.waitForURL(/\/zh\/services$/, { timeout: 20_000 });
  await menu.waitFor({ state: "hidden", timeout: 20_000 });
  await waitForVisible(page, "main");
};

const runTarget = async (target) => {
  let browser;
  const checks = [];
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ executablePath: target.executablePath, headless });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: false });
    const page = await context.newPage();
    for (const spec of pages) {
      await assertPageHealthy(page, spec);
      checks.push(spec.path);
      console.log(`[installed-browser] ${target.id} checked ${spec.path}`);
    }
    await assertMobileMenu(page);
    checks.push("mobile-menu-navigation");
    return { id: target.id, name: target.name, executablePath: target.executablePath, version: browser.version(), checks, ok: true };
  } catch (error) {
    return { id: target.id, name: target.name, executablePath: target.executablePath, checks, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await browser?.close();
  }
};

async function main() {
  validateBrowserBaseUrl(baseUrl);
  const resolvedTargets = await Promise.all(getBrowserTargets().map((target) => resolveTarget(target)));
  const runnableTargets = selectRunnableTargets(resolvedTargets, selectedTargets);

  const results = [];
  for (const target of runnableTargets) {
    console.log(`[installed-browser] ${target.name} starting: ${target.executablePath}`);
    const result = await runTarget(target);
    results.push(result);
    console.log(`[installed-browser] ${target.name} ${result.ok ? "passed" : `failed: ${result.error}`}`);
  }

  const missingTargets = resolvedTargets
    .filter((target) => !target.executablePath)
    .map((target) => ({ id: target.id, name: target.name }));
  const failed = results.filter((result) => !result.ok);

  console.log(JSON.stringify({ ok: failed.length === 0, scope: "installed-supported-browsers-only", baseUrl, headless, results, missingTargets,
    notCovered: ["Safari native", "Firefox native", "physical phones", "authenticated admin business workflow"] }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(`[installed-browser] ${error.message}`); process.exitCode = 1; });
}
