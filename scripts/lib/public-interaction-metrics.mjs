/** Installed before application scripts; captures lab metrics without sending telemetry. */
export function installPublicInteractionMetrics() {
  const metrics = {
    firstInteractiveMs: null,
    lcpMs: null,
    lcpTarget: null,
    cls: 0,
    maxLongTaskMs: 0,
    longTaskCount: 0,
    maxObservedEventDurationMs: null,
    locks: [],
  };
  const observers = [];
  let lockedAt = null;
  let lockedPath = "";
  let clsSessionStart = 0;
  let clsSessionLast = 0;
  let clsSessionValue = 0;
  const observe = (type, callback, options = {}) => {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true, ...options });
    observers.push(observer);
  };
  observe("largest-contentful-paint", (entries) => {
    const entry = entries.at(-1);
    if (!entry) return;
    metrics.lcpMs = entry.startTime;
    const element = entry.element;
    metrics.lcpTarget = { tag: element?.tagName ?? null, size: entry.size,
      region: element?.closest?.("#flashcast-public-boot, [data-route-loader]") ? "brand-loader" :
        element?.closest?.("#main-content") ? "main-content" : "other" };
  });
  observe("longtask", (entries) => {
    for (const entry of entries) {
      metrics.longTaskCount++;
      metrics.maxLongTaskMs = Math.max(metrics.maxLongTaskMs, entry.duration);
    }
  });
  observe("event", (entries) => {
    for (const entry of entries) {
      if (entry.interactionId) metrics.maxObservedEventDurationMs = Math.max(metrics.maxObservedEventDurationMs ?? 0, entry.duration);
    }
  }, { durationThreshold: 16 });
  observe("layout-shift", (entries) => {
    for (const entry of entries) {
      if (entry.hadRecentInput) continue;
      if (clsSessionValue === 0 || entry.startTime - clsSessionLast > 1000 || entry.startTime - clsSessionStart > 5000) {
        clsSessionStart = entry.startTime;
        clsSessionValue = 0;
      }
      clsSessionLast = entry.startTime;
      clsSessionValue += entry.value;
      metrics.cls = Math.max(metrics.cls, clsSessionValue);
    }
  });
  const sample = () => {
    const root = document.getElementById("root");
    const content = document.querySelector("[data-route-visual-state]");
    const locked = Boolean(root?.hasAttribute("inert") || content?.hasAttribute("inert"));
    const now = performance.now();
    if (locked && lockedAt === null) {
      lockedAt = now;
      lockedPath = location.pathname;
    } else if (!locked && lockedAt !== null) {
      metrics.locks.push({ path: lockedPath, startMs: lockedAt, endMs: now, durationMs: now - lockedAt });
      lockedAt = null;
    }
    if (metrics.firstInteractiveMs === null && content && !locked && !content.querySelector('[data-route-pending="true"]')) {
      const css = getComputedStyle(content);
      if (css.visibility !== "hidden" && Number(css.opacity) > 0) metrics.firstInteractiveMs = now;
    }
  };
  const mutations = new MutationObserver(sample);
  mutations.observe(document, { subtree: true, childList: true, attributes: true,
    attributeFilter: ["inert", "data-route-visual-state", "data-route-pending", "data-public-boot"] });
  window.__flashcastInteractionMetrics = {
    read: () => {
      sample();
      return { ...metrics, ongoingLockMs: lockedAt === null ? 0 : performance.now() - lockedAt };
    },
    stop: () => {
      mutations.disconnect();
      for (const observer of observers) observer.disconnect();
    },
  };
}

export async function exercisePublicLanguageSwitch(page, fromPath) {
  const receipts = [];
  for (const language of ["en", "zh"]) {
    const targetPath = fromPath.replace(/^\/(?:zh|en)(?=\/|$)/, `/${language}`);
    const before = await page.locator("#main-content h1").first().innerText();
    await page.evaluate(({ targetPath, language, before }) => {
      const probe = { startedMs: null, completedMs: null, stop: null };
      const sample = () => {
        if (probe.startedMs === null || probe.completedMs !== null) return;
        const content = document.querySelector("[data-route-visual-state]");
        const heading = document.querySelector("#main-content h1");
        if (content && ["ready", "handoff", "degraded"].includes(content.getAttribute("data-route-visual-state")) &&
          location.pathname === targetPath && document.documentElement.lang === (language === "zh" ? "zh-CN" : "en") &&
          Boolean(heading?.textContent?.trim()) && heading.textContent.trim() !== before.trim() &&
          !content.querySelector('[data-route-pending="true"]') && !content.hasAttribute("inert") &&
          !content.querySelector('[data-public-results][inert]') &&
          !document.getElementById("root")?.hasAttribute("inert")) probe.completedMs = performance.now();
      };
      const captureClick = (event) => {
        const option = event.target instanceof Element ? event.target.closest(".scheme-a-language-option") : null;
        if (option?.getAttribute("lang") === (language === "zh" ? "zh-CN" : "en")) {
          const now = performance.now();
          probe.startedMs = event.timeStamp > 0 && event.timeStamp <= now ? event.timeStamp : now;
          queueMicrotask(sample);
        }
      };
      const observer = new MutationObserver(sample);
      observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true,
        attributeFilter: ["lang", "inert", "data-route-pending", "data-route-visual-state"] });
      document.addEventListener("click", captureClick, true);
      probe.stop = () => { observer.disconnect(); document.removeEventListener("click", captureClick, true); };
      window.__flashcastLanguageProbe = probe;
    }, { targetPath, language, before });
    try {
      await page.locator(`.scheme-a-language-option[lang="${language === "zh" ? "zh-CN" : "en"}"]:visible`).first().click();
      await page.waitForFunction(() => window.__flashcastLanguageProbe?.completedMs !== null, undefined, { timeout: 15_000 });
      const receipt = await page.evaluate(() => {
        const { startedMs, completedMs } = window.__flashcastLanguageProbe;
        const metrics = window.__flashcastInteractionMetrics?.read();
        return { clickToTranslatedContentMs: completedMs - startedMs,
          lockDurationMs: metrics?.locks.filter((lock) => lock.endMs >= startedMs && lock.startMs <= completedMs)
            .reduce((total, lock) => total + Math.min(lock.endMs, completedMs) - Math.max(lock.startMs, startedMs), 0) ?? null,
          ongoingLockMs: metrics?.ongoingLockMs ?? null };
      });
      receipts.push({ language, ...receipt });
    } finally {
      await page.evaluate(() => { window.__flashcastLanguageProbe?.stop(); delete window.__flashcastLanguageProbe; });
    }
  }
  return receipts;
}
