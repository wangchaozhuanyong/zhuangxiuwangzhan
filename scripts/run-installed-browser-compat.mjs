import { access } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = (process.env.INSTALLED_BROWSER_BASE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const selectedTargets = (process.env.INSTALLED_BROWSER_TARGETS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);
const headless = process.env.INSTALLED_BROWSER_HEADLESS !== "0";

const env = process.env;
const browserTargets = [
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

const pages = [
  { path: "/zh", selectors: [".site-header__brand", "main", "footer", 'a[href^="tel:"]'], minTextLength: 800 },
  { path: "/en", selectors: [".site-header__brand", "main", "footer", 'a[href^="tel:"]'], minTextLength: 800 },
  { path: "/zh/services", selectors: [".site-header__brand", "main", "footer", 'a[href*="/quote"]'], minTextLength: 800 },
  { path: "/zh/materials", selectors: [".site-header__brand", "main", "footer"], minTextLength: 500 },
  { path: "/zh/projects", selectors: [".site-header__brand", "main", "footer", 'a[href*="/quote"]'], minTextLength: 500 },
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

const resolveTarget = async (target) => {
  for (const candidate of target.candidates) {
    if (await pathExists(candidate)) {
      return { ...target, executablePath: candidate };
    }
  }

  return target;
};

const waitForVisible = async (page, selector) => {
  const locator = page.locator(selector).first();
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

  const menuButton = page.locator('button[aria-controls="mobile-navigation"]');
  await menuButton.waitFor({ state: "visible", timeout: 20_000 });
  await menuButton.click();

  const menu = page.locator("#mobile-navigation");
  await menu.waitFor({ state: "visible", timeout: 20_000 });
  await menu.locator('a[href*="/services"]').first().click();
  await page.waitForURL(/\/zh\/services$/, { timeout: 20_000 });
  await menu.waitFor({ state: "hidden", timeout: 20_000 });
  await waitForVisible(page, "main");
};

const runTarget = async (target) => {
  const browser = await chromium.launch({
    executablePath: target.executablePath,
    headless,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    for (const spec of pages) {
      await assertPageHealthy(page, spec);
    }
    await assertMobileMenu(page);
    return { id: target.id, name: target.name, executablePath: target.executablePath, ok: true };
  } catch (error) {
    return { id: target.id, name: target.name, executablePath: target.executablePath, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await browser.close();
  }
};

const resolvedTargets = await Promise.all(browserTargets.map(resolveTarget));
const installedTargets = resolvedTargets.filter((target) => target.executablePath);
const runnableTargets =
  selectedTargets.length > 0 ? installedTargets.filter((target) => selectedTargets.includes(target.id)) : installedTargets;

if (runnableTargets.length === 0) {
  console.error("No supported local browser executable was found.");
  console.error(`Installed target ids detected: ${installedTargets.map((target) => target.id).join(", ") || "none"}`);
  process.exit(1);
}

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

console.log(JSON.stringify({ ok: failed.length === 0, baseUrl, headless, results, missingTargets }, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
