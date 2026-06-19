import { beforeEach, describe, expect, it, vi } from "vitest";

type GtagSpy = ReturnType<typeof vi.fn<(...args: unknown[]) => void>>;

const browserAnalyticsWindow = () =>
  window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

const loadAnalytics = async (path = "/zh/quote") => {
  vi.resetModules();
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
});

describe("analytics defaults", () => {
  it("keeps the GA4 measurement id configured by default", async () => {
    const { analytics } = await loadAnalytics();

    expect(analytics.gaMeasurementId).toBe("G-K71PQ0MSV2");
    expect(analytics.isAnalyticsEnabled).toBe(true);
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
      send_to: expect.stringContaining("AW-18205206146/"),
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

  it("tracks WhatsApp CTA clicks separately from generic CTA clicks", async () => {
    const { analytics, gtag } = await loadAnalytics("/zh/services/renovation");

    analytics.trackCtaClick("whatsapp", "floating_bar", { language: "zh" });

    expect(getEventNames(gtag)).toEqual(expect.arrayContaining(["cta_click", "whatsapp_click", "conversion"]));
    expect(getEventPayload(gtag, "whatsapp_click")).toMatchObject({
      conversion_source: "direct_cta_click",
      cta_name: "whatsapp",
      cta_location: "floating_bar",
      page_path: "/zh/services/renovation",
      language: "zh",
    });
  });
});
