import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LocationPage from "./LocationPage";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", empty: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/config/site", () => ({ siteConfig: { url: "https://fixture.invalid" } }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ company_name: "Fixture company", address: "Fixture address" }) }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/blocks/CTABanner", () => ({ default: () => null }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", async (original) => ({
  ...await original<typeof import("@/components/scheme-a/SchemeARoutePrimitives")>(), SchemeARouteHero: () => null,
}));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedServiceAreaBySlug: (slug: string, language: "en" | "zh") => ({
    data: {
      slug, name: slug, metaTitle: `${slug} fixture`, description: "Fixture description", intro: "Fixture intro",
      propertyTypes: [], commonNeeds: [], projects: [],
      faqs: state.empty ? [] : [1, 2, 3].map((number) => ({
        q: language === "zh" ? `${slug} 中文问题 ${number}` : `${slug} English question ${number}`,
        a: language === "zh" ? `${slug} 中文回答 ${number}` : `${slug} English answer ${number}`,
      })),
    },
    isPending: false, isInitialError: false,
  }),
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("External requests are forbidden in this fixture"); }));
  state.empty = false; container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

async function render(slug: string, language: "en" | "zh", Component = LocationPage) {
  state.language = language;
  await act(async () => root.render(
    <MemoryRouter initialEntries={[`/${language}/locations/${slug}`]}>
      <Routes><Route path="/:language/locations/:slug" element={<Component />} /></Routes>
    </MemoryRouter>,
  ));
}
const faqNodes = () => [...container.querySelectorAll('script[type="application/ld+json"]')]
  .map((script) => JSON.parse(script.textContent || "null") as { "@type": string; mainEntity?: Array<{ name: string; acceptedAnswer: { text: string } }> })
  .filter((node) => node["@type"] === "FAQPage");

describe("regional FAQ schema ownership", () => {
  for (const slug of ["kepong", "wangsa-maju"]) for (const language of ["en", "zh"] as const) {
    it(`renders one development FAQ schema from the displayed ${slug}/${language} questions and answers`, async () => {
      await render(slug, language);
      const nodes = faqNodes(); expect(nodes).toHaveLength(1); expect(nodes[0].mainEntity).toHaveLength(3);
      const questions = [...container.querySelectorAll(".fc-route-faq-question")].map((question) => question.textContent);
      const answers = [...container.querySelectorAll(".fc-route-faq-item > p")].map((answer) => answer.textContent);
      expect(nodes[0].mainEntity!.map((question) => question.name)).toEqual(questions);
      expect(nodes[0].mainEntity!.map((question) => question.acceptedAnswer.text)).toEqual(answers);
      expect(fetch).not.toHaveBeenCalled();
    });
  }
  it("omits FAQ schema when the displayed page has no questions", async () => {
    state.empty = true; await render("kepong", "en"); expect(faqNodes()).toHaveLength(0);
    expect(container.querySelector(".fc-route-faq")).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
  it("leaves the existing edge FAQ as the sole production declaration", async () => {
    vi.resetModules(); vi.stubEnv("DEV", false);
    const { default: ProductionLocationPage } = await import("./LocationPage");
    const edge = document.createElement("script");
    edge.type = "application/ld+json"; edge.dataset.flashcastEdgeSchema = "";
    edge.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": [
      { "@type": "FAQPage", "@id": "https://fixture.invalid/en/locations/kepong#faq", mainEntity: [] },
    ] });
    document.head.append(edge);
    try {
      await render("kepong", "en", ProductionLocationPage);
      expect(faqNodes()).toHaveLength(0);
      expect(document.querySelectorAll("script[data-flashcast-edge-schema]")).toHaveLength(1);
      const graph = JSON.parse(edge.textContent || "{}")["@graph"] as Array<{ "@type": string }>;
      expect(graph.filter((node) => node["@type"] === "FAQPage")).toHaveLength(1);
      expect(fetch).not.toHaveBeenCalled();
    } finally { edge.remove(); }
  });
});
