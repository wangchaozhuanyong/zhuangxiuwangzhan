import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OldHouseRenovation from "./OldHouseRenovation";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";
import { mapPublishedService } from "@/lib/contentApi";

// Synthetic display data only, never any protected candidate or approval material.
const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", data: undefined as ReturnType<typeof mapPublishedService> | undefined, loading: false, error: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
const query = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedServiceBySlug: (...args: unknown[]) => {
  query(...args);
  return { data: state.data, isLoading: state.loading, isInitialError: state.error };
} }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePageConsultation: () => undefined }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://example.test/contact" }) }));
vi.mock("@/components/DeferredSmartImage", () => ({ DeferredSmartImage: () => null }));
vi.mock("@/components/ImageComparisonSlider", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdService: () => null, JsonLdBreadcrumb: () => null,
  JsonLdFAQ: ({ faqs }: { faqs: unknown }) => <script data-testid="faq-schema" type="application/ld+json">{JSON.stringify(faqs)}</script> }));

let container: HTMLDivElement;
let root: Root;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
beforeEach(() => { state.data = undefined; state.loading = false; state.error = false; query.mockClear(); });
afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); });
const tree = () => <MemoryRouter><OldHouseRenovation /></MemoryRouter>;
async function render() {
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  await act(async () => { root.render(tree()); });
}
const schema = () => JSON.parse(container.querySelector('[data-testid="faq-schema"]')?.textContent || "[]");
const questions = () => Array.from(container.querySelectorAll(".fc-route-faq button")).map(node => node.textContent?.replace(/\s+/g, " ").trim());
const fixture = (value: unknown) => mapPublishedService({ id: "test-published-record", slug: "old-house", status: "published", [`faqs_${state.language}`]: value }, state.language);

describe("old-house published CMS FAQ / client schema parity", () => {
  for (const language of ["en", "zh"] as const) {
    it(`${language}: uses only the selected published locale and safely filters incomplete entries`, async () => {
      state.language = language;
      const q = language === "zh" ? "测试中文问题" : "Test published question";
      const a = language === "zh" ? "测试中文回答" : "Test published answer";
      state.data = mapPublishedService({ id: "test-record", slug: "old-house", status: "published",
        [`faqs_${language}`]: [{ q: `<b>${q}</b>`, a: `<p>${a}</p>` }, null, { q: "Incomplete" }, { question: "Alias question", answer: "Alias answer" }],
        [`faqs_${language === "en" ? "zh" : "en"}`]: [{ q: "Other locale", a: "Other locale answer" }] }, language);
      await render();
      expect(query).toHaveBeenCalledWith("old-house", language);
      expect(schema()).toEqual([{ question: q, answer: a }, { question: "Alias question", answer: "Alias answer" }]);
      expect(questions()).toHaveLength(2);
      expect(questions()[0]).toContain(q);
      expect(container).toHaveTextContent(a);
      expect(container).not.toHaveTextContent("Other locale");
    });

    it(`${language}: reflects a published FAQ refresh in both visible answers and schema`, async () => {
      state.language = language; state.data = fixture([{ q: "First test question", a: "First test answer" }]);
      await render();
      state.data = fixture([{ q: "Refreshed test question", a: "Refreshed test answer" }]);
      await act(async () => { root.render(tree()); });
      expect(schema()).toEqual([{ question: "Refreshed test question", answer: "Refreshed test answer" }]);
      expect(questions()[0]).toContain("Refreshed test question");
      expect(container).not.toHaveTextContent("First test question");
    });

    it(`${language}: keeps reviewed fallback FAQ while loading or after a failed read`, async () => {
      state.language = language; state.loading = true;
      await render();
      const expected = oldHouseRenovationPageText[language].faqs.map(({ q, a }) => ({ question: q, answer: a }));
      expect(schema()).toEqual(expected);
      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
      state.loading = false; state.error = true;
      await act(async () => { root.render(tree()); });
      expect(schema()).toEqual(expected);
      expect(questions()).toHaveLength(expected.length);
      expect(container.querySelector("h1")).not.toBeNull();
    });

    it(`${language}: uses the page fallback rather than the query's local service fallback`, async () => {
      state.language = language;
      state.data = mapPublishedService({ id: "old-house", slug: "old-house", [`faqs_${language}`]: [{ q: "Legacy local fallback", a: "Legacy answer" }] }, language);
      await render();
      expect(schema()).toEqual(oldHouseRenovationPageText[language].faqs.map(({ q, a }) => ({ question: q, answer: a })));
      expect(container).not.toHaveTextContent("Legacy local fallback");
    });

    it.each([{ value: [] }, { value: null }, { value: "invalid" }, { value: [{ q: "Incomplete" }] }])(`${language}: keeps a published empty or invalid locale empty (%j)`, async ({ value }) => {
      state.language = language; state.data = fixture(value);
      await render();
      expect(schema()).toEqual([]);
      expect(questions()).toEqual([]);
      expect(container.querySelector("h1")).not.toBeNull();
      expect(container.querySelector('a[href*="/quote"]')).not.toBeNull();
    });
  }
});
