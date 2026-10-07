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

  it("does not forward a same-site admin referrer after returning to public", async () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(new URL("/admin/dashboard?mode=internal", window.location.origin).href);
    const { analytics, gtag } = await loadAnalytics("/en/contact");
    analytics.trackPageView({ path: "/en/contact", language: "en" });
    expect(gtag).toHaveBeenCalledWith("config", "G-LLJGRG2YNP", { send_page_view: false, page_referrer: "" });
    expect(getEventPayload(gtag, "page_view")).toMatchObject({ page_path: "/en/contact", page_referrer: "" });
    expect(gtag).toHaveBeenCalledWith("config", "AW-18205206146");
  });

  it.each(["https://example.org/referral", "/en/services", "invalid-referrer"])(
    "preserves the existing config behavior for ordinary referrer %s", async (source) => {
      const referrer = source.startsWith("/") ? new URL(source, window.location.origin).href : source;
      vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
      const { analytics, gtag } = await loadAnalytics("/zh/contact");
      analytics.trackPageView({ path: "/zh/contact", language: "zh" });
      expect(gtag).toHaveBeenCalledWith("config", "G-LLJGRG2YNP", { send_page_view: false });
      expect(getEventPayload(gtag, "page_view")).not.toHaveProperty("page_referrer");
    },
  );
});

describe("lead analytics events", () => {
  it("does not count TEST responses after the URL changed while the request was pending", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/quote");
    analytics.trackQuoteFormSubmit("success", {}, "/zh/quote?fc_test=fc_paid_20261008_T01");
    analytics.trackContactFormSubmit("success", {}, "/zh/contact?fc_test=fc_paid_20261008_T02");
    expect(gtag).not.toHaveBeenCalled();
  });
  it.each(["/zh/quote?fc_test=fc_paid_20261008_T01", "/en/contact?fc_test=fc_paid_20261008_T02", "/zh/quote?fc_test=unknown"])(
    "does not load tags or send events/conversions on internal TEST page %s", async (path) => {
      const { analytics, gtag } = await loadAnalytics(path);
      analytics.trackPageView({ path: path.split("?")[0], language: "zh" });
      analytics.trackQuoteFormSubmit("success");
      analytics.trackContactFormSubmit("success");
      expect(gtag).not.toHaveBeenCalled();
      expect(document.getElementById("flashcast-google-tag")).toBeNull();
    },
  );
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
    window.history.pushState({}, "", "/zh");
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
    // Drain pending interaction listeners without requesting a tag on another test's route.
    window.history.pushState({}, "", "/admin");
    window.dispatchEvent(new Event("pointerdown"));
    if (vi.isFakeTimers()) vi.clearAllTimers();
    vi.useRealTimers();
    document.getElementById("flashcast-google-tag")?.remove();
  });

  it.each(["/admin", "/admin/publish-center", "/admin/login?next=quote"])(
    "does not initialize a public tag or events on %s",
    async (path) => {
      window.history.pushState({}, "", path);
      const analytics = await import("@/lib/analytics");
      analytics.initAnalytics();
      analytics.trackPageView({ path, language: "zh" });
      analytics.trackEvent("admin_probe");
      analytics.trackGoogleAdsConversion("conversion-label");
      window.dispatchEvent(new Event("pointerdown"));

      expect(window.gtag).toBeUndefined();
      expect(window.dataLayer).toBeUndefined();
      expect(window.requestIdleCallback).not.toHaveBeenCalled();
      expect(document.getElementById("flashcast-google-tag")).toBeNull();
    },
  );

  it("rejects an explicit admin pageview even while the current route is public", async () => {
    const analytics = await import("@/lib/analytics");
    analytics.trackPageView({ path: "/admin/publish-center?mode=draft" });
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });

  it("skips a pending idle load on admin and resumes on public without repeating config", async () => {
    const analytics = await import("@/lib/analytics");
    analytics.trackPageView({ path: "/zh", language: "zh" });
    const firstIdleCallback = vi.mocked(window.requestIdleCallback).mock.calls[0][0];

    window.history.pushState({}, "", "/admin/publish-center");
    firstIdleCallback({ didTimeout: false, timeRemaining: () => 0 });
    analytics.trackEvent("admin_probe");
    expect(document.getElementById("flashcast-google-tag")).toBeNull();

    window.history.pushState({}, "", "/en/furniture");
    analytics.trackPageView({ path: "/en/furniture", language: "en" });
    expect(window.requestIdleCallback).toHaveBeenCalledTimes(2);
    window.dispatchEvent(new Event("pointerdown"));
    expect(document.getElementById("flashcast-google-tag")).toBeInstanceOf(HTMLScriptElement);

    const commands = (window.dataLayer || []).map((entry) => Array.from(entry as IArguments));
    expect(commands.filter(([command]) => command === "config")).toHaveLength(2);
    expect(commands.filter(([command, event]) => command === "event" && event === "page_view"))
      .toHaveLength(2);
    expect(commands.flat()).not.toContain("admin_probe");
  });

  it("rechecks the admin boundary for the fallback timer and resumes the public load", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    Object.defineProperty(window, "requestIdleCallback", { configurable: true, value: undefined });
    const analytics = await import("@/lib/analytics");
    analytics.initAnalytics();
    window.history.pushState({}, "", "/admin");
    vi.advanceTimersByTime(3000);
    expect(document.getElementById("flashcast-google-tag")).toBeNull();

    window.history.pushState({}, "", "/zh/contact");
    analytics.initAnalytics();
    vi.advanceTimersByTime(3000);
    expect(document.getElementById("flashcast-google-tag")).toBeInstanceOf(HTMLScriptElement);
  });

  it("suppresses code-owned events after a public tag has loaded and preserves public reentry", async () => {
    const analytics = await import("@/lib/analytics");
    analytics.trackPageView({ path: "/zh", language: "zh" });
    window.dispatchEvent(new Event("pointerdown"));
    const commandCount = window.dataLayer?.length || 0;
    window.history.pushState({}, "", "/admin");
    analytics.initAnalytics();
    analytics.trackPageView({ path: "/admin" });
    analytics.trackCtaClick("phone", "admin_probe");
    analytics.trackGoogleAdsConversion("conversion-label");
    expect(window.dataLayer).toHaveLength(commandCount);

    window.history.pushState({}, "", "/en/contact");
    analytics.trackPageView({ path: "/en/contact", language: "en" });
    expect(window.dataLayer?.length).toBe(commandCount + 1);
    expect(document.querySelectorAll("#flashcast-google-tag")).toHaveLength(1);
  });

  it("queues Google commands as Arguments objects so gtag.js can dispatch them", async () => {
    const { trackPageView } = await import("@/lib/analytics");

    trackPageView({ path: "/en/services", language: "en" });

    // gtag.js distinguishes its Arguments command messages from ordinary array data.
    const commands = (window.dataLayer || []).filter(
      (entry) => Object.prototype.toString.call(entry) === "[object Arguments]",
    ).map((entry) => Array.from(entry as IArguments));
    expect(commands).toContainEqual(["config", "G-LLJGRG2YNP", { send_page_view: false }]);
    expect(commands).toContainEqual([
      "event", "page_view", expect.objectContaining({ page_path: "/en/services", language: "en" }),
    ]);
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

describe("public pageview document lifecycle", () => {
  const transitions = (type: string, persisted: boolean) => {
    const event = new Event(type);
    Object.defineProperty(event, "persisted", { value: persisted });
    window.dispatchEvent(event);
  };

  it("counts public BFCache restoration once and suppresses the following matching Router effect", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/quote?mode=public");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const visit = vi.fn();
    const tracker = analytics.createPublicPageViewLifecycle(visit);
    const stop = tracker.start();
    try {
      tracker.updateRoute("/zh/quote?mode=public", "zh");
      vi.advanceTimersByTime(0);
      transitions("pagehide", true);
      transitions("pageshow", true);
      tracker.updateRoute("/zh/quote?mode=public", "zh");
      vi.advanceTimersByTime(0);
      expect(gtag.mock.calls.filter(([command, event]) => command === "event" && event === "page_view")).toHaveLength(2);
      expect(visit).toHaveBeenCalledTimes(2);
      expect(visit).toHaveBeenLastCalledWith("/zh/quote");
      // A subsequent distinct query still gets a normal page view.
      window.history.pushState(null, "", "/zh/quote?mode=next");
      tracker.updateRoute("/zh/quote?mode=next", "zh");
      vi.advanceTimersByTime(0);
      expect(visit).toHaveBeenCalledTimes(3);
    } finally { stop(); vi.clearAllTimers(); vi.useRealTimers(); }
  });

  it("uses the restored URL language for a history jump and cancels pending departing work", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/quote");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const visit = vi.fn();
    const tracker = analytics.createPublicPageViewLifecycle(visit);
    const stop = tracker.start();
    try {
      tracker.updateRoute("/zh/quote", "zh");
      transitions("pagehide", true);
      window.history.pushState(null, "", "/en/contact");
      transitions("pageshow", true);
      tracker.updateRoute("/en/contact", "en");
      vi.advanceTimersByTime(0);
      expect(visit).toHaveBeenCalledOnce();
      expect(getEventPayload(gtag, "page_view")).toMatchObject({ page_path: "/en/contact", language: "en" });
    } finally { stop(); vi.clearAllTimers(); vi.useRealTimers(); }
  });

  it("does not initialize admin on ordinary or cached pageshow, and removes restore listeners", async () => {
    const { analytics, gtag } = await loadAnalytics("/admin");
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const visit = vi.fn();
    const tracker = analytics.createPublicPageViewLifecycle(visit);
    const stop = tracker.start();
    try {
      tracker.updateRoute("/admin", "zh");
      transitions("pageshow", false);
      transitions("pageshow", true);
      vi.advanceTimersByTime(0);
      expect(gtag).not.toHaveBeenCalled();
      expect(visit).not.toHaveBeenCalled();
      stop();
      window.history.pushState(null, "", "/en/contact");
      transitions("pageshow", true);
      expect(gtag).not.toHaveBeenCalled();
    } finally { stop(); vi.clearAllTimers(); vi.useRealTimers(); }
  });
});
