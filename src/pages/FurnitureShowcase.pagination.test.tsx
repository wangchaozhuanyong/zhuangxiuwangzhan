import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FurnitureShowcase from "./FurnitureShowcase";
import { furnitureCatalog, mapFurnitureCatalogSeed, type FurnitureProduct, type FurnitureMaterialRow } from "@/lib/furnitureCatalogPresentation";
import furnitureTaxonomyLabels from "@/i18n/furnitureTaxonomyLabels.json";

const source = vi.hoisted(() => ({ language: "en" as "en" | "zh", products: undefined as FurnitureProduct[] | undefined }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: source.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedFurnitureCatalog: () => ({ data: source.products, isLoading: source.products === undefined, isFetching: source.products === undefined, isInitialError: false, refetch: vi.fn() }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ company_name: "FLASH CAST", brand_name: "FLASH CAST" }) }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));
vi.mock("@/components/SmartImage", () => ({ SmartImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/scheme-a/SchemeARoutePrimitives", () => ({
  SchemeARouteHero: ({ title }: { title: string }) => <h1>{title}</h1>,
  SchemeAContentState: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

async function renderPage(path: string, language: "en" | "zh", products: FurnitureProduct[] | null = mapFurnitureCatalogSeed([], null, language)) {
  source.language = language; source.products = products ?? undefined;
  await act(async () => root.render(<HelmetProvider><MemoryRouter key={`${language}:${path}`} initialEntries={[path]}><Routes>
    <Route path="/:lang/furniture" element={<FurnitureShowcase />} />
    <Route path="/:lang/furniture/:category" element={<FurnitureShowcase />} />
    <Route path="/:lang/furniture/:category/:subcategory" element={<FurnitureShowcase />} />
  </Routes></MemoryRouter></HelmetProvider>));
}

const cardHrefs = () => [...container.querySelectorAll('.fc-furniture-card__main')].map(a => a.getAttribute("href"));
async function expectCanonical(path: string) {
  const expected = `https://flashcast.com.my${path}`;
  for (let attempt = 0; attempt < 20; attempt++) {
    if (document.querySelector('link[rel="canonical"]')?.getAttribute("href") === expected) break;
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  }
  expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(expected);
}

async function expectDescription(expected: string, noIndex = false) {
  const matches = () => document.querySelector('meta[name="description"]')?.getAttribute("content") === expected
    && document.querySelector('meta[property="og:description"]')?.getAttribute("content") === expected
    && Boolean(document.querySelector('meta[name="robots"]')?.getAttribute("content")?.includes("noindex")) === noIndex;
  for (let attempt = 0; attempt < 20 && !matches(); attempt++) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  }
  expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(expected);
  expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe(expected);
  expect(Boolean(document.querySelector('meta[name="robots"]')?.getAttribute("content")?.includes("noindex"))).toBe(noIndex);
}

describe("furniture displayed pagination metadata", () => {
  it.each(["en", "zh"] as const)("keeps generated %s category and subcategory descriptions before and after published data resolves", async (language) => {
    const cases = [
      ["bedroom/bed-frame", furnitureTaxonomyLabels.subcategories["bed-frame"][language]],
      ["bedroom/bedside-table", furnitureTaxonomyLabels.subcategories["bedside-table"][language]],
      ["dining", furnitureTaxonomyLabels.categories.dining[language]],
      ["living", furnitureTaxonomyLabels.categories.living[language]],
      ["study", furnitureTaxonomyLabels.categories.study[language]],
      ["preorder", furnitureTaxonomyLabels.categories.preorder[language]],
    ];
    for (const [path, label] of cases) {
      const expected = `${label} · ${furnitureTaxonomyLabels.meta[language].description}`;
      await renderPage(`/${language}/furniture/${path}`, language, null);
      await expectDescription(expected);
      expect(container.querySelector('main')?.getAttribute("data-route-pending")).toBe("true");
      await renderPage(`/${language}/furniture/${path}`, language);
      await expectDescription(expected);
      expect(container.querySelector('main')?.hasAttribute("data-route-pending")).toBe(false);
    }
  });

  it.each(["en", "zh"] as const)("preserves %s homepage, dedicated bedroom and invalid-route description policies", async (language) => {
    const generic = furnitureTaxonomyLabels.meta[language].description;
    const cases = [
      { path: "", description: generic, noIndex: false },
      { path: "/new", description: generic, noIndex: false },
      { path: "/bedroom", description: furnitureTaxonomyLabels.categoryPages.bedroom[language].description, noIndex: false },
      { path: "/missing-category", description: generic, noIndex: true },
      { path: "/bedroom/missing-subcategory", description: generic, noIndex: true },
    ];
    for (const item of cases) {
      await renderPage(`/${language}/furniture${item.path}`, language);
      await expectDescription(item.description, item.noIndex);
    }
  });

  it.each(["en", "zh"] as const)("keeps real %s product/adjacent links and same-page canonical/hreflang for 1/3/9/14", async (language) => {
    for (const page of [1, 3, 9, 14]) {
      const search = page === 1 ? "" : `?page=${page}`;
      await renderPage(`/${language}/furniture${search}`, language);
      await expectCanonical(`/${language}/furniture${search}`);
      expect(cardHrefs()).toEqual(furnitureCatalog.products.slice((page - 1) * 18, page * 18).map(p => `/${language}/furniture/product/${encodeURIComponent(decodeURIComponent(p.slug))}`));
      for (const [locale, prefix] of [["en", "en"], ["zh-CN", "zh"], ["x-default", "en"]]) {
        expect(document.querySelector(`link[hreflang="${locale}"]`)?.getAttribute("href")).toBe(`https://flashcast.com.my/${prefix}/furniture${search}`);
      }
      const adjacent = [...container.querySelectorAll('.fc-furniture-pagination a')].map(a => a.getAttribute("href"));
      if (page > 1) expect(adjacent).toContain(`/${language}/furniture?page=${page - 1}`);
      expect(adjacent).toContain(`/${language}/furniture?page=${page + 1}`);
    }
  });

  it.each(["en", "zh"] as const)("clamps %s category pages after current published visibility and membership changes", async (language) => {
    const row = { slug: "fixture-published-chair", title_en: "Published chair", title_zh: "已发布椅子", subcategory: "bedroom", material_type: "bed-frame" } as FurnitureMaterialRow;
    const overrides = furnitureCatalog.products.map(p => ({ slug: p.slug, enabled: false, name_en: p.name, name_zh: p.name, shortDescription_en: p.shortDescription, shortDescription_zh: p.shortDescription, description_en: p.description, description_zh: p.description, price: p.price || "", images: p.images }));
    const products = mapFurnitureCatalogSeed([row], { items_zh: overrides }, language);
    await renderPage(`/${language}/furniture/bedroom/bed-frame?page=999`, language, products);
    await expectCanonical(`/${language}/furniture/bedroom/bed-frame`);
    expect(cardHrefs()).toEqual([`/${language}/furniture/product/fixture-published-chair`]);
    expect(container.querySelector('.fc-furniture-pagination')).toBeNull();
  });

  it("normalizes malformed numbers without carrying tracking parameters into canonical URLs", async () => {
    await renderPage("/en/furniture?page=1.5&utm_source=fixture", "en");
    await expectCanonical("/en/furniture");
    expect(cardHrefs()).toEqual(furnitureCatalog.products.slice(0, 18).map(p => `/en/furniture/product/${encodeURIComponent(decodeURIComponent(p.slug))}`));
    await renderPage("/en/furniture?page=03&utm_source=fixture", "en");
    await expectCanonical("/en/furniture?page=3");
  });

  it("keeps an unresolved catalog page identity until published data can determine its bounds", async () => {
    await renderPage("/en/furniture?page=9", "en", null);
    await expectCanonical("/en/furniture?page=9");
    expect(cardHrefs()).toEqual([]);
    await renderPage("/en/furniture?page=9", "en");
    await expectCanonical("/en/furniture?page=9");
    expect(cardHrefs()).toHaveLength(18);
  });
});
