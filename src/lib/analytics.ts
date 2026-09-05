type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

// Flashcast Website stream, verified against flashcast.com.my in GA4.
const defaultGaMeasurementId = "G-LLJGRG2YNP";
const defaultGoogleAdsId = "AW-18205206146";
const productionAnalyticsHosts = new Set(["flashcast.com.my", "www.flashcast.com.my"]);
const directObservationCtaEvents: Record<string, string> = {
  whatsapp: "whatsapp_click",
  phone: "phone_click",
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const gaMeasurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || defaultGaMeasurementId).trim();
const googleAdsId = String(import.meta.env.VITE_GOOGLE_ADS_ID || defaultGoogleAdsId).trim();
const quoteConversionLabel = String(import.meta.env.VITE_GOOGLE_ADS_QUOTE_CONVERSION_LABEL || "").trim();
const contactConversionLabel = String(import.meta.env.VITE_GOOGLE_ADS_CONTACT_CONVERSION_LABEL || "").trim();
const configuredPagesReportUrl = String(import.meta.env.VITE_GA4_PAGES_REPORT_URL || "").trim();
const googleTagScriptId = "flashcast-google-tag";
const googleTagIds = [gaMeasurementId, googleAdsId].filter(Boolean);
const primaryGoogleTagId = googleTagIds[0] || "";

export const isAnalyticsEnabled = googleTagIds.length > 0;
export const ga4PagesReportUrl =
  /#\/(?:a\d+)?p\d+(?:\/|$)/.test(configuredPagesReportUrl)
    ? configuredPagesReportUrl
    : "https://analytics.google.com/analytics/web/#/a396903314p540413787/reports";

let initialized = false;
let scriptRequested = false;
let analyticsLoadScheduled = false;
let webVitalsInitialized = false;

type IdleWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type LayoutShiftEntry = PerformanceEntry & {
  value: number;
  hadRecentInput: boolean;
};

type EventTimingEntry = PerformanceEntry & {
  duration: number;
  interactionId: number;
};

type WebVitalName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";

export const isProductionAnalyticsHost = (hostname: string) =>
  productionAnalyticsHosts.has(hostname.trim().toLowerCase());

const canUseBrowserAnalytics = () =>
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  isAnalyticsEnabled &&
  (import.meta.env.MODE === "test" || isProductionAnalyticsHost(window.location.hostname));

const sanitizeParams = (params: AnalyticsParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

const currentPagePath = () => (typeof window !== "undefined" ? window.location.pathname : "");

const trackSuccessfulLeadEvent = (
  leadType: "quote_form" | "contact_form",
  eventName: "quote_form_success" | "contact_form_success",
  params: AnalyticsParams,
) => {
  const leadParams = {
    conversion_source: eventName,
    lead_type: leadType,
    method: leadType,
    page_path: currentPagePath(),
    ...params,
  };

  trackEvent(eventName, leadParams);
  trackEvent("generate_lead", leadParams);
};

const ensureGoogleTagScript = () => {
  if (
    !canUseBrowserAnalytics()
    || !primaryGoogleTagId
    || scriptRequested
    || document.getElementById(googleTagScriptId)
  ) return;

  scriptRequested = true;

  const script = document.createElement("script");
  script.id = googleTagScriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryGoogleTagId)}`;
  document.head.appendChild(script);
};

const scheduleGoogleTagScript = () => {
  if (!canUseBrowserAnalytics() || analyticsLoadScheduled || scriptRequested) return;
  analyticsLoadScheduled = true;
  const idleWindow = window as IdleWindow;
  let idleHandle: number | null = null;
  let fallbackTimer = 0;

  const interactionEvents = ["pointerdown", "keydown", "touchstart"] as const;
  const cleanup = () => {
    interactionEvents.forEach((eventName) => window.removeEventListener(eventName, load));
    if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
    window.clearTimeout(fallbackTimer);
  };
  const load = () => {
    cleanup();
    ensureGoogleTagScript();
  };

  interactionEvents.forEach((eventName) => window.addEventListener(eventName, load, { once: true, passive: true }));
  if (idleWindow.requestIdleCallback) {
    idleHandle = idleWindow.requestIdleCallback(load, { timeout: 4000 });
  } else {
    fallbackTimer = window.setTimeout(load, 3000);
  }
};

const getVitalRating = (name: WebVitalName, value: number) => {
  const thresholds: Record<WebVitalName, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    INP: [200, 500],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
  };
  const [good, poor] = thresholds[name];
  return value <= good ? "good" : value <= poor ? "needs_improvement" : "poor";
};

const reportWebVital = (name: WebVitalName, value: number) => {
  trackEvent("web_vital", {
    metric_name: name,
    metric_value: Math.round(name === "CLS" ? value * 1000 : value),
    metric_rating: getVitalRating(name, value),
    metric_unit: name === "CLS" ? "score_x1000" : "millisecond",
    non_interaction: true,
    page_path: currentPagePath(),
  });
};

const observeWebVitals = () => {
  if (webVitalsInitialized || typeof PerformanceObserver === "undefined") return;
  webVitalsInitialized = true;
  const supportedTypes = new Set(PerformanceObserver.supportedEntryTypes || []);
  const observers: PerformanceObserver[] = [];
  let clsValue = 0;
  let lcpValue = 0;
  let inpValue = 0;
  let finalized = false;

  const observe = (
    type: string,
    callback: PerformanceObserverCallback,
    options: PerformanceObserverInit = { type, buffered: true },
  ) => {
    if (!supportedTypes.has(type)) return;
    try {
      const observer = new PerformanceObserver(callback);
      observer.observe(options);
      observers.push(observer);
    } catch {
      // Older browsers can omit individual performance entry types.
    }
  };

  observe("paint", (list, observer) => {
    const entry = list.getEntriesByName("first-contentful-paint")[0];
    if (!entry) return;
    reportWebVital("FCP", entry.startTime);
    observer.disconnect();
  });
  observe("largest-contentful-paint", (list) => {
    const entries = list.getEntries();
    const entry = entries[entries.length - 1];
    if (entry) lcpValue = entry.startTime;
  });
  observe("layout-shift", (list) => {
    for (const entry of list.getEntries() as LayoutShiftEntry[]) {
      if (!entry.hadRecentInput) clsValue += entry.value;
    }
  });
  observe(
    "event",
    (list) => {
      for (const entry of list.getEntries() as EventTimingEntry[]) {
        if (entry.interactionId > 0) inpValue = Math.max(inpValue, entry.duration);
      }
    },
    { type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit,
  );

  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation) reportWebVital("TTFB", navigation.responseStart);

  const finalize = () => {
    if (finalized || document.visibilityState !== "hidden") return;
    finalized = true;
    if (lcpValue > 0) reportWebVital("LCP", lcpValue);
    reportWebVital("CLS", clsValue);
    if (inpValue > 0) reportWebVital("INP", inpValue);
    observers.forEach((observer) => observer.disconnect());
    document.removeEventListener("visibilitychange", finalize);
    window.removeEventListener("pagehide", finalize);
  };

  document.addEventListener("visibilitychange", finalize);
  window.addEventListener("pagehide", finalize);
};

export const initAnalytics = () => {
  if (!canUseBrowserAnalytics() || initialized) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("js", new Date());
  if (gaMeasurementId) window.gtag("config", gaMeasurementId, { send_page_view: false });
  if (googleAdsId) window.gtag("config", googleAdsId);
  initialized = true;
  observeWebVitals();
  scheduleGoogleTagScript();
};

export const trackPageView = ({
  path,
  title,
  language,
}: {
  path: string;
  title?: string;
  language?: string;
}) => {
  if (!canUseBrowserAnalytics()) return;

  initAnalytics();
  const pageLocation = new URL(path, window.location.origin).href;

  window.gtag?.(
    "event",
    "page_view",
    sanitizeParams({
      page_title: title || document.title,
      page_location: pageLocation,
      page_path: path,
      language,
    }),
  );
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!canUseBrowserAnalytics()) return;

  initAnalytics();
  window.gtag?.("event", eventName, sanitizeParams(params));
};

export const trackCtaClick = (ctaName: string, ctaLocation: string, params: AnalyticsParams = {}) => {
  trackEvent("cta_click", {
    cta_name: ctaName,
    cta_location: ctaLocation,
    page_path: currentPagePath(),
    ...params,
  });

  const observationEventName = directObservationCtaEvents[ctaName];

  if (observationEventName) {
    trackEvent(observationEventName, {
      conversion_source: "direct_cta_click",
      cta_name: ctaName,
      cta_location: ctaLocation,
      page_path: currentPagePath(),
      ...params,
    });
  }
};

export const trackGoogleAdsConversion = (conversionLabel: string, params: AnalyticsParams = {}) => {
  if (!canUseBrowserAnalytics() || !googleAdsId || !conversionLabel) return;

  initAnalytics();
  ensureGoogleTagScript();
  window.gtag?.(
    "event",
    "conversion",
    sanitizeParams({
      send_to: `${googleAdsId}/${conversionLabel}`,
      ...params,
    }),
  );
};

export const trackQuoteFormSubmit = (status: "success" | "error" | "validation_error", params: AnalyticsParams = {}) => {
  trackEvent("quote_form_submit", {
    form_status: status,
    page_path: currentPagePath(),
    ...params,
  });

  if (status === "success") {
    trackSuccessfulLeadEvent("quote_form", "quote_form_success", params);
    trackGoogleAdsConversion(quoteConversionLabel, {
      conversion_source: "quote_form_success",
      ...params,
    });
  }
};

export const trackContactFormSubmit = (status: "success" | "error" | "validation_error", params: AnalyticsParams = {}) => {
  trackEvent("contact_form_submit", {
    form_status: status,
    page_path: currentPagePath(),
    ...params,
  });

  if (status === "success") {
    trackSuccessfulLeadEvent("contact_form", "contact_form_success", params);
    trackGoogleAdsConversion(contactConversionLabel, {
      conversion_source: "contact_form_success",
      ...params,
    });
  }
};
