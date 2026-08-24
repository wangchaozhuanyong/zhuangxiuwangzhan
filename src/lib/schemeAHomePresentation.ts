import type { PublishedHomeContentBundle } from "@/lib/homeContentApi";
import { withQuoteFormHash } from "@/lib/quoteContext";
import { toRecord } from "@/lib/recordUtils";

type Language = "en" | "zh";

type HomeFallbackCopy = {
  heroStats: readonly { value: string; label: string }[];
  processSteps: readonly { step: string; title: string; desc: string }[];
  quoteCta: string;
  contactLabel: string;
  contactTitle: string;
  contactCta: string;
};

export type SchemeAHomePresentation = {
  heroAction: {
    label: string;
    url: string;
  };
  stats: Array<{ value: string; label: string }>;
  statsSource: "cms" | "fallback";
  processSteps: Array<{ step: string; title: string; desc: string }>;
  processSource: "cms" | "fallback";
  contact: {
    label: string;
    title: string;
    ctaLabel: string;
    ctaUrl: string;
  };
  contactSource: "cms" | "fallback";
};

const readLocalizedItemText = (
  value: unknown,
  language: Language,
  fields: readonly string[],
) => {
  const item = toRecord(value);
  for (const field of fields) {
    const localized = item[`${field}_${language}`];
    if (typeof localized === "string" && localized.trim()) return localized.trim();
    const shared = item[field];
    if (typeof shared === "string" && shared.trim()) return shared.trim();
  }
  return "";
};

const resolveHomeActionUrl = (url?: string | null) => {
  const value = String(url || "").trim();
  if (!value) return withQuoteFormHash("/quote");

  const path = value.split("#")[0];
  if (/^\/(?:(?:en|zh)\/)?quote(?:\?|$)/.test(path)) {
    return withQuoteFormHash(value);
  }

  return value;
};

const resolveStats = (
  content: PublishedHomeContentBundle | undefined,
  language: Language,
  fallback: HomeFallbackCopy["heroStats"],
) => {
  const items = content?.statsSection?.items || [];
  if (items.length !== 3) return { items: fallback.map((item) => ({ ...item })), source: "fallback" as const };

  const resolved = items.map((item) => ({
    value: readLocalizedItemText(item, language, ["value"]),
    label: readLocalizedItemText(item, language, ["label", "title", "desc"]),
  }));

  if (resolved.some((item) => !item.value || !item.label)) {
    return { items: fallback.map((item) => ({ ...item })), source: "fallback" as const };
  }

  return { items: resolved, source: "cms" as const };
};

const resolveProcessSteps = (
  content: PublishedHomeContentBundle | undefined,
  fallback: HomeFallbackCopy["processSteps"],
) => {
  const steps = content?.processSteps || [];
  if (steps.length !== 4 || steps.some((step) => !step.title || !step.description)) {
    return { items: fallback.map((step) => ({ ...step })), source: "fallback" as const };
  }

  return {
    items: steps.map((step, index) => ({
      step: String(step.step_number || index + 1).padStart(2, "0"),
      title: step.title,
      desc: step.description,
    })),
    source: "cms" as const,
  };
};

const resolveContact = (
  content: PublishedHomeContentBundle | undefined,
  fallback: HomeFallbackCopy,
) => {
  const cta = content?.ctaBlock;
  const supportsCurrentTemplate = Boolean(
    cta?.title
    && cta.primary_label
    && !cta.secondary_label
    && !cta.secondary_url
    && !cta.image_url,
  );

  if (!cta || !supportsCurrentTemplate) {
    return {
      value: {
        label: fallback.contactLabel,
        title: fallback.contactTitle,
        ctaLabel: fallback.contactCta,
        ctaUrl: withQuoteFormHash("/quote"),
      },
      source: "fallback" as const,
    };
  }

  return {
    value: {
      label: fallback.contactLabel,
      title: cta.title,
      ctaLabel: cta.primary_label,
        ctaUrl: resolveHomeActionUrl(cta.primary_url),
    },
    source: "cms" as const,
  };
};

export const resolveSchemeAHomePresentation = (
  content: PublishedHomeContentBundle | undefined,
  language: Language,
  fallback: HomeFallbackCopy,
): SchemeAHomePresentation => {
  const hero = content?.heroSlides[0];
  const stats = resolveStats(content, language, fallback.heroStats);
  const process = resolveProcessSteps(content, fallback.processSteps);
  const contact = resolveContact(content, fallback);

  return {
    heroAction: {
      label: hero?.buttonLabel || fallback.quoteCta,
      url: resolveHomeActionUrl(hero?.buttonUrl),
    },
    stats: stats.items,
    statsSource: stats.source,
    processSteps: process.items,
    processSource: process.source,
    contact: contact.value,
    contactSource: contact.source,
  };
};
