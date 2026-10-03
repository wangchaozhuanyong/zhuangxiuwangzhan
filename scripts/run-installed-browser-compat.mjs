import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Browser test base URL must be an HTTP(S) origin without credentials, query or fragment.");
  }
  return url.origin;
}

export function publicDeviceIdentity(capabilities = {}, session = {}) {
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
