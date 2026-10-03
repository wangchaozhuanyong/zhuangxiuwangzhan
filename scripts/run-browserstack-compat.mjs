import { Builder, By } from "selenium-webdriver";
import input from "selenium-webdriver/lib/input.js";
import { validateBrowserBaseUrl, publicDeviceIdentity, assertMobileMotion } from "./run-installed-browser-compat.mjs";

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
const baseUrl = (process.env.REAL_BROWSER_BASE_URL || "https://flashcast.com.my").replace(/\/$/, "");
validateBrowserBaseUrl(baseUrl);
const buildName = process.env.BROWSERSTACK_BUILD_NAME || `flashcast-real-browser-${new Date().toISOString()}`;
const waitTimeoutMs = Number(process.env.REAL_BROWSER_WAIT_TIMEOUT_MS || 60_000);
const selectedTargets = (process.env.REAL_BROWSER_TARGETS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);
const brandSelector = ".scheme-a-chrome__brand";

const pages = [
  {
    path: "/zh",
    selectors: [brandSelector, "main", "footer", 'a[href^="tel:"]'],
    minTextLength: 800,
  },
  {
    path: "/en",
    selectors: [brandSelector, "main", "footer", 'a[href^="tel:"]'],
    minTextLength: 800,
  },
  {
    path: "/zh/services",
    selectors: [brandSelector, "main", "footer", 'a[href*="/quote"]'],
    minTextLength: 800,
  },
  {
    path: "/zh/materials",
    selectors: [brandSelector, "main", "footer"],
    minTextLength: 500,
  },
  {
    path: "/zh/projects",
    selectors: [brandSelector, "main", "footer", 'a[href*="/quote"]'],
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
    options: { deviceName: "iPhone 16", osVersion: "18", deviceOrientation: "portrait", realMobile: true },
  },
  {
    id: "android-chrome-real",
    browserName: "chrome",
    options: { deviceName: "Samsung Galaxy S23 Ultra", osVersion: "13.0", deviceOrientation: "portrait", realMobile: true },
  },
];

const filteredTargets = selectedTargets.length > 0 ? targets.filter((target) => selectedTargets.includes(target.id)) : targets;

const failFast = (message) => {
  console.error(message);
  process.exit(1);
};

const unknownTargets = selectedTargets.filter((id) => !targets.some((target) => target.id === id));
if (unknownTargets.length) {
  failFast(`Unsupported BrowserStack target ids: ${unknownTargets.join(", ")}`);
}

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

const waitForVisible = async (driver, selector, timeoutMs = waitTimeoutMs) => {
  await driver.wait(async () => {
    return driver.executeScript((cssSelector) => {
      const elements = Array.from(document.querySelectorAll(cssSelector));

      return elements.some((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
      });
    }, selector);
  }, timeoutMs, `${selector} did not become visible within ${timeoutMs}ms`);
};

const getPageDiagnostics = async (driver, selector) =>
  driver.executeScript((cssSelector) => {
    const bodyText = document.body?.innerText || "";
    return {
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      selectorCount: document.querySelectorAll(cssSelector).length,
      mainCount: document.querySelectorAll("main").length,
      bodyTextLength: bodyText.trim().length,
      bodyTextStart: bodyText.trim().slice(0, 180),
    };
  }, selector);

const runPageChecks = async (driver, page) => {
  await driver.get(`${baseUrl}${page.path}`);

  for (const selector of page.selectors) {
    try {
      await waitForVisible(driver, selector);
    } catch (error) {
      const diagnostics = await getPageDiagnostics(driver, selector);
      throw new Error(
        `${page.path}: ${selector} not visible (${error instanceof Error ? error.message : String(error)}; diagnostics=${JSON.stringify(diagnostics)})`,
      );
    }
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

const ready = driver => driver.wait(() => driver.executeScript(() => !!document.querySelector("main")
  && !document.documentElement.dataset.publicRouteLoading && !document.querySelector('[data-route-pending="true"]')), waitTimeoutMs);

const touch = async (driver, selector) => {
  await waitForVisible(driver, selector);
  const position = await driver.executeScript(css => {
    const rect = document.querySelector(css).getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
  }, selector);
  const finger = new input.Pointer("qa-finger", input.Pointer.Type.TOUCH);
  await driver.actions({ async: true }).insert(finger, finger.move(position), finger.press(), finger.release()).perform();
};

const swipeTo = async (driver, selector) => {
  for (let round = 0; round < 16; round++) {
    const geometry = await driver.executeScript(css => {
      const rect = document.querySelector(css)?.getBoundingClientRect();
      const viewport = window.visualViewport;
      return { top: rect?.top ?? null, bottom: rect?.bottom ?? null, height: viewport?.height || innerHeight, width: innerWidth, offset: viewport?.offsetTop || 0 };
    }, selector);
    if (geometry.top === null) throw new Error("CONTROL_MISSING");
    if (geometry.top > geometry.offset + 85 && geometry.bottom < geometry.offset + geometry.height - 100) return;
    const down = geometry.top > geometry.offset + geometry.height / 2;
    const finger = new input.Pointer("qa-scroll", input.Pointer.Type.TOUCH);
    const x = Math.round(geometry.width * .4);
    const first = Math.round(geometry.height * (down ? .72 : .32));
    const last = Math.round(geometry.height * (down ? .32 : .72));
    await driver.actions({ async: true }).insert(finger, finger.move({ x, y: first }), finger.press(),
      finger.move({ x, y: last, duration: 350 }), finger.release()).perform();
  }
  throw new Error("CONTROL_NOT_REACHABLE_BY_TOUCH");
};

const captureMotion = async driver => {
  await driver.executeScript(() => {
  window.__qaMotion = { complete: false };
  const done = observation => { window.__qaMotion = { complete: true, observation }; };
  const start = performance.now();
  const states = new Set();
  let activeFrames = 0, maxAlignmentError = 0, maxButtonShift = 0, original, minimumViewportHeight = Infinity, maximumViewportHeight = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sample = () => {
    const entry = document.querySelector(".fc-furniture-floating");
    const scene = document.querySelector(".fc-furniture-arrival");
    const status = entry?.dataset.arrival;
    if (status) states.add(status);
    const box = entry?.getBoundingClientRect();
    const viewportHeight = visualViewport?.height || innerHeight;
    minimumViewportHeight = Math.min(minimumViewportHeight, viewportHeight);
    maximumViewportHeight = Math.max(maximumViewportHeight, viewportHeight);
    if (box?.width > 1) {
      if (!original) original = box;
      maxButtonShift = Math.max(maxButtonShift, Math.abs(box.x - original.x), Math.abs(box.y - original.y));
      if (scene?.dataset.active === "true") {
        const canvas = scene.getBoundingClientRect();
        const outline = scene.querySelector("[data-arrival-border] rect");
        const x = Number(outline?.getAttribute("x")), y = Number(outline?.getAttribute("y"));
        const width = Number(outline?.getAttribute("width")), height = Number(outline?.getAttribute("height"));
        if (outline?.hasAttribute("x")) {
          activeFrames++;
          maxAlignmentError = Math.max(maxAlignmentError, Math.abs(canvas.x + x - box.x - .5), Math.abs(canvas.y + y - box.y - .5),
            Math.abs(width - box.width + 1), Math.abs(height - box.height + 1));
        }
      }
    }
    if (status === "done" || status === "skipped" || performance.now() - start > 12000) {
      done({ states: [...states], activeFrames, reducedMotion, maxAlignmentError, maxButtonShift,
        minimumViewportHeight, maximumViewportHeight,
        hasViewBox: scene?.hasAttribute("viewBox") ?? true, squareRatio: box?.width / box?.height,
        insideViewport: !!box && box.left >= 0 && box.right <= innerWidth + 1 && box.top >= 0 && box.bottom <= innerHeight + 1 });
      return;
    }
    requestAnimationFrame(sample);
  };
  sample();
  });
  await driver.wait(() => driver.executeScript(() => window.__qaMotion?.complete === true), 15000);
  return driver.executeScript(() => window.__qaMotion.observation);
};

const mobileChecks = async (driver, target, identity) => {
  const checks = [];
  const check = async (name, action) => {
    try { checks.push({ name, passed: true, metrics: await action() }); }
    catch (error) { const text = error instanceof Error ? error.message : "";
      checks.push({ name, passed: false, code: /^[A-Z][A-Z0-9_]+$/.test(text) ? text : "WEBDRIVER_OR_CHECK_FAILED", errorKind: error?.constructor?.name || "Unknown",
        diagnostics: { unsupported: /unsupported|not implemented|not supported/i.test(text), invalidArgument: /invalid argument/i.test(text), viewport: /viewport|out of bounds/i.test(text), timeout: /timed out|timeout|Waiting/i.test(text) }, ...(error.metrics ? {metrics:error.metrics} : {}) }); }
  };
  await check("returned_device_versions", async () => {
    if (!identity.browserVersion || !identity.osVersion || !identity.deviceName || !/ios|android/i.test(identity.os || "")) throw new Error("DEVICE_IDENTITY_NOT_RETURNED");
    return { ...identity, realMobileRequested: target.options.realMobile === true };
  });
  await check("first_home_motion_and_landing", async () => {
    await driver.get(`${baseUrl}/zh`);
    const observation = await captureMotion(driver);
    try { assertMobileMotion(observation); } catch(error) { error.metrics = observation; throw error; }
    return observation;
  });
  await check("native_menu_close_and_navigation", async () => {
    await driver.get(`${baseUrl}/zh/services`); await ready(driver);
    const trigger = ".scheme-a-chrome__menu-trigger--compact";
    await touch(driver, trigger);
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "open"), waitTimeoutMs);
    await touch(driver, ".scheme-a-directory__close");
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "closed"), waitTimeoutMs);
    const restored = await driver.executeScript(css => document.activeElement === document.querySelector(css), trigger);
    if (!restored) throw new Error("MENU_FOCUS_NOT_RESTORED");
    await touch(driver, trigger);
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "open"), waitTimeoutMs);
    const group = '[aria-controls="scheme-a-directory-group-spaces"]';
    if (await (await driver.findElement(By.css(group))).getAttribute("aria-expanded") !== "true") await touch(driver, group);
    await touch(driver, '#scheme-a-directory a[href="/zh/projects"]');
    await driver.wait(() => driver.executeScript(() => location.pathname === "/zh/projects" && document.querySelector("#scheme-a-directory")?.dataset.state === "closed"), waitTimeoutMs);
    return { focusRestored: restored, nativeTouchNavigation: true };
  });
  await check("native_language_switch", async () => {
    await driver.get(`${baseUrl}/zh/projects`); await ready(driver);
    await touch(driver, '.scheme-a-language-option[lang="en"]');
    await driver.wait(() => driver.executeScript(() => location.pathname === "/en/projects" && document.documentElement.lang.startsWith("en") && !document.documentElement.dataset.publicRouteLoading), waitTimeoutMs);
    const title = await driver.executeScript(() => document.querySelector("main h1")?.textContent || "");
    if (!/[A-Za-z]{3}/.test(title) || /[\u4e00-\u9fff]/.test(title)) throw new Error("LANGUAGE_CONTENT_NOT_UPDATED");
    await touch(driver, '.scheme-a-language-option[lang="zh-CN"]');
    await driver.wait(() => driver.executeScript(() => location.pathname === "/zh/projects" && document.documentElement.lang.startsWith("zh")), waitTimeoutMs);
    return { switchedToEnglish: true, switchedBackToChinese: true };
  });
  await check("floating_press_feedback_and_shop_open", async () => {
    await driver.get(`${baseUrl}/zh/services`); await ready(driver);
    await driver.executeScript(() => {
      window.__qaFloatingPress = null;
      const entry = document.querySelector(".fc-furniture-floating");
      entry.addEventListener("pointerdown", event => setTimeout(() => {
        window.__qaFloatingPress = { pointer: event.pointerType, pressed: entry.dataset.pressed === "true", transform: getComputedStyle(entry.querySelector(".fc-furniture-floating__icon")).transform };
      }, 100), { once: true });
    });
    const before = await driver.getAllWindowHandles();
    const position = await driver.executeScript(() => {
      const rect = document.querySelector(".fc-furniture-floating").getBoundingClientRect();
      return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
    });
    const finger = new input.Pointer("qa-press", input.Pointer.Type.TOUCH);
    await driver.actions({ async: true }).insert(finger, finger.move(position), finger.press(), { type: "pause", duration: 250 }, finger.release()).perform();
    const feedback = await driver.executeScript(() => window.__qaFloatingPress);
    if (!feedback?.pressed || feedback.pointer !== "touch" || feedback.transform === "none") throw new Error("PRESS_FEEDBACK_NOT_OBSERVED");
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > before.length, 15000);
    const added = (await driver.getAllWindowHandles()).filter(handle => !before.includes(handle));
    try {
      await driver.switchTo().window(added[0]);
      await driver.wait(async () => new URL(await driver.getCurrentUrl()).hostname === "shop.flashcast.com.my", 15000);
    } finally {
      for (const handle of added) { await driver.switchTo().window(handle); await driver.close(); }
      await driver.switchTo().window(before[0]);
    }
    return { touchPressFeedback: true, shopOpened: true, testTabClosed: true };
  });
  await check("contact_keyboard_and_invalid_input", async () => {
    await driver.get(`${baseUrl}/zh/contact`); await ready(driver);
    await swipeTo(driver, "#contact-name");
    const viewportBefore = await driver.executeScript(() => visualViewport?.height || innerHeight);
    await touch(driver, "#contact-name");
    try { await driver.wait(() => driver.executeScript(before => (visualViewport?.height || innerHeight) < before - 50, viewportBefore), 10000); }
    catch (error) {
      error.metrics = await driver.executeScript(before => ({ keyboardHeightBefore: before, keyboardHeightAfter: visualViewport?.height || innerHeight, focusedName: document.activeElement.id === "contact-name", typedNamePresent: document.querySelector("#contact-name")?.value === "QA keyboard only" }), viewportBefore);
      throw error;
    }
    const keyboard = await driver.executeScript(() => {
      const rect = document.activeElement.getBoundingClientRect(); const view = visualViewport;
      return { height: view?.height || innerHeight, focusedName: document.activeElement.id === "contact-name", inputVisible: rect.top >= (view?.offsetTop || 0) && rect.bottom <= (view?.offsetTop || 0) + (view?.height || innerHeight) };
    });
    if (!keyboard.focusedName || !keyboard.inputVisible) throw new Error("KEYBOARD_COVERS_ACTIVE_INPUT");
    await (await driver.findElement(By.css("#contact-name"))).sendKeys("QA keyboard only");
    const typed = await driver.executeScript(() => document.querySelector("#contact-name")?.value === "QA keyboard only");
    if (!typed) throw new Error("NATIVE_KEYBOARD_INPUT_NOT_UPDATED");
    await touch(driver, ".scheme-a-chrome__menu-trigger--compact");
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "open"), waitTimeoutMs);
    await touch(driver, ".scheme-a-directory__close");
    await driver.wait(() => driver.executeScript(before => (visualViewport?.height || innerHeight) >= before - 10, viewportBefore), 10000);
    await swipeTo(driver, 'main form button[type="submit"]');
    const resourceCount = await driver.executeScript(() => performance.getEntriesByType("resource").filter(item => item.name.includes("/functions/v1/submit-lead")).length);
    const missingPhone = await (await driver.findElement(By.css("#contact-phone"))).getAttribute("value");
    if (missingPhone) throw new Error("NEGATIVE_FORM_GUARD_NOT_EMPTY");
    await touch(driver, 'main form button[type="submit"]');
    await driver.wait(() => driver.executeScript(() => document.querySelector("#contact-phone")?.getAttribute("aria-invalid") === "true" && !!document.querySelector("#contact-phone-error")?.textContent), waitTimeoutMs);
    const noRequest = await driver.executeScript(before => performance.getEntriesByType("resource").filter(item => item.name.includes("/functions/v1/submit-lead")).length === before, resourceCount);
    if (!noRequest) throw new Error("INVALID_FORM_SENT_NETWORK_REQUEST");
    return { keyboardHeightBefore: viewportBefore, keyboardHeightAfter: keyboard.height, inputVisible: true, keyboardDismissed: true, invalidPhoneDisplayed: true, leadRequestSent: false };
  });
  await check("quote_invalid_form_focus_and_message", async () => {
    await driver.get(`${baseUrl}/zh/quote`); await ready(driver);
    await swipeTo(driver, 'main form button[type="submit"]');
    const empty = await driver.executeScript(() => !document.querySelector("#quote-name")?.value && !document.querySelector("#quote-phone")?.value);
    if (!empty) throw new Error("NEGATIVE_FORM_GUARD_NOT_EMPTY");
    const before = await driver.executeScript(() => performance.getEntriesByType("resource").filter(item => item.name.includes("/functions/v1/submit-lead")).length);
    await touch(driver, 'main form button[type="submit"]');
    await driver.wait(() => driver.executeScript(() => document.querySelector("#quote-name")?.getAttribute("aria-invalid") === "true" && !!document.querySelector("#quote-name-error")?.textContent && document.activeElement.id === "quote-name"), waitTimeoutMs);
    const noRequest = await driver.executeScript(count => performance.getEntriesByType("resource").filter(item => item.name.includes("/functions/v1/submit-lead")).length === count, before);
    if (!noRequest) throw new Error("INVALID_FORM_SENT_NETWORK_REQUEST");
    return { validationMessagePresent: true, firstInvalidFieldFocused: true, leadRequestSent: false };
  });
  await check("faq_whatsapp_destination", async () => {
    await driver.get(`${baseUrl}/en/faq`); await ready(driver);
    const valid = await driver.executeScript(() => Array.from(document.querySelectorAll("main a")).filter(link => /whatsapp/i.test(link.textContent || ""))
      .some(link => link.href.startsWith("https://wa.me/") && link.target === "_blank"));
    if (!valid) throw new Error("FAQ_WHATSAPP_TARGET_INVALID");
    return { whatsappTargetVerified: true, clickedExternalMessageLink: false };
  });
  await check("blog_floating_content_clearance", async () => {
    await driver.get(`${baseUrl}/zh/blog`); await ready(driver);
    const measures = [];
    for (let round = 0; round < 3; round++) {
      measures.push(await driver.executeScript(() => {
        const floating = document.querySelector(".fc-furniture-floating").getBoundingClientRect();
        const overlaps = Array.from(document.querySelectorAll(".fc-blog-articles img, .fc-blog-articles a, .fc-blog-articles p, .fc-blog-topics button")).filter(element => {
          const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.height > 0
            && Math.min(rect.right, floating.right) > Math.max(rect.left, floating.left) && Math.min(rect.bottom, floating.bottom) > Math.max(rect.top, floating.top);
        }).length;
        return { overlaps, overflow: document.documentElement.scrollWidth - innerWidth };
      }));
      const size = await driver.executeScript(() => ({ width: innerWidth, height: innerHeight }));
      const finger = new input.Pointer("qa-blog-scroll", input.Pointer.Type.TOUCH);
      const x = Math.round(size.width * .4);
      await driver.actions({ async: true }).insert(finger, finger.move({ x, y: Math.round(size.height * .7) }), finger.press(),
        finger.move({ x, y: Math.round(size.height * .3), duration: 350 }), finger.release()).perform();
    }
    if (measures.some(item => item.overlaps || item.overflow > 1)) throw new Error("BLOG_FLOATING_OVERLAP");
    return { inspectedScrollPositions: measures.length, overlaps: 0 };
  });
  return checks;
};

const runTarget = async (target) => {
  const capabilities = {
    browserName: target.browserName,
    pageLoadStrategy: "eager",
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

  let driver, stage = "session_creation", identity = {}, advancedChecks = [], refreshed = [];
  try {
    driver = await new Builder().usingServer("https://hub.browserstack.com/wd/hub").withCapabilities(capabilities).build();
    await driver.manage().setTimeouts({ pageLoad: 90_000, script: 45_000 });
    stage = "returned_capabilities";
    const returned = await driver.getCapabilities();
    let details = {};
    try { const value = await driver.executeScript('browserstack_executor: {"action":"getSessionDetails"}'); details = typeof value === "string" ? JSON.parse(value) : value; } catch { /* Capabilities remain the fallback. */ }
    identity = publicDeviceIdentity(returned, details || {});
    if (!identity.browserVersion) {
      const observedVersion = await driver.executeScript(() => navigator.userAgent.match(/Chrome\/(\d+(?:\.\d+){0,5})/)?.[1]
        || navigator.userAgent.match(/Version\/(\d+(?:\.\d+){0,5})/)?.[1] || null);
      if (typeof observedVersion === "string" && /^\d+(?:\.\d+){0,5}$/.test(observedVersion)) identity.browserVersion = observedVersion;
    }
    stage = "mobile_interactions";
    advancedChecks = target.options.deviceName ? await mobileChecks(driver, target, identity) : [];

    for (const page of pages) {
      stage = `basic_page_${pages.indexOf(page) + 1}`;
      await runPageChecks(driver, page);
    }

    await runPageChecks(driver, pages[0]);
    stage = "homepage_refreshes";
    for (let round = 0; round < 3; round++) {
      const previousDocument = await driver.executeScript(() => performance.timeOrigin);
      await driver.navigate().refresh();
      let motion;
      if (target.options.deviceName) {
        motion = await captureMotion(driver);
        try { assertMobileMotion(motion); } catch (error) { advancedChecks.push({ name: `refresh_${round + 1}_motion`, passed: false, code: error.message, metrics: motion }); }
      }
      await waitForVisible(driver, brandSelector);
      await waitForVisible(driver, "main");
      await driver.wait(async () => driver.executeScript((previous) =>
        document.readyState === "complete" && performance.timeOrigin !== previous &&
        !document.querySelector(".public-update-notice") &&
        !document.querySelector('[data-route-pending="true"]'), previousDocument), waitTimeoutMs);
      const currentDocument = await driver.executeScript(() => performance.timeOrigin);
      await driver.sleep(1000);
      if (await driver.executeScript(() => performance.timeOrigin) !== currentDocument) {
        throw new Error("Native refresh unexpectedly navigated again after completing.");
      }
      refreshed.push({ round: round + 1, documentComplete: true, remainedStable: true, ...(motion ? { motion } : {}) });
    }
    const ok = advancedChecks.every(check => check.passed);
    await setSessionStatus(driver, ok ? "passed" : "failed", ok ? "Core pages, refreshes and mobile interactions passed." : "A recorded mobile interaction did not pass.");
    return { id: target.id, ok, identity, advancedChecks, refreshed };
  } catch (error) {
    if (driver) await setSessionStatus(driver, "failed", "Browser or page check failed; private driver details withheld.");
    return { id: target.id, ok: false, error: error?.constructor?.name || "CHECK_FAILED", stage, identity, advancedChecks, refreshed };
  } finally {
    if (driver) await driver.quit();
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
