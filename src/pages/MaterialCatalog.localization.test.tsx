import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import MaterialCategoryPage from "./MaterialCategoryPage";
import MaterialSubcategoryPage from "./MaterialSubcategoryPage";
import { materialsData } from "@/data/materials";
import type { MaterialCatalogCategory } from "@/lib/materialCatalog";
import type { SchemeAListingItem } from "@/components/scheme-a/SchemeARoutePrimitives";

const state = vi.hoisted(() => ({ language: "zh" as "zh" | "en" | "ms", published: [] as MaterialCatalogCategory[] }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedMaterials: () => ({ data: state.published, isLoading: false }) }));
vi.mock("@/components/PageMeta", () => ({ default: ({ description }: { description: string }) => <div data-meta-description={description} /> }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", () => ({
  SchemeARouteHero: ({ title, description }: { title: string; description: string }) => <header><h1>{title}</h1><p>{description}</p></header>,
  SchemeASection: ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => <section><h2>{title}</h2><p>{description}</p>{children}</section>,
  SchemeAListingGrid: ({ items }: { items: SchemeAListingItem[] }) => <div>{items.map((item) => <article key={item.id}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>,
  SchemeAContentState: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  SchemeANumberList: () => null,
  SchemeALinkGrid: () => null,
}));

let root: Root | undefined;
let container: HTMLDivElement;
afterEach(() => { if (root) act(() => root!.unmount()); container?.remove(); state.published = []; vi.unstubAllGlobals(); });
async function render(subcategory: boolean) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  const categoryPath = `/${state.language}/materials/category/countertops-stone-surfaces`;
  await act(async () => root!.render(<MemoryRouter initialEntries={[categoryPath + (subcategory ? "/porcelain-slab" : "")]}> <Routes>
    <Route path="/:lang/materials/category/:categorySlug" element={<MaterialCategoryPage />} />
    <Route path="/:lang/materials/category/:categorySlug/:subcategorySlug" element={<MaterialSubcategoryPage />} />
  </Routes></MemoryRouter>));
}

describe("material taxonomy fallback rendering", () => {
  it.each(["zh", "en", "ms"] as const)("%s category cards and child page share a complete description", async (language) => {
    state.language = language;
    const expected = language === "zh" ? "轻薄的大规格瓷质板材，可用于台面、防溅挡板和墙面饰面。"
      : language === "ms" ? "Papak porselin nipis untuk kaunter tumpuan, pelindung percikan dan kemasan dinding."
        : "Thin, premium slabs for feature counters, splashbacks, and wall surfaces.";
    await render(false);
    expect(container.querySelectorAll("article")).toHaveLength(7);
    expect(container.textContent).toContain(expected);
    act(() => root!.unmount()); container.remove();
    await render(true);
    expect(container.querySelector("header p")).toHaveTextContent(expected);
    expect(container.querySelector("[data-meta-description]")?.getAttribute("data-meta-description")).toContain(expected);
    expect(container.textContent).not.toContain("表面材料s");
  });

  it("keeps published Chinese copy ahead of the static fallback without mutating it", async () => {
    state.language = "zh";
    const category = materialsData.find((item) => item.slug === "countertops-stone-surfaces")!;
    state.published = [{ ...category, description: "后台已审核的分类介绍。", subcategories: [{
      ...category.subcategories.find((item) => item.slug === "porcelain-slab")!, description: "后台已审核的大板瓷砖介绍。",
    }] }];
    const snapshot = JSON.stringify(state.published);
    await render(true);
    expect(container.querySelector("header p")).toHaveTextContent("后台已审核的大板瓷砖介绍。");
    expect(container.querySelector("[data-meta-description]")?.getAttribute("data-meta-description")).toContain("后台已审核的大板瓷砖介绍。");
    expect(JSON.stringify(state.published)).toBe(snapshot);
  });
});
