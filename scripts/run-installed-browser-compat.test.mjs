import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { Capabilities } from "selenium-webdriver";
import { readFile, rm } from "node:fs/promises";
import { getBrowserTargets, resolveTarget, selectRunnableTargets, validateBrowserBaseUrl, publicDeviceIdentity, assertRequestedDeviceIdentity, negativeLeadRequestGuard, publicQaMetrics, publicScreenshotPage, publicDriverFailure, publicProviderPlan, publicDriverHttpResponse, assertMobileMotion, withNativeDeviceContext, hideNativeDeviceKeyboard, closeBrowserSession } from "./run-installed-browser-compat.mjs";

test("requested real device, browser and OS must match supplier-returned identity", () => {
  const target = { browserName: "safari", options: { deviceName: "iPhone 16", osVersion: "18", realMobile: true } };
  const identity = { browserName: "safari", browserVersion: "18.5", os: "ios", osVersion: "18.5", deviceName: "iPhone 16" };
  assert.equal(assertRequestedDeviceIdentity(target, identity), true);
  for (const changes of [{ os: "android" }, { osVersion: "17.7" }, { deviceName: "iPhone 15" }, { browserName: "chrome" }]) {
    assert.throws(() => assertRequestedDeviceIdentity(target, { ...identity, ...changes }), /DEVICE_IDENTITY_MISMATCH/);
  }
  assert.throws(() => assertRequestedDeviceIdentity(target, { ...identity, browserVersion: null }), /DEVICE_IDENTITY_NOT_RETURNED/);
  assert.throws(() => assertRequestedDeviceIdentity({ ...target, options: { ...target.options, realMobile: false } }, identity), /DEVICE_IDENTITY_MISMATCH/);
  const android = { browserName: "chrome", options: { deviceName: "Samsung Galaxy S23 Ultra", osVersion: "13.0", realMobile: true } };
  const returned = { browserName: "chrome", browserVersion: "154.0", os: "android", osVersion: "13", deviceName: "Samsung Galaxy S23 Ultra" };
  assert.equal(assertRequestedDeviceIdentity(android, returned), true);
  assert.throws(() => assertRequestedDeviceIdentity(android, { ...returned, osVersion: "13.1" }), /DEVICE_IDENTITY_MISMATCH/);
});

test("negative form guard observes and blocks fetch and XHR attempts before any network completion", async () => {
  let fetchCalls = 0, sendCalls = 0;
  class FakeXHR { open() {} send() { sendCalls++; } }
  const originalFetch = () => { fetchCalls++; return new Promise(() => {}); };
  const scope = { fetch: originalFetch, XMLHttpRequest: FakeXHR };
  const originalOpen = FakeXHR.prototype.open, originalSend = FakeXHR.prototype.send;
  assert.deepEqual(negativeLeadRequestGuard("arm", scope), { guardInstalled: true, leadRequestAttempts: 0 });
  scope.fetch("/public-read"); // Deliberately unresolved: resource completion is irrelevant.
  for (const request of ["https://site.test/functions/v1/submit-lead?token=synthetic-private-key", { url: "/functions/v1/submit-lead" }, new URL("https://site.test/functions/v1/submit-lead")]) {
    await assert.rejects(scope.fetch(request, { method: "POST", headers: { Authorization: "synthetic-private-key" }, body: "private-body" }), /QA_INVALID_FORM_REQUEST_BLOCKED/);
  }
  const xhr = new FakeXHR();
  xhr.open("POST", "/functions/v1/submit-lead");
  assert.throws(() => xhr.send("private-body"), /QA_INVALID_FORM_REQUEST_BLOCKED/);
  assert.equal(sendCalls, 0);
  assert.equal(fetchCalls, 1);
  const result = negativeLeadRequestGuard("snapshot", scope);
  assert.deepEqual(result, { guardInstalled: true, leadRequestAttempts: 4 });
  for (const privateValue of ["synthetic-private-key", "private-body", "site.test"]) assert.equal(JSON.stringify(result).includes(privateValue), false);
  xhr.open("GET", "/public-read"); xhr.send();
  assert.equal(sendCalls, 1);
  assert.deepEqual(negativeLeadRequestGuard("restore", scope), result);
  assert.equal(scope.fetch, originalFetch);
  assert.equal(FakeXHR.prototype.open, originalOpen);
  assert.equal(FakeXHR.prototype.send, originalSend);
});

test("negative request evidence fails closed when guard coverage is unavailable or replaced", () => {
  assert.throws(() => negativeLeadRequestGuard("arm", { fetch() {} }), /GUARD_UNAVAILABLE/);
  class FakeXHR { open() {} send() {} }
  const scope = { fetch() {}, XMLHttpRequest: FakeXHR };
  negativeLeadRequestGuard("arm", scope);
  const replacement = () => {};
  scope.fetch = replacement;
  assert.equal(negativeLeadRequestGuard("snapshot", scope).guardInstalled, false);
  assert.equal(negativeLeadRequestGuard("restore", scope).guardInstalled, false);
  assert.equal(scope.fetch, replacement);
});

test("QA metrics whitelist numeric evidence and known states without saving private driver payloads", () => {
  const result = publicQaMetrics({ leadRequestAttempts: 0, guardInstalled: true, states: ["flying", "private-session", "done"],
    contactStage: "invalid_form_submit", deviceName: "https://private.test/session", accessKey: "synthetic-private-key", response: { value: "private-body" },
    inputTop: Infinity, menuStage: "synthetic-private-key", arbitraryCounter: 10 });
  assert.deepEqual(result, { guardInstalled: true, leadRequestAttempts: 0, contactStage: "invalid_form_submit", states: ["flying", "done"] });
});

test("screenshots allow public pages and QA-only input while excluding Admin, provider and user data", () => {
  let fields = [];
  const scope = { location: { origin: "https://flashcast.com.my", pathname: "/zh/contact", search: "", hash: "" },
    document: { querySelector: selector => selector === "main" ? {} : null, querySelectorAll: () => fields } };
  assert.deepEqual(publicScreenshotPage("https://flashcast.com.my", scope), { eligible: true, path: "/zh/contact" });
  fields = [{ id: "contact-name", value: "QA keyboard only" }];
  assert.equal(publicScreenshotPage("https://flashcast.com.my", scope).eligible, true);
  fields = [{ id: "contact-name", value: "private-customer-name" }];
  assert.deepEqual(publicScreenshotPage("https://flashcast.com.my", scope), { eligible: false, path: null });
  fields = [];
  for (const changes of [{ pathname: "/admin" }, { origin: "https://provider.test" }, { search: "?token=private" }, { hash: "#private" }]) {
    const candidate = { ...scope, location: { ...scope.location, ...changes } };
    assert.equal(publicScreenshotPage("https://flashcast.com.my", candidate).eligible, false);
  }
});

test("a provider preflight that cannot start still saves a sanitized failure artifact", async t => {
  const runId = `9${Date.now()}${process.pid}`;
  const directory = new URL(`../audits/real-browser/${runId}/`, import.meta.url);
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, ["scripts/run-browserstack-compat.mjs"], {
    env: { ...process.env, BROWSERSTACK_USERNAME: "private-user", BROWSERSTACK_ACCESS_KEY: "", BROWSERSTACK_BUILD_NAME: "synthetic-private-key",
      REAL_BROWSER_TARGETS: "provider-preflight", GITHUB_RUN_ID: runId }, encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  const report = JSON.parse(await readFile(new URL("report.json", directory), "utf8"));
  assert.equal(report.ok, false);
  assert.equal(report.code, "MISSING_PROVIDER_CREDENTIALS");
  assert.equal(report.sessionCreationAttempted, false);
  assert.equal(report.websiteChecksRun, false);
  assert.equal(report.sanitized, true);
  for (const secret of ["private-user", "synthetic-private-key"]) assert.equal(JSON.stringify(report).includes(secret), false);
});

test("provider preflight saves whitelisted plan evidence without starting browsers or checking the website", async t => {
  const runId = `8${Date.now()}${process.pid}`;
  const directory = new URL(`../audits/real-browser/${runId}/`, import.meta.url);
  t.after(() => rm(directory, { recursive: true, force: true }));
  const stub = `globalThis.fetch = async url => {
    if (url !== "https://api.browserstack.com/automate/plan.json") throw new Error("UNEXPECTED_WEBSITE_REQUEST");
    return new Response(JSON.stringify({ parallel_sessions_running: 0, team_parallel_sessions_max_allowed: 1,
      parallel_sessions_max_allowed: 1, queued_sessions: 0, queued_sessions_max_allowed: 5,
      username: "private-user", access_key: "synthetic-private-key", public_url: "https://private.test/session" }), { status: 200 });
  };`;
  const result = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(stub)}`, "scripts/run-browserstack-compat.mjs"], {
    env: { ...process.env, BROWSERSTACK_USERNAME: "private-user", BROWSERSTACK_ACCESS_KEY: "synthetic-private-key",
      REAL_BROWSER_TARGETS: "provider-preflight", GITHUB_RUN_ID: runId }, encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 0);
  const report = JSON.parse(await readFile(new URL("report.json", directory), "utf8"));
  assert.equal(report.mode, "provider-preflight");
  assert.equal(report.plan.parallelCapacityAvailable, true);
  assert.equal(report.plan.trialMinutesRemaining, "NOT_MEASURED");
  assert.equal(report.sessionCreationAttempted, false);
  assert.equal(report.websiteChecksRun, false);
  for (const secret of ["private-user", "synthetic-private-key", "private.test"]) {
    assert.equal(JSON.stringify(report).includes(secret), false);
    assert.equal(result.stdout.includes(secret), false);
  }
});

test("a production revision transport failure saves failure evidence before any session starts", async t => {
  const runId = `7${Date.now()}${process.pid}`;
  const directory = new URL(`../audits/real-browser/${runId}/`, import.meta.url);
  t.after(() => rm(directory, { recursive: true, force: true }));
  const stub = 'globalThis.fetch = async () => { throw new Error("connection refused: private-user / synthetic-private-key"); };';
  const result = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(stub)}`, "scripts/run-browserstack-compat.mjs"], {
    env: { ...process.env, BROWSERSTACK_USERNAME: "private-user", BROWSERSTACK_ACCESS_KEY: "synthetic-private-key",
      REAL_BROWSER_TARGETS: "windows-chrome", GITHUB_RUN_ID: runId }, encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  const report = JSON.parse(await readFile(new URL("report.json", directory), "utf8"));
  assert.equal(report.status, "FAILED");
  assert.equal(report.stableProductionRevision, false);
  assert.equal(report.providerDiagnostics.transientNetworkFailure, true);
  assert.deepEqual(report.results, []);
  for (const secret of ["private-user", "synthetic-private-key"]) {
    assert.equal(JSON.stringify(report).includes(secret), false);
    assert.equal(result.stdout.includes(secret), false);
  }
});

test("session cleanup failure rejects acceptance without replacing the original provider failure or exposing details", async () => {
  const original = { quotaExceeded: true };
  const result = { ok: false, stage: "mobile_interactions", providerDiagnostics: original };
  const driver = { quit: async () => { throw new Error("connection lost: synthetic-private-key /private-session"); } };
  assert.equal(await closeBrowserSession(driver, result), result);
  assert.equal(result.ok, false);
  assert.equal(result.sessionClosed, false);
  assert.equal(result.cleanupFailed, true);
  assert.equal(result.providerDiagnostics, original);
  assert.equal(result.cleanupDiagnostics.transientNetworkFailure, true);
  for (const value of ["synthetic-private-key", "private-session"]) assert.equal(JSON.stringify(result).includes(value), false);
  const successfulChecks = { ok: true };
  await closeBrowserSession(driver, successfulChecks);
  assert.equal(successfulChecks.ok, false);
});

test("an acquired browser session is marked closed only after quit succeeds", async () => {
  let closed = 0;
  const result = { ok: true };
  await closeBrowserSession({ quit: async () => { closed++; } }, result);
  assert.equal(closed, 1);
  assert.deepEqual(result, { ok: true, sessionClosed: true });
});

test("historical fixed QA caller inputs cannot run through the current generic browser workflow", () => {
  for (const target of ["__qa_external_recovery__", "__qa_managed_cms__", "__qa_managed_verify__"]) {
    const result = spawnSync(process.execPath, ["scripts/run-browserstack-compat.mjs"], {
      env: { ...process.env, BROWSERSTACK_USERNAME: "", BROWSERSTACK_ACCESS_KEY: "", REAL_BROWSER_TARGETS: target },
      encoding: "utf8", timeout: 5000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unsupported BrowserStack target ids/);
    assert.equal(result.stdout, "");
  }
});

test("native context cleanup preserves the failed action and rejects successful actions when restoration fails", async () => {
  const original = new Error("native action unavailable");
  const driver = {
    getExecutor: () => ({ defineCommand() {} }),
    execute: async item => {
      if (item.getName() === "qaGetContext") return "WEBVIEW_TEST";
      if (item.getName() === "qaGetContexts") return ["WEBVIEW_TEST", "NATIVE_APP"];
      if (item.getName() === "qaSetContext" && item.getParameters().name === "WEBVIEW_TEST") {
        throw new Error("restoration failed: synthetic-private-key");
      }
    },
  };
  await assert.rejects(withNativeDeviceContext(driver, async () => { throw original; }), error => error === original);
  await assert.rejects(withNativeDeviceContext(driver, async () => true), /restoration failed/);
});

test("nested provider rejection reports status and category without saving JSON credentials or sessions", () => {
  const result = publicDriverHttpResponse(403, JSON.stringify({ error: { message: "Trial exhausted: synthetic-private-key" },
    username: "private-user", session: "private-session" }));
  assert.equal(result.httpStatus, 403);
  assert.equal(result.jsonResponseParsed, true);
  assert.equal(result.quotaExceeded, true);
  assert.equal(result.rawResponseSaved, false);
  for (const value of ["synthetic-private-key", "private-user", "private-session"]) assert.equal(JSON.stringify(result).includes(value), false);
  const w3c = publicDriverHttpResponse(500, JSON.stringify({ value: { error: "session not created", message: "Unsupported device" } }));
  assert.equal(w3c.standardError, "session not created");
  assert.equal(w3c.unsupportedConfiguration, true);
});

test("non-JSON and unknown HTTP errors remain safe and are not assigned a guessed quota cause", () => {
  const result = publicDriverHttpResponse(502, "<html>Unclassified failure: synthetic-private-key</html>");
  assert.equal(result.httpStatus, 502);
  assert.equal(result.jsonResponseParsed, false);
  assert.equal(result.quotaExceeded, false);
  assert.equal(JSON.stringify(result).includes("synthetic-private-key"), false);
  assert.equal(publicDriverHttpResponse(undefined, "").httpStatus, null);
});

test("generic root messages do not hide legacy or deeply wrapped provider causes", () => {
  for (const payload of [
    { message: "Unknown error", status: 13, value: "Trial minutes exhausted: synthetic-private-key" },
    { message: "Unknown error", value: { details: { errors: [{ reason: "Automation time limit exceeded: private-session" }] } } },
    { message: "Unknown error", value: JSON.stringify({ error: { message: "BROWSERSTACK_TRIAL_EXHAUSTED" } }) },
  ]) {
    const result = publicDriverHttpResponse(200, JSON.stringify(payload));
    assert.equal(result.quotaExceeded, true);
    assert.equal(result.providerMessagePresent, true);
    for (const value of ["synthetic-private-key", "private-session"]) assert.equal(JSON.stringify(result).includes(value), false);
  }
});

test("successful capabilities and unrelated account values cannot invent a provider failure", () => {
  const result = publicDriverHttpResponse(200, JSON.stringify({ value: { sessionId: "private-session",
    capabilities: { accessKey: "quota-exhausted", account: "invalid username", deviceName: "unsupported device" } },
    username: "trial expired", accessKey: "plan unavailable" }));
  assert.equal(result.providerMessagePresent, false);
  for (const flag of ["quotaExceeded", "authenticationFailure", "unsupportedConfiguration", "planUnavailable"]) assert.equal(result[flag], false);
  assert.equal(JSON.stringify(result).includes("private-session"), false);
});

test("deep or very large error wrappers have bounded processing", () => {
  let value = { message: "Trial expired" };
  for (let depth = 0; depth < 10; depth++) value = { value };
  assert.equal(publicDriverHttpResponse(500, JSON.stringify(value)).quotaExceeded, false);
  const result = publicDriverHttpResponse(500, JSON.stringify({ errors: Array.from({ length: 20 }, (_, i) =>
    ({ message: i < 16 ? "Unknown error" : "Trial expired" })) }));
  assert.equal(result.quotaExceeded, false);
});

const providerMetrics = { parallel_sessions_running: 0, team_parallel_sessions_max_allowed: 1,
  parallel_sessions_max_allowed: 1, queued_sessions: 0, queued_sessions_max_allowed: 5 };

test("plan diagnostics whitelist capacity counters without credentials, account names or error text", () => {
  const result = publicProviderPlan(200, { ...providerMetrics, automate_plan: "private-account-plan",
    access_key: "synthetic-private-key", error: "https://private.test/session" });
  assert.equal(result.ok, true);
  assert.equal(result.parallelCapacityAvailable, true);
  assert.equal(result.trialMinutesRemaining, "NOT_MEASURED");
  for (const value of ["private-account-plan", "synthetic-private-key", "private.test"]) {
    assert.equal(JSON.stringify(result).includes(value), false);
  }
  assert.equal(publicProviderPlan(200, { ...providerMetrics, parallel_sessions_running: 1 }).parallelCapacityAvailable, false);
});

test("malformed or unauthorized plan responses cannot claim available capacity", () => {
  for (const payload of [null, [], {}, { ...providerMetrics, queued_sessions: -1 },
    { ...providerMetrics, parallel_sessions_max_allowed: "1" }]) {
    const result = publicProviderPlan(200, payload);
    assert.equal(result.ok, false);
    assert.equal(result.parallelCapacityAvailable, null);
  }
  const denied = publicProviderPlan(401, providerMetrics);
  assert.equal(denied.ok, false);
  assert.equal(denied.authenticationFailure, true);
  assert.equal(denied.parallelCapacityAvailable, null);
});

test("provider-only mode cannot be mixed with browser targets", () => {
  const result = spawnSync(process.execPath, ["scripts/run-browserstack-compat.mjs"], {
    env: { ...process.env, BROWSERSTACK_USERNAME: "", BROWSERSTACK_ACCESS_KEY: "", REAL_BROWSER_TARGETS: "provider-preflight,iphone-safari-real" },
    encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported BrowserStack target ids: provider-preflight/);
  assert.ok(!result.stdout.includes("starting"));
});

test('provider diagnostics retain the failure category without credentials or session payloads', () => {
  const error = new Error('Trial expired: https://qa-user:synthetic-private-key@example.invalid/session/private-session');
  const result = publicDriverFailure(error);
  assert.equal(result.quotaExceeded, true);
  assert.equal(Object.values(result).every(value => typeof value === 'boolean'), true);
  for (const value of ['qa-user', 'synthetic-private-key', 'private-session', 'example.invalid']) {
    assert.equal(JSON.stringify(result).includes(value), false);
  }
});

test('an unknown driver failure is not assigned an invented provider cause', () => {
  assert.equal(Object.values(publicDriverFailure(new Error('Unclassified failure'))).some(Boolean), false);
});

test('exhausted trials and limits followed by exceeded retain only quota flags', () => {
  for (const message of ['BROWSERSTACK_TRIAL_EXHAUSTED', 'Automation time limit exceeded']) {
    const result = publicDriverFailure(new Error(message + ': synthetic-private-key'));
    assert.equal(result.quotaExceeded, true);
    assert.equal(JSON.stringify(result).includes('synthetic-private-key'), false);
  }
  assert.equal(publicDriverFailure(new Error('Upgrade your plan to enable this product')).planUnavailable, true);
});

test("keyboard dismissal uses the device protocol only in native context and restores the web context", async () => {
  let context = "WEBVIEW_TEST";
  const definitions = new Map();
  const driver = {
    getExecutor: () => ({ defineCommand(name, method, route) { definitions.set(name, { method, route }); } }),
    execute: async item => {
      if (item.getName() === "qaGetContext") return context;
      if (item.getName() === "qaGetContexts") return [context, "NATIVE_APP"];
      if (item.getName() === "qaSetContext") context = item.getParameters().name;
      if (item.getName() === "qaHideKeyboard") {
        assert.equal(context, "NATIVE_APP");
        assert.deepEqual(item.getParameters(), { keyName: "Done" });
      }
    },
  };
  await hideNativeDeviceKeyboard(driver, true);
  assert.equal(context, "WEBVIEW_TEST");
  assert.deepEqual(definitions.get("qaHideKeyboard"), { method: "POST", route: "/session/:sessionId/appium/device/hide_keyboard" });
});

test("native context is restored when a device command fails and unavailable contexts fail closed", async () => {
  const calls = [];
  let context = "WEBVIEW_TEST";
  let available = ["NATIVE_APP", context];
  const driver = {
    getExecutor: () => ({ defineCommand() {} }),
    execute: async item => {
      calls.push(item.getName());
      if (item.getName() === "qaGetContext") return context;
      if (item.getName() === "qaGetContexts") return available;
      if (item.getName() === "qaSetContext") context = item.getParameters().name;
    },
  };
  await assert.rejects(withNativeDeviceContext(driver, async () => {
    assert.equal(context, "NATIVE_APP");
    throw new Error("device command unsupported");
  }), /device command unsupported/);
  assert.equal(context, "WEBVIEW_TEST");
  assert.deepEqual(calls.slice(-2), ["qaSetContext", "qaSetContext"]);
  available = ["WEBVIEW_TEST"];
  await assert.rejects(withNativeDeviceContext(driver, async () => assert.fail("must not run")), /NATIVE_DEVICE_CONTEXT_UNAVAILABLE/);
  assert.equal(context, "WEBVIEW_TEST");
});

test("macOS discovers system and per-user vendor browsers without Windows paths", async () => {
  const targets = getBrowserTargets("darwin", { HOME: "/Users/qa" });
  const resolved = await Promise.all(targets.map((target) => resolveTarget(target, async (candidate) => candidate === "/Users/qa/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge")));
  assert.equal(selectRunnableTargets(resolved, ["edge"])[0].executablePath, "/Users/qa/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge");
  assert.ok(targets.every((target) => target.candidates.every((candidate) => !candidate.includes("undefined") && !candidate.endsWith(".exe"))));
});

test("a requested missing browser cannot pass because another browser is installed", () => {
  const targets = [{ id: "chrome", executablePath: "/browser/chrome" }, { id: "edge" }];
  assert.throws(() => selectRunnableTargets(targets, ["chrome", "edge"]), /not installed: edge/);
  assert.throws(() => selectRunnableTargets(targets, ["firefox"]), /Unsupported.*firefox/);
  assert.throws(() => selectRunnableTargets([{ id: "chrome" }]), /No supported/);
  assert.deepEqual(selectRunnableTargets(targets).map((target) => target.id), ["chrome"]);
});

test("browser test origins cannot leak credentials or tokens into test reports", () => {
  assert.equal(validateBrowserBaseUrl("http://127.0.0.1:4229/"), "http://127.0.0.1:4229");
  for (const value of ["http://qa:secret@localhost", "https://example.test?token=x", "https://example.test#token=x", "file:///Applications", "https://example.test/admin"]) {
    assert.throws(() => validateBrowserBaseUrl(value));
  }
});

test("Windows discovery ignores absent roots and uses the configured per-user installation", async () => {
  const targets = getBrowserTargets("win32", { LOCALAPPDATA: "C:\\Users\\qa\\AppData\\Local" });
  const resolved = await resolveTarget(targets.find((target) => target.id === "chrome"), async () => true);
  assert.equal(resolved.executablePath, "C:\\Users\\qa\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe");
});

test("a partially misspelled cloud target list fails before sessions are created", () => {
  const result = spawnSync(process.execPath, ["scripts/run-browserstack-compat.mjs"], {
    env: { ...process.env, BROWSERSTACK_USERNAME: "", BROWSERSTACK_ACCESS_KEY: "", REAL_BROWSER_BASE_URL: "http://127.0.0.1:4229", REAL_BROWSER_TARGETS: "windows-chrome,windows-edeg" },
    encoding: "utf8", timeout: 5000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported BrowserStack target ids: windows-edeg/);
  assert.ok(!result.stdout.includes("starting"));
});

test("device evidence includes returned versions but excludes provider credentials and URLs", () => {
  const identity = publicDeviceIdentity({ browserName: "safari", browserVersion: "18.7", accessKey: "never-copy", "appium:platformVersion": "18.7" },
    { device: "iPhone 16", os: "ios", os_version: "18.7", browser: "safari", public_url: "https://private.test/session", userName: "never-copy" });
  assert.deepEqual(identity, { browserName: "safari", browserVersion: "18.7", os: "ios", osVersion: "18.7", deviceName: "iPhone 16" });
  assert.ok(!JSON.stringify(identity).includes("never-copy"));
  assert.equal(publicDeviceIdentity({ browserVersion: "https://private.test?token=secret" }).browserVersion, null);
});

const motion = { activeFrames: 14, states: ["waiting", "flying", "settling", "done"], reducedMotion: false,
  maxAlignmentError: .5, maxButtonShift: 0, squareRatio: 1, insideViewport: true, hasViewBox: false };

test("actual Selenium capabilities are read through their supported get API", () => {
  const caps = new Capabilities({ browserName: "chrome", browserVersion: "141.0.7390.65", platformName: "android", "appium:platformVersion": "13.0", "appium:deviceName": "Samsung Galaxy S23 Ultra", accessKey: "never-copy" });
  assert.equal(typeof caps.entries, "undefined");
  assert.deepEqual(publicDeviceIdentity(caps), { browserName: "chrome", browserVersion: "141.0.7390.65", os: "android", osVersion: "13.0", deviceName: "Samsung Galaxy S23 Ultra" });
});

test("motion evidence cannot pass without actual animation frames or with a shifted landing frame", () => {
  assert.equal(assertMobileMotion(motion), true);
  assert.throws(() => assertMobileMotion({ ...motion, activeFrames: 0 }), /MOTION_NOT_OBSERVED/);
  assert.throws(() => assertMobileMotion({ ...motion, maxAlignmentError: 3 }), /MOTION_FRAME_MISALIGNED/);
  assert.throws(() => assertMobileMotion({ ...motion, maxButtonShift: 6 }), /FLOATING_BUTTON_JUMPED/);
  assert.throws(() => assertMobileMotion({ ...motion, squareRatio: 2 }), /MOBILE_BUTTON_GEOMETRY_INVALID/);
});

test("reduced motion requires measured settling frames without demanding a meteor flight", () => {
  assert.equal(assertMobileMotion({ ...motion, reducedMotion: true, states: ["settling", "done"] }), true);
  assert.throws(() => assertMobileMotion({ ...motion, states: ["settling", "done"] }), /MOTION_PHASE_MISSING/);
});
