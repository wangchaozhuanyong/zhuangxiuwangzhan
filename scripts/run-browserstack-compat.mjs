import { Builder, By, WebDriver } from "selenium-webdriver";
import http from "selenium-webdriver/http/index.js";
import input from "selenium-webdriver/lib/input.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateBrowserBaseUrl, publicDeviceIdentity, assertRequestedDeviceIdentity, negativeLeadRequestGuard, publicQaMetrics, publicScreenshotPage, publicDriverFailure, publicProviderPlan, publicDriverHttpResponse, assertMobileMotion, withNativeDeviceContext, hideNativeDeviceKeyboard, closeBrowserSession } from "./run-installed-browser-compat.mjs";

const username = process.env.BROWSERSTACK_USERNAME;
const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
let baseUrl = (process.env.REAL_BROWSER_BASE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const requestedBuildName = process.env.BROWSERSTACK_BUILD_NAME || `flashcast-real-browser-${new Date().toISOString()}`;
const buildName = /^flashcast(?:-real-browser)?-[0-9T:.Z-]{1,40}$/.test(requestedBuildName) ? requestedBuildName : "NOT_RECORDED";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const artifactRunId = /^\d{1,24}$/.test(process.env.GITHUB_RUN_ID || "") ? process.env.GITHUB_RUN_ID : new Date().toISOString().replace(/[:.]/g, "-");
const artifactDirectory = path.join(projectRoot, "audits", "real-browser", artifactRunId);
const sourceRevision = /^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA || "") ? process.env.GITHUB_SHA : null;
const saveEvidence = async report => {
  await mkdir(artifactDirectory, { recursive: true });
  await writeFile(path.join(artifactDirectory, "report.json"), `${JSON.stringify({ ...report, sourceRevision, sanitized: true }, null, 2)}\n`);
};
const waitTimeoutMs = Number(process.env.REAL_BROWSER_WAIT_TIMEOUT_MS || 60_000);
const selectedTargets = (process.env.REAL_BROWSER_TARGETS || "")
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);
const brandSelector = ".scheme-a-chrome__brand";
const nativeTapDrivers = new WeakSet();

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
    // Request iOS 18; retain the supplier-returned minor version in the receipt.
    options: { deviceName: "iPhone 16", osVersion: "18", deviceOrientation: "portrait", realMobile: true },
  },
  {
    id: "android-chrome-real",
    browserName: "chrome",
    options: { deviceName: "Samsung Galaxy S23 Ultra", osVersion: "13.0", deviceOrientation: "portrait", realMobile: true },
  },
];

const filteredTargets = selectedTargets.length > 0 ? targets.filter((target) => selectedTargets.includes(target.id)) : targets;
const providerPreflightOnly = selectedTargets.length === 1 && selectedTargets[0] === "provider-preflight";

const failFast = async (message, code) => {
  await saveEvidence({ ok: false, status: "FAILED_BEFORE_SESSION", code, buildName,
    sessionCreationAttempted: false, websiteChecksRun: false, sanitized: true });
  console.error(message);
  process.exit(1);
};

try { baseUrl = validateBrowserBaseUrl(baseUrl); }
catch { await failFast("Invalid browser test base URL.", "INVALID_BASE_URL"); }

const unknownTargets = providerPreflightOnly ? [] : selectedTargets.filter((id) => !targets.some((target) => target.id === id));
if (unknownTargets.length) {
  await failFast(`Unsupported BrowserStack target ids: ${unknownTargets.join(", ")}`, "UNSUPPORTED_TARGETS");
}

if (!username || !accessKey) {
  await failFast("Missing BROWSERSTACK_USERNAME or BROWSERSTACK_ACCESS_KEY. Add them as environment variables or GitHub Actions secrets.", "MISSING_PROVIDER_CREDENTIALS");
}

if (filteredTargets.length === 0 && !providerPreflightOnly) {
  await failFast("No BrowserStack targets matched.", "NO_TARGETS");
}

if (providerPreflightOnly) {
  let plan;
  try {
    const response = await fetch("https://api.browserstack.com/automate/plan.json", {
      headers: { Authorization: `Basic ${Buffer.from(`${username}:${accessKey}`).toString("base64")}` },
      signal: AbortSignal.timeout(20_000), redirect: "error",
    });
    const body = await response.json().catch(() => null);
    plan = publicProviderPlan(response.status, body);
  } catch (error) {
    plan = { ok: false, httpStatus: null, providerDiagnostics: publicDriverFailure(error) };
  }
  const report = { ok: plan.ok, mode: "provider-preflight", buildName,
    sessionCreationAttempted: false, websiteChecksRun: false, sanitized: true, plan };
  await saveEvidence(report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(plan.ok ? 0 : 1);
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
  // A visible dialog can still be sliding into place. Observe a stable hit
  // target before issuing one native action, rather than retrying successful taps.
  let previous;
  await driver.wait(async () => {
    const current = await driver.executeScript(css => {
      const element = document.querySelector(css), rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, hit: !!hit && element.contains(hit) };
    }, selector);
    const stable = previous && current.hit && Math.abs(current.x - previous.x) < .5 && Math.abs(current.y - previous.y) < .5;
    previous = current;
    return stable;
  }, waitTimeoutMs);
  await driver.executeScript(css => {
    delete document.documentElement.dataset.qaNativeTap;
    const target=document.querySelector(css);
    document.addEventListener('click',event=>{
      document.documentElement.dataset.qaNativeTap=JSON.stringify({delivered:target.contains(event.target),trusted:event.isTrusted});
    },{capture:true,once:true});
  },selector);
  if (nativeTapDrivers.has(driver)) {
    // Use the real device's accessibility geometry, including Safari chrome.
    // Selenium isDisplayed() executes a browser JS atom, which cannot inspect
    // a native XCUITest element. Filter visibility in the native locator instead.
    {
      const { labels, kind } = await driver.executeScript(css => {
        const element = document.querySelector(css);
        const labels = [element.getAttribute('aria-label'), element.getAttribute('placeholder'),
          element.labels?.[0]?.textContent?.trim(), element.textContent?.trim()].filter(Boolean);
        return { labels: [...new Set(labels)], kind: element.tagName === 'A' ? 'XCUIElementTypeLink'
          : element.tagName === 'INPUT' ? 'XCUIElementTypeTextField' : 'XCUIElementTypeButton' };
      }, selector);
      if (!labels.length || labels.some(label => /['"]/.test(label))) throw new Error('NATIVE_CONTROL_LABEL_UNSUPPORTED');
      await withNativeDeviceContext(driver, async () => {
        const match = labels.flatMap(label => [`@name='${label}'`, `@label='${label}'`, `@value='${label}'`]).join(' or ');
        const controls = await driver.findElements(By.xpath(`//XCUIElementTypeWebView//${kind}[@visible='true' and (${match})]`));
        if (controls.length !== 1) throw new Error('NATIVE_CONTROL_NOT_UNIQUE');
        const control = controls[0];
        const rect = await control.getRect();
        if (rect.width <= 0 || rect.height <= 0) throw new Error('NATIVE_CONTROL_NOT_VISIBLE');
        const finger = new input.Pointer('qa-native-control', input.Pointer.Type.TOUCH);
        await driver.actions({ async: true }).insert(finger,
          finger.move({ x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) }),
          finger.press(), { type: 'pause', duration: selector === '.fc-furniture-floating' ? 250 : 100 },
          finger.release()).perform();
      });
    }
  } else {
  const position = await driver.executeScript(css => {
    const rect = document.querySelector(css).getBoundingClientRect();
    return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
  }, selector);
  const finger = new input.Pointer("qa-finger", input.Pointer.Type.TOUCH);
  await driver.actions({ async: true }).insert(finger, finger.move(position), finger.press(), { type: "pause", duration: 100 }, finger.release()).perform();
  }
  // The shop tap can switch windows; its caller reads evidence in the original
  // document. Other controls must deliver a trusted click to the actual target.
  if (selector !== '.fc-furniture-floating') {
    // Native input may return before WebKit dispatches its click. Observe the
    // real event before deciding whether it arrived; never synthesize one.
    try { await driver.wait(()=>driver.executeScript(()=>!!document.documentElement.dataset.qaNativeTap),5000); }
    catch { throw new Error("TRUSTED_TARGET_TAP_NOT_OBSERVED"); }
    const delivered = await driver.executeScript(() => JSON.parse(document.documentElement.dataset.qaNativeTap || 'null'));
    if (delivered?.delivered !== true || delivered?.trusted !== true) throw new Error("TRUSTED_TARGET_TAP_NOT_OBSERVED");
  }
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
  if(nativeTapDrivers.has(driver)) {
    // Some remote iOS script contexts do not retain callbacks between commands.
    // Read real rendered frames synchronously; do not synthesize animation states.
    const start=Date.now(),states=new Set();
    let original,activeFrames=0,maxAlignmentError=0,maxButtonShift=0,minimumViewportHeight=Infinity,maximumViewportHeight=0,last,hiddenFrames=0,visibleFrames=0;
    do {
      last=await driver.executeScript(()=>{
        const entry=document.querySelector('.fc-furniture-floating'),scene=document.querySelector('.fc-furniture-arrival');
        const box=entry?.getBoundingClientRect(),canvas=scene?.getBoundingClientRect(),outline=scene?.querySelector('[data-arrival-border] rect');
        const style=entry?getComputedStyle(entry):null;
        return {state:entry?.dataset.arrival,box:box?{x:box.x,y:box.y,width:box.width,height:box.height,right:box.right,bottom:box.bottom}:null,
          visible:style?.visibility==='visible'&&style.display!=='none'&&Number(style.opacity)>0,
          fixed:style?.position==='fixed',
          viewportHeight:visualViewport?.height||innerHeight,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
          active:scene?.dataset.active==='true'&&outline?.hasAttribute('x'),hasViewBox:scene?.hasAttribute('viewBox')??true,
          alignment:box&&canvas&&outline?Math.max(Math.abs(canvas.x+Number(outline.getAttribute('x'))-box.x-.5),Math.abs(canvas.y+Number(outline.getAttribute('y'))-box.y-.5),Math.abs(Number(outline.getAttribute('width'))-box.width+1),Math.abs(Number(outline.getAttribute('height'))-box.height+1)):0,
          insideViewport:!!box&&box.x>=0&&box.right<=innerWidth+1&&box.y>=0&&box.bottom<=innerHeight+1};
      });
      if(last.state)states.add(last.state);
      minimumViewportHeight=Math.min(minimumViewportHeight,last.viewportHeight);maximumViewportHeight=Math.max(maximumViewportHeight,last.viewportHeight);
      if(last.box&&last.visible){visibleFrames++;original??=last.box;maxButtonShift=Math.max(maxButtonShift,Math.abs(last.box.x-original.x),Math.abs(last.box.y-original.y));}
      else if(last.box)hiddenFrames++;
      if(last.active&&last.visible){activeFrames++;maxAlignmentError=Math.max(maxAlignmentError,last.alignment);}
      if(last.state==='done'||last.state==='skipped')break;
    }while(Date.now()-start<15000);
    return {states:[...states],activeFrames,maxAlignmentError,maxButtonShift,minimumViewportHeight,maximumViewportHeight,reducedMotion:last.reducedMotion,
      hasViewBox:last.hasViewBox,squareRatio:last.box?.width/last.box?.height,insideViewport:last.insideViewport,hiddenFrames,visibleFrames,
      firstVisibleX:original?.x,firstVisibleY:original?.y,finalX:last.box?.x,finalY:last.box?.y,finalFixed:last.fixed};
  }
  await driver.executeScript(() => {
  delete document.documentElement.dataset.qaMotion;
  const done = observation => { document.documentElement.dataset.qaMotion = JSON.stringify(observation); };
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
    const style = entry ? getComputedStyle(entry) : null;
    if (box?.width > 1 && style.visibility === 'visible' && style.display !== 'none' && Number(style.opacity) > 0) {
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
  try { await driver.wait(() => driver.executeScript(() => !!document.documentElement.dataset.qaMotion), 15000); }
  catch(error) {
    error.metrics=await driver.executeScript(() => ({ documentComplete:document.readyState==='complete',pageVisible:document.visibilityState==='visible',collectorResultPresent:!!document.documentElement.dataset.qaMotion,motionEntryPresent:!!document.querySelector('.fc-furniture-floating') }));
    throw error;
  }
  return driver.executeScript(() => JSON.parse(document.documentElement.dataset.qaMotion));
};

const checkNegativeForm = async (driver, action) => {
  await driver.executeScript(negativeLeadRequestGuard, "arm");
  let result, actionError;
  try { result = await action(); }
  catch (error) { actionError = error; }
  let guard;
  try { guard = await driver.executeScript(negativeLeadRequestGuard, "restore"); }
  catch (error) {
    if (actionError) { actionError.metrics = { ...actionError.metrics, networkGuardRestored: false }; throw actionError; }
    throw error;
  }
  if (!guard.guardInstalled || guard.leadRequestAttempts !== 0) {
    const error = new Error(guard.leadRequestAttempts ? "INVALID_FORM_ATTEMPTED_NETWORK_REQUEST" : "NEGATIVE_FORM_NETWORK_GUARD_CHANGED");
    error.metrics = { ...guard, networkGuardRestored: true };
    throw error;
  }
  if (actionError) { actionError.metrics = { ...actionError.metrics, ...guard, networkGuardRestored: true }; throw actionError; }
  return { ...result, ...guard, networkGuardRestored: true, leadRequestSent: false };
};

const capturePublicScreenshot = async (driver, target, evidence) => {
  const entry = { file: `${target.id}-${String(evidence.length + 1).padStart(2, "0")}.png`, saved: false };
  try {
    const page = await driver.executeScript(publicScreenshotPage, baseUrl);
    if (!page.eligible) { entry.code = "PUBLIC_SCREENSHOT_INELIGIBLE"; evidence.push(entry); return; }
    const bytes = Buffer.from(await driver.takeScreenshot(), "base64");
    if (bytes.length > 20 * 1024 * 1024 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("INVALID_SCREENSHOT_FORMAT");
    await mkdir(artifactDirectory, { recursive: true });
    await writeFile(path.join(artifactDirectory, entry.file), bytes);
    entry.saved = true;
    entry.publicPath = page.path;
  } catch { entry.code = "PUBLIC_SCREENSHOT_UNAVAILABLE"; }
  evidence.push(entry);
};

const mobileChecks = async (driver, target, identity, screenshotEvidence) => {
  const checks = [];
  const publicCheckCodes = new Set(["DEVICE_IDENTITY_NOT_RETURNED", "DEVICE_IDENTITY_MISMATCH", "MOTION_NOT_OBSERVED", "MOTION_PHASE_MISSING",
    "MOTION_FRAME_MISALIGNED", "FLOATING_BUTTON_JUMPED", "MOBILE_BUTTON_GEOMETRY_INVALID", "NATIVE_DEVICE_CONTEXT_UNAVAILABLE", "NATIVE_CONTROL_LABEL_UNSUPPORTED",
    "NATIVE_CONTROL_NOT_UNIQUE", "NATIVE_CONTROL_NOT_VISIBLE", "TRUSTED_TARGET_TAP_NOT_OBSERVED", "CONTROL_MISSING", "CONTROL_NOT_REACHABLE_BY_TOUCH",
    "MENU_FOCUS_NOT_RESTORED", "LANGUAGE_CONTENT_NOT_UPDATED", "PRESS_FEEDBACK_NOT_OBSERVED", "KEYBOARD_COVERS_ACTIVE_INPUT", "NATIVE_KEYBOARD_INPUT_NOT_UPDATED",
    "NATIVE_KEYBOARD_DISMISS_CONTROL_UNAVAILABLE", "NEGATIVE_FORM_GUARD_NOT_EMPTY", "NEGATIVE_FORM_NETWORK_GUARD_UNAVAILABLE", "NEGATIVE_FORM_GUARD_ALREADY_ACTIVE",
    "INVALID_FORM_ATTEMPTED_NETWORK_REQUEST", "NEGATIVE_FORM_NETWORK_GUARD_CHANGED", "FAQ_WHATSAPP_TARGET_INVALID", "BLOG_FLOATING_OVERLAP",
    "BLOG_DISTINCT_SCROLL_POSITIONS_NOT_OBSERVED"]);
  const check = async (name, action) => {
    try { checks.push({ name, passed: true, metrics: publicQaMetrics(await action()) }); }
    catch (error) { const text = error instanceof Error ? error.message : "";
      checks.push({ name, passed: false, code: publicCheckCodes.has(text) ? text : "WEBDRIVER_OR_CHECK_FAILED", errorKind: error?.constructor?.name || "Unknown",
        diagnostics: { unsupported: /unsupported|not implemented|not supported/i.test(text), invalidArgument: /invalid argument/i.test(text), viewport: /viewport|out of bounds/i.test(text), timeout: /timed out|timeout|Waiting/i.test(text) }, ...(error.metrics ? {metrics:publicQaMetrics(error.metrics)} : {}) }); }
    if (name !== "returned_device_versions") await capturePublicScreenshot(driver, target, screenshotEvidence);
  };
  await check("returned_device_versions", async () => {
    assertRequestedDeviceIdentity(target, identity);
    return { ...identity, realMobileRequested: target.options.realMobile === true };
  });
  if (!checks[0].passed) return checks;
  await check("first_home_motion_and_landing", async () => {
    await driver.get(`${baseUrl}/zh`);
    const observation = await captureMotion(driver);
    try { assertMobileMotion(observation); } catch(error) { error.metrics = observation; throw error; }
    return observation;
  });
  await check("native_context_transport", async () => {
    return withNativeDeviceContext(driver, async () => ({ nativeContextAvailable: true, restoredWebContextOnExit: true }));
  });
  await check("native_menu_close_and_navigation", async () => {
    let menuStage='open_first';
    try {
    await driver.get(`${baseUrl}/zh/services`); await ready(driver);
    const trigger = ".scheme-a-chrome__menu-trigger--compact";
    await touch(driver, trigger);
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "open"), waitTimeoutMs);
    menuStage='close_first';
    await touch(driver, ".scheme-a-directory__close");
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "closed"), waitTimeoutMs);
    const restored = await driver.executeScript(css => document.activeElement === document.querySelector(css), trigger);
    if (!restored) throw new Error("MENU_FOCUS_NOT_RESTORED");
    menuStage='open_second';
    await touch(driver, trigger);
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "open"), waitTimeoutMs);
    const group = '[aria-controls="scheme-a-directory-group-spaces"]';
    menuStage='expand_group';
    if (await (await driver.findElement(By.css(group))).getAttribute("aria-expanded") !== "true") await touch(driver, group);
    menuStage='navigate_projects';
    await touch(driver, '#scheme-a-directory a[href="/zh/projects"]');
    await driver.wait(() => driver.executeScript(() => location.pathname === "/zh/projects" && document.querySelector("#scheme-a-directory")?.dataset.state === "closed"), waitTimeoutMs);
    return { focusRestored: restored, nativeTouchNavigation: true };
    }catch(error){
      const delivered=await driver.executeScript(()=>JSON.parse(document.documentElement.dataset.qaNativeTap||'null'));
      error.metrics={...error.metrics,menuStage,tapObserved:!!delivered,tapDeliveredToExpectedControl:delivered?.delivered===true,tapTrusted:delivered?.trusted===true};throw error;
    }
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
      delete document.documentElement.dataset.qaFloatingPress;
      const entry = document.querySelector(".fc-furniture-floating");
      entry.dataset.qaPressArmed = 'true';
      entry.dataset.qaPressEvents = '[]';
      for (const type of ['pointerdown','pointerup','pointercancel','pointerleave','touchstart','touchend','click']) {
        entry.addEventListener(type, event => {
          const events = JSON.parse(entry.dataset.qaPressEvents || '[]');
          events.push({ type, trusted: event.isTrusted, touch: event.pointerType === 'touch', pressed: entry.dataset.pressed === 'true' });
          entry.dataset.qaPressEvents = JSON.stringify(events.slice(-12));
        }, { capture: true });
      }
      let started=0;
      entry.addEventListener("pointerdown", () => { started=performance.now(); }, { once: true });
      // Read before React's delegated pointerup clears the actual pressed state.
      // This also measures short native taps, without fabricating pointer events.
      entry.addEventListener("pointerup", event => {
        document.documentElement.dataset.qaFloatingPress = JSON.stringify({ pointer: event.pointerType, trusted:event.isTrusted, pressed: entry.dataset.pressed === "true", transform: getComputedStyle(entry.querySelector(".fc-furniture-floating__icon")).transform,pressDuration:performance.now()-started });
      }, { once: true });
    });
    const originalHandle = await driver.getWindowHandle();
    const before = await driver.getAllWindowHandles();
    const position = await driver.executeScript(() => {
      const rect = document.querySelector(".fc-furniture-floating").getBoundingClientRect();
      return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
    });
    if(nativeTapDrivers.has(driver)) await touch(driver,'.fc-furniture-floating');
    else {
      const finger = new input.Pointer("qa-press", input.Pointer.Type.TOUCH);
      await driver.actions({ async: true }).insert(finger, finger.move(position), finger.press(), { type: "pause", duration: 250 }, finger.release()).perform();
    }
    // Mobile Safari may focus the new shop tab as part of the real native tap.
    // Read press evidence in the original document, then inspect the new tab.
    try { await driver.wait(async()=>(await driver.getAllWindowHandles()).length>before.length,10000); } catch { /* Press evidence still decides the result below. */ }
    const after=await driver.getAllWindowHandles();
    await driver.switchTo().window(originalHandle);
    const feedback = await driver.executeScript(() => JSON.parse(document.documentElement.dataset.qaFloatingPress || 'null'));
    if (!feedback?.pressed || feedback.pointer !== "touch" || feedback.trusted!==true || !feedback.transform || feedback.transform === "none") {
      const error=new Error("PRESS_FEEDBACK_NOT_OBSERVED");
      error.metrics={pressObserved:!!feedback,pressed:feedback?.pressed===true,trusted:feedback?.trusted===true,touchPointer:feedback?.pointer==='touch',transformObserved:!!feedback?.transform&&feedback.transform!=='none',pressDuration:feedback?.pressDuration??0,shopTabCreated:after.length>before.length};
      const observation = await driver.executeScript(() => {
        const entry = document.querySelector('.fc-furniture-floating');
        return { probeArmed: entry?.dataset.qaPressArmed === 'true', events: JSON.parse(entry?.dataset.qaPressEvents || '[]') };
      });
      Object.assign(error.metrics, { probeArmed: observation.probeArmed,
        pointerDownObserved: observation.events.some(event => event.type === 'pointerdown'),
        pointerUpObserved: observation.events.some(event => event.type === 'pointerup'),
        trustedTouchStartObserved: observation.events.some(event => event.type === 'touchstart' && event.trusted),
        trustedClickObserved: observation.events.some(event => event.type === 'click' && event.trusted),
        pressedDuringEvent: observation.events.some(event => event.pressed) });
      for(const handle of after.filter(handle=>!before.includes(handle))){await driver.switchTo().window(handle);await driver.close();}
      await driver.switchTo().window(originalHandle);
      throw error;
    }
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > before.length, 15000);
    const added = (await driver.getAllWindowHandles()).filter(handle => !before.includes(handle));
    try {
      await driver.switchTo().window(added[0]);
      await driver.wait(async () => new URL(await driver.getCurrentUrl()).hostname === "shop.flashcast.com.my", 15000);
    } finally {
      for (const handle of added) { await driver.switchTo().window(handle); await driver.close(); }
      await driver.switchTo().window(originalHandle);
    }
    return { touchPressFeedback: true, shopOpened: true, testTabClosed: true };
  });
  await check("contact_keyboard_and_invalid_input", async () => {
    let contactStage='open_contact';
    try {
    await driver.get(`${baseUrl}/zh/contact`); await ready(driver);
    await swipeTo(driver, "#contact-name");
    const viewportBefore = await driver.executeScript(() => visualViewport?.height || innerHeight);
    await touch(driver, "#contact-name");
    contactStage='keyboard_appearance';
    try { await driver.wait(() => driver.executeScript(before => (visualViewport?.height || innerHeight) < before - 50, viewportBefore), 10000); }
    catch (error) {
      error.metrics = await driver.executeScript(before => ({ keyboardHeightBefore: before, keyboardHeightAfter: visualViewport?.height || innerHeight, focusedName: document.activeElement.id === "contact-name", typedNamePresent: document.querySelector("#contact-name")?.value === "QA keyboard only" }), viewportBefore);
      throw error;
    }
    const keyboardSnapshot = () => {
      const rect = document.activeElement.getBoundingClientRect(); const view = visualViewport;
      // iOS reports independently rounded fractional layout/visual viewport
      // offsets; one CSS pixel is the existing geometry rounding tolerance.
      return { height: view?.height || innerHeight, focusedName: document.activeElement.id === "contact-name", inputVisible: rect.top >= (view?.offsetTop || 0)-1 && rect.bottom <= (view?.offsetTop || 0) + (view?.height || innerHeight)+1,inputTop:rect.top,inputBottom:rect.bottom,viewportOffset:view?.offsetTop||0 };
    };
    try { await driver.wait(async()=>{const item=await driver.executeScript(keyboardSnapshot);return item.focusedName&&item.inputVisible;},10000); }
    catch { const error=new Error('KEYBOARD_COVERS_ACTIVE_INPUT');error.metrics=await driver.executeScript(keyboardSnapshot);throw error; }
    const keyboard=await driver.executeScript(keyboardSnapshot);
    contactStage='native_typing';
    await (await driver.findElement(By.css("#contact-name"))).sendKeys("QA keyboard only");
    const typed = await driver.executeScript(() => document.querySelector("#contact-name")?.value === "QA keyboard only");
    if (!typed) throw new Error("NATIVE_KEYBOARD_INPUT_NOT_UPDATED");
    contactStage='native_keyboard_dismissal';
    // The keyboard pans the visual viewport beyond the fixed header. Use the
    // physical device's keyboard dismissal, then test the reachable menu.
    if (nativeTapDrivers.has(driver)) {
      // The iPhone keyboard may expose Done in Safari's accessory toolbar,
      // outside the keyboard subtree used by the generic hide-keyboard API.
      await withNativeDeviceContext(driver, async () => {
        const controls = await driver.findElements(By.xpath('//XCUIElementTypeButton[@visible="true" and (@name="Done" or @label="Done" or @name="完成" or @label="完成")]'));
        if (controls.length) { await controls[0].click(); return; }
        throw new Error('NATIVE_KEYBOARD_DISMISS_CONTROL_UNAVAILABLE');
      });
    } else await hideNativeDeviceKeyboard(driver);
    await driver.wait(() => driver.executeScript(before => (visualViewport?.height || innerHeight) >= before - 10, viewportBefore), 10000);
    contactStage='menu_after_keyboard';
    // Record geometry before tapping: Android can pan the visual viewport while
    // keeping the header in layout coordinates. Do not silently click offscreen.
    const menuGeometry=await driver.executeScript(()=>{
      const r=document.querySelector('.scheme-a-chrome__menu-trigger--compact').getBoundingClientRect();
      return {menuTop:r.top,menuBottom:r.bottom,viewportOffset:visualViewport?.offsetTop||0,viewportHeight:visualViewport?.height||innerHeight};
    });
    try {
    await touch(driver, ".scheme-a-chrome__menu-trigger--compact");
    await driver.wait(() => driver.executeScript(() => document.querySelector("#scheme-a-directory")?.dataset.state === "open"), waitTimeoutMs);
    }catch(error){error.metrics={...error.metrics,...menuGeometry};throw error;}
    await touch(driver, ".scheme-a-directory__close");
    contactStage='keyboard_dismissal';
    await driver.wait(() => driver.executeScript(before => (visualViewport?.height || innerHeight) >= before - 10, viewportBefore), 10000);
    await swipeTo(driver, 'main form button[type="submit"]');
    contactStage='invalid_form_submit';
    const missingPhone = await (await driver.findElement(By.css("#contact-phone"))).getAttribute("value");
    if (missingPhone) throw new Error("NEGATIVE_FORM_GUARD_NOT_EMPTY");
    return await checkNegativeForm(driver, async () => {
      await touch(driver, 'main form button[type="submit"]');
      await driver.wait(() => driver.executeScript(() => document.querySelector("#contact-phone")?.getAttribute("aria-invalid") === "true" && !!document.querySelector("#contact-phone-error")?.textContent), waitTimeoutMs);
      return { keyboardHeightBefore: viewportBefore, keyboardHeightAfter: keyboard.height, inputVisible: true, keyboardDismissed: true, invalidPhoneDisplayed: true };
    });
    }catch(error){error.metrics={...error.metrics,contactStage};throw error;}
  });
  await check("quote_invalid_form_focus_and_message", async () => {
    await driver.get(`${baseUrl}/zh/quote`); await ready(driver);
    await swipeTo(driver, 'main form button[type="submit"]');
    const empty = await driver.executeScript(() => !document.querySelector("#quote-name")?.value && !document.querySelector("#quote-phone")?.value);
    if (!empty) throw new Error("NEGATIVE_FORM_GUARD_NOT_EMPTY");
    return checkNegativeForm(driver, async () => {
      await touch(driver, 'main form button[type="submit"]');
      await driver.wait(() => driver.executeScript(() => document.querySelector("#quote-name")?.getAttribute("aria-invalid") === "true" && !!document.querySelector("#quote-name-error")?.textContent && document.activeElement.id === "quote-name"), waitTimeoutMs);
      return { validationMessagePresent: true, firstInvalidFieldFocused: true };
    });
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
        return { overlaps, overflow: document.documentElement.scrollWidth - innerWidth, scrollY };
      }));
      const size = await driver.executeScript(() => ({ width: innerWidth, height: innerHeight }));
      const finger = new input.Pointer("qa-blog-scroll", input.Pointer.Type.TOUCH);
      const x = Math.round(size.width * .4);
      await driver.actions({ async: true }).insert(finger, finger.move({ x, y: Math.round(size.height * .7) }), finger.press(),
        finger.move({ x, y: Math.round(size.height * .3), duration: 350 }), finger.release()).perform();
    }
    if (measures.some(item => item.overlaps || item.overflow > 1)) throw new Error("BLOG_FLOATING_OVERLAP");
    if (new Set(measures.map(item => Math.round(item.scrollY))).size !== 3) throw new Error("BLOG_DISTINCT_SCROLL_POSITIONS_NOT_OBSERVED");
    return { inspectedScrollPositions: measures.length, overlaps: 0, distinctNativeScrollPositions: 3 };
  });
  return checks;
};

const runTarget = async (target) => {
  const capabilities = {
    browserName: target.browserName,
    pageLoadStrategy: "eager",
    ...(target.browserVersion ? { browserVersion: target.browserVersion } : {}),
    ...(target.id==='iphone-safari-real'?{platformName:'iOS','appium:automationName':'XCUITest','appium:nativeWebTap':true,'appium:nativeWebTapStrict':false}:{}),
    ...(target.id==='android-chrome-real'?{platformName:'Android','appium:automationName':'UiAutomator2'}:{}),
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

  let driver, result, sessionCreated = false, stage = "session_creation", identity = {}, advancedChecks = [], refreshed = [];
  const screenshotEvidence = [];
  let sessionResponse = null;
  try {
    if (target.options.deviceName) {
      // Use the SDK's public executor API to retain only the creation response
      // category. Generic driver errors can otherwise discard nested JSON reasons.
      class DiagnosticClient extends http.HttpClient {
        async send(request) {
          const response = await super.send(request);
          if (request.method === "POST" && request.path.endsWith("/session")) {
            sessionResponse = publicDriverHttpResponse(response.status, response.body);
          }
          return response;
        }
      }
      driver = await WebDriver.createSession(new http.Executor(new DiagnosticClient("https://hub-cloud.browserstack.com/wd/hub")), capabilities);
      await driver.getSession();
    } else {
      driver = await new Builder().usingServer("https://hub-cloud.browserstack.com/wd/hub").withCapabilities(capabilities).build();
    }
    sessionCreated = true;
    if(target.id==='iphone-safari-real')nativeTapDrivers.add(driver);
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
    advancedChecks = target.options.deviceName ? await mobileChecks(driver, target, identity, screenshotEvidence) : [];

    for (const page of pages) {
      stage = `basic_page_${pages.indexOf(page) + 1}`;
      await runPageChecks(driver, page);
      if (page.path !== "/admin") await capturePublicScreenshot(driver, target, screenshotEvidence);
    }

    await runPageChecks(driver, pages[0]);
    stage = "homepage_refreshes";
    for (let round = 0; round < 3; round++) {
      const previousDocument = await driver.executeScript(() => performance.timeOrigin);
      await driver.navigate().refresh();
      // Safari's native refresh can return while the previous document still
      // exists. Do not mix its completed animation with the new document.
      await driver.wait(() => driver.executeScript(previous=>performance.timeOrigin!==previous,previousDocument),waitTimeoutMs);
      let motion;
      if (target.options.deviceName) {
        motion = await captureMotion(driver);
        try { assertMobileMotion(motion); } catch (error) { advancedChecks.push({ name: `refresh_${round + 1}_motion`, passed: false, code: error.message, metrics: publicQaMetrics(motion) }); }
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
      refreshed.push({ round: round + 1, documentComplete: true, remainedStable: true, ...(motion ? { motion: publicQaMetrics(motion) } : {}) });
      await capturePublicScreenshot(driver, target, screenshotEvidence);
    }
    const screenshotEvidenceComplete = screenshotEvidence.length > 0 && screenshotEvidence.every(entry => entry.saved);
    const ok = advancedChecks.every(check => check.passed) && screenshotEvidenceComplete;
    await setSessionStatus(driver, ok ? "passed" : "failed", ok ? "Core pages, refreshes and mobile interactions passed." : "A recorded mobile interaction did not pass.");
    return (result = { id: target.id, ok, sessionCreated, identity, advancedChecks, refreshed, screenshotEvidence, screenshotEvidenceComplete });
  } catch (error) {
    if (driver) await setSessionStatus(driver, "failed", "Browser or page check failed; private driver details withheld.");
    if (driver && sessionCreated && !stage.endsWith("_8")) await capturePublicScreenshot(driver, target, screenshotEvidence);
    return (result = { id: target.id, ok: false, error: error?.constructor?.name || "CHECK_FAILED", stage, sessionCreated,
      providerDiagnostics: publicDriverFailure(error), sessionResponse, identity, advancedChecks, refreshed, screenshotEvidence, screenshotEvidenceComplete: false });
  } finally {
    // Failed creation has no acquired session to close. For acquired sessions,
    // cleanup is part of acceptance and cannot turn a failure into success.
    if (driver && sessionCreated) await closeBrowserSession(driver, result);
  }
};

const results = [];
const readProductionRevision = async () => {
  const response = await fetch(`${baseUrl}/__flashcast/version`, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("PRODUCTION_REVISION_NOT_RETURNED");
  const value = (await response.json()).deploymentVersion;
  if (typeof value !== "string" || !/^[0-9a-f]{40}$/.test(value)) throw new Error("PRODUCTION_REVISION_INVALID");
  return value;
};
let productionRevisionBefore = null, productionRevisionAfter = null;
await saveEvidence({ ok: false, status: "RUNNING", baseUrl, buildName, results });
try {
  productionRevisionBefore = await readProductionRevision();
  for (const target of filteredTargets) {
    console.log(`[real-browser] ${target.id} starting`);
    const result = await runTarget(target);
    results.push(result);
    await saveEvidence({ ok: false, status: "RUNNING", baseUrl, buildName, productionRevisionBefore, results });
    console.log(`[real-browser] ${target.id} ${result.ok ? "passed" : "failed"}`);
  }
  productionRevisionAfter = await readProductionRevision();
  const stableProductionRevision = productionRevisionBefore === productionRevisionAfter;
  const report = { ok: results.every(result => result.ok) && stableProductionRevision, status: "COMPLETED", baseUrl, buildName,
    sourceRevision, productionRevisionBefore, productionRevisionAfter, stableProductionRevision, sanitized: true, results };
  await saveEvidence(report);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} catch (error) {
  const report = { ok: false, status: "FAILED", code: "REVISION_OR_RUN_FAILED", baseUrl, buildName, sourceRevision,
    productionRevisionBefore, productionRevisionAfter, stableProductionRevision: false, sanitized: true,
    providerDiagnostics: publicDriverFailure(error), results };
  await saveEvidence(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = 1;
}
