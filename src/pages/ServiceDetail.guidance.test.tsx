import { createHash } from "node:crypto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ServiceDetail from "./ServiceDetail";
import { servicesData } from "@/data/services";
import { getServiceProjectGuidance, serviceDetailPageText } from "@/i18n/serviceDetailPageText";
import type { Language } from "@/i18n/routes";

const state = vi.hoisted(() => ({ language: "en" as Language, service: undefined as Record<string, unknown> | undefined }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({
  usePublishedServiceBySlug: () => ({ data: state.service, isLoading: false, isInitialError: false }),
  usePublishedServices: () => ({ data: state.service ? [state.service] : [] }),
}));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null, JsonLdFAQ: () => null, JsonLdService: () => null }));
vi.mock("@/components/blocks/CTABanner", () => ({ default: () => <aside>Existing CTA</aside> }));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/scheme-a/SchemeARoutePrimitives")>(),
  SchemeARouteHero: ({ title }: { title: string }) => <header><h1>{title}</h1></header>,
}));

let root: Root;
let node: HTMLDivElement;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const cases: readonly { slug: string; language: "en" | "zh"; units: readonly (readonly [string, string])[] }[] = [
  { slug: "shop-renovation", language: "zh", units: [["SH-ZH-STAGES", "ab01d918423c92c881f2f6361ea491fe8d26d7a7d4a6c572955d1b40f098e5ce"]] },
  { slug: "shop-renovation", language: "en", units: [["SH-EN-STAGES", "d1d8178b8830580f86222afffea8680b11329668b8f30bbfdd831cb64b519246"]] },
  { slug: "office-renovation", language: "zh", units: [["OF-ZH-STAGES", "57945e3f5bf06bbf50f2c3d69a618307975e5bfa9962a959f1b8b8cf96c024d3"]] },
  { slug: "office-renovation", language: "en", units: [["OF-EN-STAGES", "0d9ee2ce3b92f1271904fb850daef6902c1c3fbd891146d558bc79ab09f598d6"], ["OF-EN-OCCUPIED", "5c41032b82e86f8929f13eb0ceee9c67be5d3e323dab9ab5af36523674ee5458"]] },
];

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.unstubAllGlobals(); });

async function render(slug: string, language: Language) {
  state.language = language;
  const source = servicesData.find(service => service.slug === slug)!;
  state.service = {
    ...source,
    processSteps: [{ title: "Original process", desc: "Original process description" }],
    faqs: [{ q: "Original question?", a: "Original answer remains." }],
  };
  await act(async () => root.render(<MemoryRouter initialEntries={[`/${language}/services/${slug}`]}><Routes><Route path="/:lang/services/:slug" element={<ServiceDetail />} /></Routes></MemoryRouter>));
}

describe("original shop/office five-block delivery", () => {
  it.each(cases)("keeps approved bytes exactly once and in order at $language/$slug", async ({ slug, language, units }) => {
    await render(slug, language);
    const blocks = getServiceProjectGuidance(slug, language);
    expect(blocks.map(block => block.id)).toEqual(units.map(([id]) => id));
    const sections = Array.from(node.querySelectorAll("section.fc-route-section"));
    const rendered = Array.from(node.querySelectorAll("section.fc-service-project-guidance"));
    expect(rendered).toHaveLength(units.length);
    const process = sections.find(section => section.querySelector("h2")?.textContent === serviceDetailPageText[language].process)!;
    const resources = sections.find(section => section.querySelector("header > p")?.textContent === serviceDetailPageText[language].resourceDescription)!;
    expect(process).toHaveTextContent("Original process");
    expect(node).toHaveTextContent("Original answer remains.");
    rendered.forEach((section, index) => {
      expect(section.querySelector("h2")?.textContent).toBe(blocks[index].heading);
      expect(hash(section.querySelector("header > p")?.textContent || "")).toBe(units[index][1]);
      expect(Array.from(node.querySelectorAll("h2")).filter(h => h.textContent === blocks[index].heading)).toHaveLength(1);
      expect(sections.indexOf(section)).toBeGreaterThan(sections.indexOf(process));
      expect(sections.indexOf(section)).toBeLessThan(sections.indexOf(resources));
      if (index) expect(sections.indexOf(section)).toBeGreaterThan(sections.indexOf(rendered[index - 1]));
    });
    expect(resources.querySelector("a")).toBeTruthy();
  });

  it.each([["shop-renovation", "ms"], ["office-renovation", "ms"], ["kitchen", "en"]] as const)("adds nothing to %s/%s", async (slug, language) => {
    await render(slug, language);
    expect(getServiceProjectGuidance(slug, language)).toEqual([]);
    expect(node.querySelectorAll(".fc-service-project-guidance")).toHaveLength(0);
    expect(node).toHaveTextContent("Original answer remains.");
  });
});
