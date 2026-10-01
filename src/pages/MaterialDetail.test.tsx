import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MaterialCatalogCategory, MaterialCatalogItem } from "@/lib/materialCatalog";
import MaterialDetail from "@/pages/MaterialDetail";

const state = vi.hoisted(() => ({ language: "en" as "en" | "zh", category: null as MaterialCatalogCategory | null, pending: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock("@/hooks/usePublishedContent", () => ({ usePublishedMaterialBySlug: () => ({ data: state.category ? { category: state.category } : undefined, isPending: state.pending }) }));
vi.mock("@/lib/materialCatalog", () => ({ mergeMaterialCategoriesWithFallback: () => state.category ? [state.category] : [] }));
vi.mock("@/components/SmartImage", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/components/PageMeta", () => ({ default: ({ title, description }: { title: string; description: string }) => <div data-testid="meta" data-title={title} data-description={description} /> }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;
afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); state.pending = false; });
function fixture(body: string, excerpt = "Short excerpt") {
  const item: MaterialCatalogItem = { id: "fixture", slug: "fixture", name: "Fixture material", category: "Fixture category", subcategory: "countertop", type: "Stone", color: "Grey", texture: "Smooth", suitableSpaces: [], recommendedPairing: "", description: body, excerpt, note: "", image: "/images/materials/sintered-stone-grey.webp", pros: ["Preserved advantage"], cons: ["Preserved limitation"] };
  state.category = { name: "Fixture category", slug: "fixture-category", description: "Category summary", image: item.image, subcategories: [], items: [item] };
  return item;
}
async function render() {
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  await act(async () => root.render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[`/${state.language}/materials/fixture`]}><Routes><Route path="/:lang/materials/:slug" element={<MaterialDetail />} /></Routes></MemoryRouter>));
}

describe("Material detail CMS body rendering", () => {
  it.each(["en", "zh"] as const)("%s renders the body once with headings, lists, safe localized links and unchanged facts", async language => {
    state.language = language;
    const item = fixture(`<h2>Detailed answer</h2><p>Unique detailed paragraph</p><ul><li>Specification point</li></ul><a href="/${language}/quote">Quote</a><a href="https://evil.test">External</a><script>alert(1)</script>`);
    item.seoTitle = "Existing CMS title"; item.seoDescription = "Existing CMS meta";
    await render();
    expect(container.querySelector("h1")).toHaveTextContent(item.name);
    expect(container.querySelector('[data-testid="meta"]')).toHaveAttribute("data-title", item.seoTitle);
    expect(container.querySelector('[data-testid="meta"]')).toHaveAttribute("data-description", item.seoDescription);
    expect(container.querySelectorAll('.fc-route-service-overview-copy h2')).toHaveLength(1);
    expect(container.querySelector('.fc-route-service-overview-copy li')).toHaveTextContent("Specification point");
    expect(container.textContent?.match(/Unique detailed paragraph/g)).toHaveLength(1);
    expect(container.querySelector(`a[href="/${language}/quote"]`)).not.toBeNull();
    expect(container.querySelector('a[href="https://evil.test"]')).toBeNull();
    expect(container.textContent).not.toContain("alert(1)");
    expect(container).toHaveTextContent("Preserved advantage"); expect(container).toHaveTextContent("Preserved limitation");
  });
  it("keeps plain-text paragraph boundaries and never repeats long content in the hero or gallery", async () => {
    state.language = "en"; fixture("First detailed paragraph\n\nSecond detailed paragraph"); await render();
    expect(container.querySelectorAll('.fc-route-service-overview-copy p')).toHaveLength(2);
    expect(container.textContent?.match(/First detailed paragraph/g)).toHaveLength(1);
    expect(container.querySelector('[data-testid="meta"]')).toHaveAttribute("data-description", expect.stringContaining("Short excerpt"));
  });
  it("uses a related item's excerpt instead of displaying its HTML body as a card summary", async () => {
    state.language = "en"; const item = fixture("Own detailed content");
    state.category!.items.push({ ...item, id: "related", slug: "related", name: "Related material", excerpt: "Related short summary", description: "<h2>Related long body</h2><p>Details</p>" });
    await render();
    expect(container).toHaveTextContent("Related short summary");
    expect(container).not.toHaveTextContent("Related long body");
  });
  it("uses the existing category summary when excerpt is missing and keeps a short identical excerpt/body only once", async () => {
    state.language = "en"; fixture("Only detailed content", ""); await render();
    expect(container.querySelector('[data-testid="meta"]')).toHaveAttribute("data-description", expect.stringContaining("Category summary"));
    expect(container.textContent?.match(/Only detailed content/g)).toHaveLength(1);
    await act(async () => root.unmount()); root = undefined as unknown as Root; container.remove();
    fixture("Same short copy", "Same short copy"); await render();
    expect(container.textContent?.match(/Same short copy/g)).toHaveLength(1);
  });
});
