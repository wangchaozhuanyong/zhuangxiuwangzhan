import { Builder, By, until } from "selenium-webdriver";

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const baseUrl = (process.env.REAL_BROWSER_BASE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const buildName = process.env.BROWSERSTACK_BUILD_NAME || `flashcast-real-browser-${new Date().toISOString()}`;
const selectedTargets = (process.env.REAL_BROWSER_TARGETS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);

const pages = [
  {
    path: "/zh",
    selectors: [".site-header__brand", "main", "footer", 'a[href^="tel:"]'],
    minTextLength: 800,
  },
  {
    path: "/en",
    selectors: [".site-header__brand", "main", "footer", 'a[href^="tel:"]'],
    minTextLength: 800,
  },
  {
    path: "/zh/services",
    selectors: [".site-header__brand", "main", "footer", 'a[href*="/quote"]'],
    minTextLength: 800,
  },
  {
    path: "/zh/materials",
    selectors: [".site-header__brand", "main", "footer"],
    minTextLength: 500,
  },
  {
    path: "/zh/projects",
    selectors: [".site-header__brand", "main", "footer", 'a[href*="/quote"]'],
    minTextLength: 500,
  },
  {
    path: "/zh/quote",
    selectors: ["main", "#quote-name", "#quote-phone", "#quote-project-type", "#quote-details"],
    minTextLength: 500,
  },
  {
    path: "/zh/contact",
    selectors: ["main", "#contact-name", "#contact-phone", "#contact-message", 'a[href^="tel:"]'],
    minTextLength: 500,
  },
  {
    path: "/admin",
    selectors: ['input[type="email"]', 'input[type="password"]', 'button[type="submit"]'],
    minTextLength: 100,
  },
];

const targets = [
  {
    id: "windows-chrome",
    browserName: "Chrome",
    browserVersion: "latest",
    options: { os: "Windows", osVersion: "11" },
  },
  {
    id: "windows-edge",
    browserName: "Edge",
    browserVersion: "latest",
    options: { os: "Windows", osVersion: "11" },
  },
  {
    id: "windows-firefox",
    browserName: "Firefox",
    browserVersion: "latest",
    options: { os: "Windows", osVersion: "11" },
  },
  {
    id: "macos-safari",
    browserName: "Safari",
    browserVersion: "latest",
    options: { os: "OS X", osVersion: "Sonoma" },
  },
  {
    id: "iphone-safari-real",
    browserName: "safari",
    options: { deviceName: "iPhone 16", osVersion: "18", deviceOrientation: "portrait" },
  },
  {
    id: "android-chrome-real",
    browserName: "chrome",
    options: { deviceName: "Samsung Galaxy S23 Ultra", osVersion: "13.0", deviceOrientation: "portrait" },
  },
];

const filteredTargets = selectedTargets.length > 0 ? targets.filter((target) => selectedTargets.includes(target.id)) : targets;

const failFast = (message) => {
  console.error(message);
  process.exit(1);
};

if (!username || !accessKey) {
  failFast("Missing BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY. Add them as environment variables or GitHub Actions secrets.");
}

if (filteredTargets.length === 0) {
  failFast(`No BrowserStack targets matched REAL_BROWSER_TARGETS=${process.env.REAL_BROWSER_TARGETS}`);
}

const setSessionStatus = async (driver, status, reason) => {
  const payload = {
    action: "setSessionStatus",
    arguments: { status, reason },
  };

  try {
    await driver.executeScript(`browserstack_executor: ${JSON.stringify(payload)}`);
  } catch {
    // BrowserStack status marking is helpful, but the test result is still decided locally.
  }
};

const waitForVisible = async (driver, selector, timeoutMs = 20_000) => {
  const element = await driver.wait(until.elementLocated(By.css(selector)), timeoutMs);
  await driver.wait(async () => element.isDisplayed(), timeoutMs);
  return element;
};

const runPageChecks = async (driver, page) => {
  await driver.get(`${baseUrl}${page.path}`);

  for (const selector of page.selectors) {
    await waitForVisible(driver, selector);
  }

  const result = await driver.executeScript(() => {
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
  if (result.bodyTextLength < page.minTextLength) errors.push(`text too short: ${result.bodyTextLength}`);
  if (result.hasReplacementCharacter) errors.push("replacement character found");
  if (result.scrollWidth > result.clientWidth + 1) errors.push(`horizontal overflow: ${result.scrollWidth} > ${result.clientWidth}`);
  if (result.visibleBrokenImageCount > 0) errors.push(`visible broken images: ${result.visibleBrokenImageCount}`);
  if (!result.supportsCssGrid) errors.push("CSS Grid unsupported");
  if (!result.supportsFlex) errors.push("Flexbox unsupported");
  if (!result.supportsClamp) errors.push("CSS clamp unsupported");
  if (!result.supportsFetch) errors.push("fetch unsupported");

  if (errors.length > 0) {
    throw new Error(`${page.path}: ${errors.join("; ")}`);
  }
};

const runTarget = async (target) => {
  const capabilities = {
    browserName: target.browserName,
    ...(target.browserVersion ? { browserVersion: target.browserVersion } : {}),
    "bstack:options": {
      userName: username,
      accessKey,
      projectName: "Flashcast website",
      buildName,
      sessionName: target.id,
      debug: true,
      networkLogs: true,
      video: true,
      ...target.options,
    },
  };

  const driver = await new Builder()
    .usingServer("https://hub.browserstack.com/wd/hub")
    .withCapabilities(capabilities)
    .build();

  try {
    for (const page of pages) {
      await runPageChecks(driver, page);
    }

    await setSessionStatus(driver, "passed", "Core pages rendered and stayed usable.");
    return { id: target.id, ok: true };
  } catch (error) {
    await setSessionStatus(driver, "failed", error instanceof Error ? error.message : String(error));
    return { id: target.id, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await driver.quit();
  }
};

const results = [];

for (const target of filteredTargets) {
  console.log(`[real-browser] ${target.id} starting`);
  const result = await runTarget(target);
  results.push(result);
  console.log(`[real-browser] ${target.id} ${result.ok ? "passed" : `failed: ${result.error}`}`);
}

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({ ok: failed.length === 0, baseUrl, buildName, results }, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
