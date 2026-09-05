import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type GtagSpy = ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;

const browserAnalyticsWindow = () =>
  window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

const loadAnalytics = async (
  path = "/zh/quote",
  conversionLabels: {
    quote?: string;
    contact?: string;
  } = {
    quote: "quote-label",
    contact: "contact-label",
  },
) => {
  vi.resetModules();
  vi.stubEnv("VITE_GOOGLE_ADS_QUOTE_CONVERSION_LABEL", conversionLabels.quote || "");
  vi.stubEnv("VITE_GOOGLE_ADS_CONTACT_CONVERSION_LABEL", conversionLabels.contact || "");
  document.head.innerHTML = "";
  window.history.pushState({}, "", path);

  const gtag = vi.fn<(...args: unknown[]) => void>();
  browserAnalyticsWindow().dataLayer = [];
  browserAnalyticsWindow().gtag = gtag;

  const analytics = await import("@/lib/analytics");
  return { analytics, gtag };
};

const getEventNames = (gtag: GtagSpy) =>
  gtag.mock.calls
    .filter(([command]) => command === "event")
    .map(([, eventName]) => eventName);

const getEventPayload = (gtag: GtagSpy, eventName: string) =>
  gtag.mock.calls.find(([command, candidate]) => command === "event" && candidate === eventName)?.[2] as
    | Record<string, unknown>
    | undefined;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
  vi.stubEnv("VITE_GA4_PAGES_REPORT_URL", "");
});

describe("analytics defaults", () => {
  it("replaces a generic or env-comment-truncated report link with the Flashcast property", async () => {
    vi.stubEnv("VITE_GA4_PAGES_REPORT_URL", "https://analytics.google.com/analytics/web/");
    const { analytics } = await loadAnalytics();
    expect(analytics.ga4PagesReportUrl).toContain("a396903314p540413787/");
  });
  it("keeps the GA4 measurement id configured by default", async () => {
    const { analytics } = await loadAnalytics();

    expect(analytics.gaMeasurementId).toBe("G-LLJGRG2YNP");
    expect(analytics.isAnalyticsEnabled).toBe(true);
    expect(analytics.ga4PagesReportUrl).toContain("a396903314p540413787/");
  });

  it("sends page views to the Flashcast stream by default", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/services");
    analytics.trackPageView({ path: "/zh/services", language: "zh" });
    expect(gtag).toHaveBeenCalledWith("config", "G-LLJGRG2YNP", { send_page_view: false });
    expect(getEventPayload(gtag, "page_view")).toMatchObject({ page_path: "/zh/services" });
    expect(gtag.mock.calls.flat()).not.toContain("G-K71PQ0MSV2");
  });

  it("preserves explicit measurement and report configuration", async () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TESTSTREAM");
    vi.stubEnv("VITE_GA4_PAGES_REPORT_URL", "https://analytics.google.com/analytics/web/#/p123/reports");
    const { analytics } = await loadAnalytics();
    expect(analytics.gaMeasurementId).toBe("G-TESTSTREAM");
    expect(analytics.ga4PagesReportUrl).toContain("p123/reports");
  });

  it("allows production analytics only on FLASH CAST production hosts", async () => {
    const { analytics } = await loadAnalytics();

    expect(analytics.isProductionAnalyticsHost("flashcast.com.my")).toBe(true);
    expect(analytics.isProductionAnalyticsHost("WWW.FLASHCAST.COM.MY")).toBe(true);
    expect(analytics.isProductionAnalyticsHost("localhost")).toBe(false);
    expect(analytics.isProductionAnalyticsHost("preview.pages.dev")).toBe(false);
  });
});

describe("lead analytics events", () => {
  it("tracks successful quote submissions as a distinct GA4 lead event", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/quote");

    analytics.trackQuoteFormSubmit("success", { service_type: "renovation" });

    expect(getEventNames(gtag)).toEqual(
      expect.arrayContaining(["quote_form_submit", "quote_form_success", "generate_lead", "conversion"]),
    );
    expect(getEventPayload(gtag, "quote_form_success")).toMatchObject({
      conversion_source: "quote_form_success",
      lead_type: "quote_form",
      method: "quote_form",
      page_path: "/zh/quote",
      service_type: "renovation",
    });
    expect(getEventPayload(gtag, "generate_lead")).toMatchObject({
      conversion_source: "quote_form_success",
      lead_type: "quote_form",
      method: "quote_form",
      page_path: "/zh/quote",
      service_type: "renovation",
    });
    expect(getEventPayload(gtag, "conversion")).toMatchObject({
      conversion_source: "quote_form_success",
      send_to: "AW-18205206146/quote-label",
    });
  });

  it("uses the contact form conversion label only after a successful contact submission", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/contact");

    analytics.trackContactFormSubmit("success", { project_type: "condo" });

    expect(getEventPayload(gtag, "conversion")).toMatchObject({
      conversion_source: "contact_form_success",
      send_to: "AW-18205206146/contact-label",
    });
  });

  it("does not count validation errors as successful leads", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/quote");

    analytics.trackQuoteFormSubmit("validation_error", { error_step: "phone" });

    expect(getEventNames(gtag)).toContain("quote_form_submit");
    expect(getEventNames(gtag)).not.toContain("quote_form_success");
    expect(getEventNames(gtag)).not.toContain("generate_lead");
    expect(getEventNames(gtag)).not.toContain("conversion");
  });

  it("tracks WhatsApp CTA clicks as observations without counting them as leads or Ads conversions", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/services/renovation");

    analytics.trackCtaClick("whatsapp", "floating_bar", { language: "zh" });

    expect(getEventNames(gtag)).toEqual(expect.arrayContaining(["cta_click", "whatsapp_click"]));
    expect(getEventNames(gtag)).not.toContain("generate_lead");
    expect(getEventNames(gtag)).not.toContain("conversion");
    expect(getEventPayload(gtag, "whatsapp_click")).toMatchObject({
      conversion_source: "direct_cta_click",
      cta_name: "whatsapp",
      cta_location: "floating_bar",
      page_path: "/zh/services/renovation",
      language: "zh",
    });
  });

  it("tracks phone CTA clicks as observations without counting them as leads or Ads conversions", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/contact");

    analytics.trackCtaClick("phone", "mobile_action_bar", { language: "zh" });

    expect(getEventNames(gtag)).toEqual(expect.arrayContaining(["cta_click", "phone_click"]));
    expect(getEventNames(gtag)).not.toContain("generate_lead");
    expect(getEventNames(gtag)).not.toContain("conversion");
    expect(getEventPayload(gtag, "phone_click")).toMatchObject({
      conversion_source: "direct_cta_click",
      cta_name: "phone",
      cta_location: "mobile_action_bar",
      page_path: "/zh/contact",
      language: "zh",
    });
  });

  it("never promotes a WhatsApp click to a lead or Ads conversion", async () => {
    vi.stubEnv("VITE_GOOGLE_ADS_WHATSAPP_CONVERSION_LABEL", "legacy-whatsapp-label");
    const { analytics, gtag } = await loadAnalytics("/zh/services/renovation");

    analytics.trackCtaClick("whatsapp", "service_detail_hero");

    expect(getEventNames(gtag)).toEqual(expect.arrayContaining(["cta_click", "whatsapp_click"]));
    expect(getEventNames(gtag)).not.toContain("generate_lead");
    expect(getEventNames(gtag)).not.toContain("conversion");
  });
});

describe("analytics loading", () => {
  beforeEach(() => {
    vi.resetModules();
    document.getElementById("flashcast-google-tag")?.remove();
    delete window.gtag;
    delete window.dataLayer;
    Object.defineProperty(window, "requestIdleCallback", {
      configurable: true,
      value: vi.fn(() => 1),
    });
    Object.defineProperty(window, "cancelIdleCallback", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    document.getElementById("flashcast-google-tag")?.remove();
  });

  it("defers the Google Tag script until the first interaction", async () => {
    const { initAnalytics } = await import("@/lib/analytics");

    initAnalytics();
    expect(document.getElementById("flashcast-google-tag")).toBeNull();

    window.dispatchEvent(new Event("pointerdown"));
    expect(document.getElementById("flashcast-google-tag")).toBeInstanceOf(HTMLScriptElement);
  });

  it("loads the Google Tag immediately for a conversion event", async () => {
    const { trackGoogleAdsConversion } = await import("@/lib/analytics");

    trackGoogleAdsConversion("conversion-label", { value: 1 });

    expect(document.getElementById("flashcast-google-tag")).toBeInstanceOf(HTMLScriptElement);
    expect(window.dataLayer?.length).toBeGreaterThan(0);
  });
});
