import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SchemeAHomeFurniture from "@/components/scheme-a/SchemeAHomeFurniture";
import { getFurnitureProduct, localizeFurnitureProduct, type FurnitureProduct } from "@/lib/furnitureCatalog";
import { applyFurnitureCatalogOverrides, type FurnitureCatalogOverride } from "@/lib/furnitureCatalogOverrides";
import { selectHomeFurniture } from "@/lib/homeFurniture";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

const state = vi.hoisted(() => ({
  language: "en" as "zh" | "en",
  data: [] as FurnitureProduct[],
  isLoading: false,
  isFetching: false,
  isInitialError: false,
  refetch: vi.fn(),
}));

vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedHomeFurniture: () => ({ ...state, data: selectHomeFurniture(state.data, state.language) }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));

const preferredSlugs = [
  "lc-40108-1-seater-pu-lounge-chair-cream",
  "danu-6-seater-sintered-stone-dining-set-cream",
  "a05-smart-charging-bedside-table-white",
  "std-2501-compact-study-desk",
];

const product = (slug: string): FurnitureProduct => ({
  slug, name: `Managed ${slug}`, shortDescription: "", description: "", sku: "", sourceUrl: `admin-material:${slug}`,
  sourceImages: [], images: [`/images/${slug}.webp`], sourceCategories: [], price: null, managedCategoryKey: "living", localized: true,
});

describe("homepage furniture published selection", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = () => act(() => root.render(<MemoryRouter><SchemeAHomeFurniture /></MemoryRouter>));
  const productLinks = () => Array.from(container.querySelectorAll<HTMLAnchorElement>(".home-furniture__product-link"));

  beforeEach(() => {
    state.language = "en";
    state.data = [];
    state.isLoading = false;
    state.isFetching = false;
    state.isInitialError = false;
    state.refetch.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("prioritizes available preferred products and fills four unique cards with published images", () => {
    const noImage = { ...product("no-image"), images: [] };
    state.data = [product("fallback-one"), noImage, product(preferredSlugs[1]), product("fallback-two"), product(preferredSlugs[0]), product("fallback-one"), product("extra")];
    render();
    expect(productLinks().map((link) => link.getAttribute("href"))).toEqual([
      `/en/furniture/product/${preferredSlugs[0]}`,
      `/en/furniture/product/${preferredSlugs[1]}`,
      "/en/furniture/product/fallback-one",
      "/en/furniture/product/fallback-two",
    ]);
    expect(container.querySelectorAll(".home-furniture__product-image img")).toHaveLength(4);
  });

  it("respects catalog hiding and saved content instead of restoring preferred static products", () => {
    const baseline = preferredSlugs.map((slug) => localizeFurnitureProduct(getFurnitureProduct(slug)!, "en"));
    const override = (slug: string, enabled: boolean): FurnitureCatalogOverride => ({
      slug, enabled, name_zh: "已发布家具", name_en: "Published furniture", shortDescription_zh: "", shortDescription_en: "",
      description_zh: "", description_en: "", price: "", images: ["/images/approved-furniture.webp"],
    });
    state.data = applyFurnitureCatalogOverrides(baseline, [override(preferredSlugs[0], false), override(preferredSlugs[1], true)], "en");
    render();
    expect(productLinks()).toHaveLength(3);
    expect(productLinks().some((link) => link.getAttribute("href")?.endsWith(preferredSlugs[0]))).toBe(false);
    expect(productLinks()[0]).toHaveTextContent("Published furniture");
    expect(productLinks()[0].querySelector("img")).toHaveAttribute("src", "/images/approved-furniture.webp");
  });

  it.each(["zh", "en"] as const)("keeps %s product and catalog routes localized with a separate safe shop link", (language) => {
    state.language = language;
    state.data = [product("accent%20chair")];
    render();
    expect(productLinks()[0]).toHaveAttribute("href", `/${language}/furniture/product/accent%20chair`);
    expect(container.querySelector(`a[href="/${language}/furniture"]`)).not.toBeNull();
    const shop = container.querySelector(`a[href="${furnitureShopUrl}"]`);
    expect(shop).toHaveAttribute("target", "_blank");
    expect(shop).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelectorAll("a[target='_blank']")).toHaveLength(1);
  });

  it("does not show preferred products on an empty result or initial error and keeps browsing paths available", () => {
    render();
    expect(productLinks()).toHaveLength(0);
    expect(container).toHaveTextContent("Our furniture selection is being updated.");
    state.isInitialError = true;
    render();
    expect(productLinks()).toHaveLength(0);
    expect(container).toHaveTextContent("Furniture could not be loaded.");
    act(() => container.querySelector<HTMLButtonElement>("[data-public-results] button")!.click());
    expect(state.refetch).toHaveBeenCalledOnce();
    expect(container.querySelector('a[href="/en/furniture"]')).not.toBeNull();
  });
});
