import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServiceItem } from "@/data/types";
import ServiceDetail from "@/pages/ServiceDetail";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", service: null as ServiceItem | null, loading: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedServiceBySlug: () => ({ data: state.service, isLoading: state.loading }),
  usePublishedServices: () => ({ data: state.service ? [state.service] : [] }),
}));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/components/PageMeta", () => ({ default: ({ title, description }: { title: string; description: string }) => <div data-testid="meta" data-title={title} data-description={description} /> }));
vi.mock("@/components/JsonLd", () => ({
  JsonLdService: ({ name, description }: { name: string; description: string }) => <script data-testid="service-schema" type="application/ld+json">{JSON.stringify({ name, description })}</script>,
  JsonLdBreadcrumb: () => null,
  JsonLdFAQ: ({ faqs }: { faqs: Array<{ question: string; answer: string }> }) => <script data-testid="faq-schema" type="application/ld+json">{JSON.stringify(faqs)}</script>,
}));

let container: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); });
async function renderRoute() {
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(tree()); });
  if (!state.loading) await vi.waitFor(() => expect(container.querySelector("h1")).not.toBeNull(), { timeout: 5_000 });
}
const meta = () => container.querySelector('[data-testid="meta"]');
const faqSchema = () => JSON.parse(container.querySelector('[data-testid="faq-schema"]')?.textContent || "[]");
const hasQuestion = (text: string) => Array.from(container.querySelectorAll(".fcd-faq-question__text")).some(element => element.textContent?.trim() === text);

function fixture(language: "en" | "zh"): ServiceItem {
  const zh = language === "zh";
  return {
    id: "published-design-fixture", slug: "design", title: zh ? "已发布空间设计" : "Published space design",
    summary: zh ? "已发布的咨询范围" : "Published consultation scope",
    description: zh ? '<p>后台中文范围</p><a href="/zh/services/builtin">定制柜</a>' : '<p>Published scope from CMS</p><a href="/en/services/builtin">Cabinetry</a>',
    seoTitle: zh ? "后台中文SEO标题" : "CMS SEO title", seoDescription: zh ? "后台中文SEO描述" : "CMS SEO description",
    image: "/images/services/design-services.webp", suitableFor: [], commonProjects: [], processSteps: [], items: [],
    faqs: Array.from({ length: 5 }, (_, index) => ({ q: zh ? `后台第${index + 1}问` : `CMS question ${index + 1}`, a: zh ? `后台第${index + 1}答` : `CMS answer ${index + 1}` })),
  };
}

function tree() {
  return <MemoryRouter initialEntries={[`/${state.language}/services/design`]}><Routes><Route path="/:lang/services/:slug" element={<ServiceDetail />} /></Routes></MemoryRouter>;
}

describe("Design service consumes published CMS through its existing route", () => {
  for (const language of ["en", "zh"] as const) {
    it(`${language}: uses localized CMS metadata, overview and all five published FAQs`, async () => {
      state.language = language; state.service = fixture(language);
      await renderRoute();
      expect(container.querySelector("h1")).toHaveTextContent(state.service.title);
      expect(meta()).toHaveAttribute("data-title", state.service.seoTitle);
      expect(meta()).toHaveAttribute("data-description", state.service.seoDescription);
      expect(container).toHaveTextContent(language === "zh" ? "后台中文范围" : "Published scope from CMS");
      const questions = faqSchema();
      expect(questions).toHaveLength(5);
      for (const faq of state.service.faqs) expect(hasQuestion(faq.q)).toBe(true);
      expect(document.querySelector(`a[href="/${language}/services/builtin"]`)).not.toBeNull();
      const quote = document.querySelector('a[data-fcd-link="quote"]') as HTMLAnchorElement;
      expect(quote.pathname).toBe(`/${language}/quote`);
      expect(new URL(quote.href).searchParams.get("title")).toBe(state.service.title);
    });

    it(`${language}: reflects a subsequent published record refresh without changing code`, async () => {
      state.language = language; state.service = fixture(language);
      await renderRoute();
      const lastQuestion = container.querySelectorAll<HTMLButtonElement>('.fcd-faq-question')[4];
      await act(async () => { lastQuestion.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); });
      expect(container.querySelector('.fcd-faq-answer:not([hidden])')).toHaveTextContent(state.service.faqs[4].a);
      state.service = { ...state.service, title: `${state.service.title} v2`, seoTitle: "Refreshed metadata v2", description: '<p>Updated published record v2</p>', faqs: [{ q: "Updated question v2", a: "Updated answer v2" }] };
      await act(async () => { root.render(tree()); });
      expect(container.querySelector("h1")).toHaveTextContent(state.service.title);
      expect(meta()).toHaveAttribute("data-title", "Refreshed metadata v2");
      expect(container).toHaveTextContent("Updated published record v2");
      expect(hasQuestion("Updated question v2")).toBe(true);
      expect(container.querySelector('.fcd-faq-answer:not([hidden])')).toHaveTextContent("Updated answer v2");
      expect(faqSchema()).toEqual([{ question: "Updated question v2", answer: "Updated answer v2" }]);
    });
  }

  it("waits for the published design record instead of briefly showing old fallback FAQs", async () => {
    state.language = "en"; state.service = null; state.loading = true;
    await renderRoute();
    expect(container.querySelector("[data-route-pending]")).not.toBeNull();
    expect(container.querySelector("h1")).toBeNull();
    state.service = fixture("en"); state.loading = false;
    await act(async () => { root.render(tree()); });
    expect(container.querySelector("h1")).toHaveTextContent(state.service.title);
    expect(faqSchema()).toHaveLength(5);
  });

  it("sanitizes CMS HTML and rejects a cross-language body link", async () => {
    state.language = "zh"; state.service = { ...fixture("zh"), description: '<p>保留正文</p><script>window.untrusted=true</script><img src=x onerror=alert(1)><a href="/en/quote">异语言链接</a><a href="/zh/quote">正确语言链接</a>' };
    await renderRoute();
    expect(container).toHaveTextContent("保留正文");
    const overview = document.querySelector('[aria-labelledby="fcd-overview-title"]')!;
    expect(overview.querySelector("script,img,[onerror]")).toBeNull();
    expect(overview.querySelector('a[href="/en/quote"]')).toBeNull();
    expect(overview.querySelector('a[href="/zh/quote"]')).not.toBeNull();
  });

  it("does not replace an empty published FAQ list with the four local draft questions", async () => {
    state.language = "en"; state.service = { ...fixture("en"), faqs: [], seoTitle: undefined, seoDescription: undefined };
    await renderRoute();
    expect(container.querySelector("h1")).toHaveTextContent(state.service.title);
    expect(meta()).toHaveAttribute("data-title", state.service.title);
    expect(meta()).toHaveAttribute("data-description", state.service.summary);
    expect(document.querySelector('[aria-labelledby="fcd-faq-title"]')).toBeNull();
    expect(faqSchema()).toEqual([]);
  });
});
