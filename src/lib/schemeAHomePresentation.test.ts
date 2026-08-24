import { describe, expect, it } from "vitest";
import { resolveSchemeAHomePresentation } from "@/lib/schemeAHomePresentation";
import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";

const fallback = {
  heroStats: [
    { value: "Design", label: "Planning support" },
    { value: "Clear Quotes", label: "Written details" },
    { value: "Project Care", label: "Ongoing coordination" },
  ],
  processSteps: [
    { step: "01", title: "One", desc: "First" },
    { step: "02", title: "Two", desc: "Second" },
    { step: "03", title: "Three", desc: "Third" },
    { step: "04", title: "Four", desc: "Fourth" },
  ],
  quoteCta: "Get quote",
  contactLabel: "Ready?",
  contactTitle: "Tell us about the space.",
  contactCta: "Request quote",
} as const;

const bundle = (patch: Partial<PublishedHomeContentBundle>): PublishedHomeContentBundle => ({
  pageContent: null,
  heroSlides: [],
  statsSection: null,
  whyChooseUsSection: null,
  projects: [],
  brandPartnersEnabled: false,
  brandPartners: [],
  services: [],
  processSteps: [],
  beforeAfterItems: [],
  testimonials: [],
  faqs: [],
  ctaBlock: null,
  ...patch,
});

describe("resolveSchemeAHomePresentation", () => {
  it("uses compatible CMS modules and adds the quote form anchor", () => {
    const result = resolveSchemeAHomePresentation(bundle({
      heroSlides: [{ id: "hero", title: "", excerpt: "", buttonLabel: "Start", buttonUrl: "/quote", image: "", alt: "" }],
      statsSection: {
        id: "stats",
        section_key: "stats",
        title: "",
        subtitle: "",
        content: "",
        items: [
          { value: "A", label_en: "Alpha" },
          { value: "B", label_en: "Beta" },
          { value: "C", label_en: "Gamma" },
        ],
      },
      processSteps: [1, 2, 3, 4].map((step) => ({ id: String(step), step_number: step, title: `Step ${step}`, description: `Description ${step}` })),
      ctaBlock: {
        id: "cta",
        block_key: "home_final",
        title: "Plan a renovation",
        description: "",
        primary_label: "Start",
        primary_url: "/quote",
        secondary_label: "",
        secondary_url: "",
      },
    }), "en", fallback);

    expect(result.heroAction).toEqual({ label: "Start", url: "/quote#quote-form" });
    expect(result.statsSource).toBe("cms");
    expect(result.stats.map((item) => item.label)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(result.processSource).toBe("cms");
    expect(result.processSteps[0]).toEqual({ step: "01", title: "Step 1", desc: "Description 1" });
    expect(result.contactSource).toBe("cms");
    expect(result.contact.ctaUrl).toBe("/quote#quote-form");
  });

  it("keeps the approved layout copy when CMS modules do not match the active template", () => {
    const result = resolveSchemeAHomePresentation(bundle({
      statsSection: { id: "stats", section_key: "stats", title: "", subtitle: "", content: "", items: [{ value: "1", label_en: "One" }] },
      processSteps: [{ id: "1", step_number: 1, title: "Only", description: "One" }],
      ctaBlock: {
        id: "cta",
        block_key: "home_final",
        title: "Legacy CTA",
        description: "",
        primary_label: "Start",
        primary_url: "/quote",
        secondary_label: "Second action",
        secondary_url: "/contact",
      },
    }), "en", fallback);

    expect(result.statsSource).toBe("fallback");
    expect(result.stats).toEqual(fallback.heroStats);
    expect(result.processSource).toBe("fallback");
    expect(result.processSteps).toEqual(fallback.processSteps);
    expect(result.contactSource).toBe("fallback");
    expect(result.contact.title).toBe(fallback.contactTitle);
  });

  it("preserves non-quote CMS action destinations", () => {
    const result = resolveSchemeAHomePresentation(bundle({
      heroSlides: [{ id: "hero", title: "", excerpt: "", buttonLabel: "Contact", buttonUrl: "/contact", image: "", alt: "" }],
      ctaBlock: {
        id: "cta",
        block_key: "home_final",
        title: "Talk to us",
        description: "",
        primary_label: "WhatsApp",
        primary_url: "https://wa.me/601128853888",
        secondary_label: "",
        secondary_url: "",
      },
    }), "en", fallback);

    expect(result.heroAction.url).toBe("/contact");
    expect(result.contact.ctaUrl).toBe("https://wa.me/601128853888");
  });
});
