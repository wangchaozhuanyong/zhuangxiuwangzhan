type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
const googleAdsId = String(import.meta.env.VITE_GOOGLE_ADS_ID || "").trim();
const quoteConversionLabel = String(import.meta.env.VITE_GOOGLE_ADS_QUOTE_CONVERSION_LABEL || "").trim();
const contactConversionLabel = String(import.meta.env.VITE_GOOGLE_ADS_CONTACT_CONVERSION_LABEL || "").trim();
const configuredPagesReportUrl = String(import.meta.env.VITE_GA4_PAGES_REPORT_URL || "").trim();
const googleTagScriptId = "flashcast-google-tag";
const googleTagIds = [measurementId, googleAdsId].filter(Boolean);
const primaryGoogleTagId = googleTagIds[0] || "";

export const isAnalyticsEnabled = googleTagIds.length > 0;
export const ga4PagesReportUrl =
  configuredPagesReportUrl || "https://analytics.google.com/analytics/web/#/report/pages-and-screens";

let initialized = false;

const canUseBrowserAnalytics = () =>
  typeof window !== "undefined" && typeof document !== "undefined" && isAnalyticsEnabled;

const sanitizeParams = (params: AnalyticsParams) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

const ensureGoogleTagScript = () => {
  if (!canUseBrowserAnalytics() || !primaryGoogleTagId || document.getElementById(googleTagScriptId)) return;

  const script = document.createElement("script");
  script.id = googleTagScriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryGoogleTagId)}`;
  document.head.appendChild(script);
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
  if (measurementId) window.gtag("config", measurementId, { send_page_view: false });
  if (googleAdsId) window.gtag("config", googleAdsId);
  ensureGoogleTagScript();
  initialized = true;
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
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    ...params,
  });
};

export const trackGoogleAdsConversion = (conversionLabel: string, params: AnalyticsParams = {}) => {
  if (!canUseBrowserAnalytics() || !googleAdsId || !conversionLabel) return;

  initAnalytics();
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
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    ...params,
  });

  if (status === "success") {
    trackGoogleAdsConversion(quoteConversionLabel, params);
  }
};

export const trackContactFormSubmit = (status: "success" | "error" | "validation_error", params: AnalyticsParams = {}) => {
  trackEvent("contact_form_submit", {
    form_status: status,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    ...params,
  });

  if (status === "success") {
    trackGoogleAdsConversion(contactConversionLabel, params);
  }
};
