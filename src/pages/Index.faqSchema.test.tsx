import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import Index from "./Index";

const state = vi.hoisted(() => ({
  language: "en" as "en" | "zh",
  source: "remote",
  faqs: [{ question: "Published question", answer: "Published answer" }],
  coreLoading: false,
  brandPartnersEnabled: false,
  testimonialsEnabled: false,
  brandVisibility: undefined as boolean | undefined,
  testimonialVisibility: undefined as boolean | undefined,
}));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/config/site", () => ({ siteConfig: { url: "https://faq-schema.test" } }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedHomeContentBundle: () => ({
    data: { source: state.source, data: { pageContent: null, faqs: state.faqs, brandPartnersEnabled: state.brandPartnersEnabled, testimonialsEnabled: state.testimonialsEnabled } },
    isLoading: state.coreLoading, refetch: vi.fn(),
  }),
  usePublishedHomeOptionalSectionVisibility: (section: string) => ({
    data: section === "brand_partners" ? state.brandVisibility : state.testimonialVisibility,
    isLoading: true, isInitialError: false,
  }),
}));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/PublicContentNotice", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({
  JsonLdFAQ: () => null, JsonLdLocalBusiness: () => null, JsonLdOrganization: () => null,
}));
vi.mock("@/components/scheme-a/SchemeAHome", () => ({
  default: ({ faqItems, content }: { faqItems: { question: string; answer: string }[]; content: { brandPartnersEnabled: boolean; testimonialsEnabled: boolean } }) =>
    <div data-brand-visible={content.brandPartnersEnabled} data-testimonial-visible={content.testimonialsEnabled}>{faqItems.map((faq) => <p key={faq.question}>{faq.question}: {faq.answer}</p>)}</div>,
}));
let script: HTMLScriptElement;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  state.language = "en"; state.source = "remote";
  state.coreLoading = false; state.brandPartnersEnabled = false; state.testimonialsEnabled = false;
  state.brandVisibility = undefined; state.testimonialVisibility = undefined;
  state.faqs = [{ question: "Published question", answer: "Published answer" }];
  script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.flashcastEdgeSchema = "";
  script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", name: "FLASH CAST" },
    { "@type": "FAQPage", mainEntity: [{ acceptedAnswer: { text: "Old answer" } }] },
  ] });
  document.head.append(script);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove(); script.remove(); vi.unstubAllGlobals();
});
const render = async () => { await act(async () => root.render(<Index />)); };
const faqNode = () => JSON.parse(script.textContent || "{}")["@graph"]
  .find((node: Record<string, unknown>) => node["@type"] === "FAQPage");

describe("published home FAQ and edge schema after a browser refetch", () => {
  it("does not hold required homepage content for unresolved optional visibility", async () => {
    await render();
    expect(container.querySelector("main")).not.toHaveAttribute("data-route-pending");
    expect(container.querySelector("[data-brand-visible]")).toHaveAttribute("data-brand-visible", "false");
    expect(container.querySelector("[data-testimonial-visible]")).toHaveAttribute("data-testimonial-visible", "false");
    state.coreLoading = true;
    await render();
    expect(container.querySelector("main")).toHaveAttribute("data-route-pending", "true");
  });
  it("retains confirmed seed visibility and honors independent current disable results", async () => {
    state.brandPartnersEnabled = true; state.testimonialsEnabled = true;
    await render();
    expect(container.querySelector("[data-brand-visible]")).toHaveAttribute("data-brand-visible", "true");
    expect(container.querySelector("[data-testimonial-visible]")).toHaveAttribute("data-testimonial-visible", "true");
    state.brandVisibility = false; state.testimonialVisibility = false;
    await render();
    expect(container.querySelector("[data-brand-visible]")).toHaveAttribute("data-brand-visible", "false");
    expect(container.querySelector("[data-testimonial-visible]")).toHaveAttribute("data-testimonial-visible", "false");
  });
  it("does not activate local fallback brands or testimonials using remote visibility", async () => {
    state.source = "fallback";
    state.brandVisibility = true; state.testimonialVisibility = true;
    await render();
    expect(container.querySelector("[data-brand-visible]")).toHaveAttribute("data-brand-visible", "false");
    expect(container.querySelector("[data-testimonial-visible]")).toHaveAttribute("data-testimonial-visible", "false");
  });
  it("updates the document from the same displayed list after each successful refetch", async () => {
    await render();
    expect(container.textContent).toBe("Published question: Published answer");
    expect(faqNode().mainEntity[0].acceptedAnswer.text).toBe("Published answer");
    state.faqs = [{ question: "Published question", answer: "Updated answer" }];
    await render();
    expect(container.textContent).toBe("Published question: Updated answer");
    expect(faqNode().mainEntity[0].acceptedAnswer.text).toBe("Updated answer");
    expect(JSON.parse(script.textContent || "{}")["@graph"][0]).toEqual({ "@type": "Organization", name: "FLASH CAST" });
  });
  it("removes withdrawn answers and blank FAQ items from display and schema", async () => {
    state.faqs = [{ question: "  ", answer: "Blank question must not be a claim" }];
    await render();
    expect(container.textContent).toBe("");
    expect(faqNode()).toBeUndefined();
  });
  it("binds the FAQ identity to the current language", async () => {
    state.language = "zh";
    state.faqs = [{ question: "已发布问题", answer: "已发布回答" }];
    await render();
    expect(container.textContent).toBe("已发布问题: 已发布回答");
    expect(faqNode()["@id"]).toBe("https://faq-schema.test/zh#faq");
    expect(faqNode().mainEntity[0].acceptedAnswer.text).toBe("已发布回答");
  });
  it("preserves the server graph while a local fallback is used", async () => {
    state.source = "fallback";
    const before = script.textContent;
    await render();
    expect(script.textContent).toBe(before);
  });
  it("does not overwrite a malformed server document", async () => {
    script.textContent = "malformed fixture";
    await render();
    expect(script.textContent).toBe("malformed fixture");
  });
});
