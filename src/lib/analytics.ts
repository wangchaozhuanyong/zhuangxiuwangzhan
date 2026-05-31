type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = String(import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();
const configuredPagesReportUrl = String(import.meta.env.VITE_GA4_PAGES_REPORT_URL || "").trim();
const googleTagScriptId = "flashcast-ga4-tag";

export const isAnalyticsEnabled = Boolean(measurementId);
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
  if (!canUseBrowserAnalytics() || document.getElementById(googleTagScriptId)) return;

  const script = document.createElement("script");
  script.id = googleTagScriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
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
  window.gtag("config", measurementId, { send_page_view: false });
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

export const trackQuoteFormSubmit = (status: "success" | "error" | "validation_error", params: AnalyticsParams = {}) => {
  trackEvent("quote_form_submit", {
    form_status: status,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    ...params,
  });
};
