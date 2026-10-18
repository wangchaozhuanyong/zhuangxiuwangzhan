import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PublicDataPayload } from "@/lib/publicPreload";
import { furnitureCatalog, localizeFurnitureProduct } from "@/lib/furnitureCatalog";
import * as publicRepository from "@/backend/modules/cms/repository/publicContentRepository";
import { publicContentQueries } from "@/lib/publicContentQueries";
import { furnitureText } from "@/i18n/furnitureText";
import FurnitureProductDetail from "./FurnitureProductDetail";

const seed = vi.hoisted(() => ({ payload: null as PublicDataPayload | null, language: "zh" as "en" | "zh", pageMeta: vi.fn() }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => seed.payload }));
vi.mock("@/lib/supabaseConfig", () => ({ isSupabaseConfigured: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: seed.language }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://example.invalid" }) }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePageWhatsAppMessage: () => {} }));
vi.mock("@/components/SmartImage", () => ({ SmartImage: () => null }));
// Capture the component's declaration only; this is not a browser head/Helmet assertion.
vi.mock("@/components/PageMeta", () => ({ default: (props: unknown) => { seed.pageMeta(props); return null; } }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));

let root: Root, node: HTMLDivElement, client: QueryClient;
const staticProduct = furnitureCatalog.products[0]!;
async function settle() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function render(slug: string) {
  await act(async () => root.render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[`/${seed.language}/furniture/product/${encodeURIComponent(slug)}`]}><Routes>
      <Route path="/:lang/furniture/product/:slug" element={<FurnitureProductDetail />} />
    </Routes></MemoryRouter>
  </QueryClientProvider>)); await settle();
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); seed.payload = null; seed.language = "zh"; seed.pageMeta.mockClear(); onlineManager.setOnline(true);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount()); client.clear(); node.remove(); onlineManager.setOnline(true); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

const nonAsciiProducts = ["云团沙发", "1803齐边床"].map((slug) => {
  const product = furnitureCatalog.products.find((item) => decodeURIComponent(item.slug) === slug);
  if (!product) throw new Error(`Missing actual furniture fixture: ${slug}`);
  return product;
});
const localizedCases = nonAsciiProducts.flatMap((product) => (["en", "zh"] as const).map((language) => ({ product, language })));
const readSpies = () => [
  vi.spyOn(publicRepository, "fetchPublishedHomeSectionRow"),
  vi.spyOn(publicRepository, "fetchPublishedMaterialBySlugAndCategory"),
  vi.spyOn(publicRepository, "fetchPublishedMaterialRowsByCategory"),
];

it("shows waiting instead of not-found for an uncached offline managed slug, then confirms the actual no-SDK result", async () => {
  onlineManager.setOnline(false); const slug = "isolated-managed-offline"; await render(slug);
  expect(client.getQueryState(publicContentQueries.furnitureProduct(slug, "zh").queryKey)?.fetchStatus).toBe("paused");
  expect(node.querySelector('[data-route-pending="true"]')).not.toBeNull();
  expect(node.querySelector('[role="status"]')).toHaveTextContent(furnitureText.zh.loadingManagedProducts);
  expect(node.textContent).not.toContain(furnitureText.zh.notFound);
  await act(async () => onlineManager.setOnline(true)); await settle();
  expect(node.querySelector("h1")).toHaveTextContent(furnitureText.zh.notFound);
  expect(client.getQueryState(publicContentQueries.furnitureProduct(slug, "zh").queryKey)?.status).toBe("success");
});

it("keeps the real static-catalog fallback working without the Supabase SDK", async () => {
  await render(staticProduct.slug); await settle();
  expect(node.querySelector("h1")).toHaveTextContent(localizeFurnitureProduct(staticProduct, "zh").name);
  expect(node.querySelector('[data-route-pending="true"]')).toBeNull();
  expect(client.getQueryState(publicContentQueries.furnitureProduct(staticProduct.slug, "zh").queryKey)?.status).toBe("success");
});

it("keeps cached static content visible during a paused background refresh", async () => {
  const key = publicContentQueries.furnitureProduct(staticProduct.slug, "zh").queryKey;
  client.setQueryData(key, localizeFurnitureProduct(staticProduct, "zh"), { updatedAt: 1 });
  onlineManager.setOnline(false); await render(staticProduct.slug);
  expect(client.getQueryState(key)?.fetchStatus).toBe("paused");
  expect(node.querySelector("h1")).toHaveTextContent(localizeFurnitureProduct(staticProduct, "zh").name);
  expect(node.querySelector('[data-route-pending="true"]')).toBeNull();
});

it("retains an actual HTML furniture seed when the offline refresh is paused", async () => {
  seed.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: staticProduct.slug } };
  onlineManager.setOnline(false); await render(staticProduct.slug);
  const key = publicContentQueries.furnitureProduct(staticProduct.slug, "zh").queryKey;
  await act(async () => { void client.invalidateQueries({ queryKey: key }); }); await settle();
  expect(client.getQueryState(key)?.fetchStatus).toBe("paused");
  expect(node.querySelector("h1")).toHaveTextContent(localizeFurnitureProduct(staticProduct, "zh").name);
  expect(node.querySelector('[data-route-pending="true"]')).toBeNull();
});

it.each(localizedCases.flatMap((value) => (["decoded", "encoded"] as const).map((representation) => ({ ...value, representation }))))(
  "renders $language $product.slug from a fresh $representation detail seed without repository or network reads",
  async ({ product, language, representation }) => {
    seed.language = language;
    const slug = decodeURIComponent(product.slug);
    const expected = localizeFurnitureProduct(product, language);
    seed.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: representation === "decoded" ? slug : product.slug } };
    const reads = readSpies();
    const fetch = vi.fn(() => Promise.reject(new Error("A fresh detail seed must not fetch")));
    vi.stubGlobal("fetch", fetch);
    await render(slug);
    expect(node.querySelector("h1")).toHaveTextContent(expected.name);
    expect(node.querySelector("a.is-shop")?.getAttribute("href")).toBe(`https://shop.flashcast.com.my/${language}/`);
    expect(node.textContent).not.toContain(furnitureText[language].notFound);
    expect(node.querySelector('[data-route-pending="true"]')).toBeNull();
    expect(client.getQueryState(publicContentQueries.furnitureProduct(encodeURIComponent(slug), language).queryKey)?.status).toBe("success");
    expect(seed.pageMeta).toHaveBeenLastCalledWith(expect.objectContaining({
      title: expected.name,
      description: expect.stringContaining(expected.name),
      canonicalPath: `/furniture/product/${encodeURIComponent(slug)}`,
    }));
    expect(seed.pageMeta.mock.lastCall?.[0]?.noIndex).not.toBe(true);
    for (const read of reads) expect(read).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  },
);

it.each(localizedCases)("keeps $language $product.slug visible from an offline decoded seed during a paused refresh", async ({ product, language }) => {
  seed.language = language;
  const slug = decodeURIComponent(product.slug);
  const reads = readSpies();
  seed.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: slug } };
  onlineManager.setOnline(false);
  await render(slug);
  const key = publicContentQueries.furnitureProduct(encodeURIComponent(slug), language).queryKey;
  await act(async () => { void client.invalidateQueries({ queryKey: key }); }); await settle();
  expect(client.getQueryState(key)?.fetchStatus).toBe("paused");
  expect(node.querySelector("h1")).toHaveTextContent(localizeFurnitureProduct(product, language).name);
  expect(node.querySelector('[data-route-pending="true"]')).toBeNull();
  expect(seed.pageMeta.mock.lastCall?.[0]?.noIndex).not.toBe(true);
  for (const read of reads) expect(read).not.toHaveBeenCalled();
});

it.each(localizedCases)("does not revive explicitly disabled non-ASCII $language $product.slug from a null seed", async ({ product, language }) => {
  seed.language = language;
  const slug = decodeURIComponent(product.slug);
  const reads = readSpies();
  const zh = localizeFurnitureProduct(product, "zh");
  const en = localizeFurnitureProduct(product, "en");
  seed.payload = { furnitureCatalog: { materials: [], detailSlug: slug, setting: { items_zh: [{
    slug: encodeURIComponent(slug), enabled: false,
    name_zh: zh.name, name_en: en.name, shortDescription_zh: zh.shortDescription, shortDescription_en: en.shortDescription,
    description_zh: zh.description, description_en: en.description, price: product.price || "", images: product.images,
  }] } } };
  onlineManager.setOnline(false);
  await render(slug);
  const key = publicContentQueries.furnitureProduct(encodeURIComponent(slug), language).queryKey;
  expect(client.getQueryData(key)).toBeNull();
  expect(client.getQueryState(key)?.status).toBe("success");
  expect(node.querySelector("h1")).toHaveTextContent(furnitureText[language].notFound);
  expect(node.querySelector('[data-route-pending="true"]')).toBeNull();
  expect(seed.pageMeta).toHaveBeenLastCalledWith(expect.objectContaining({ title: furnitureText[language].notFound, noIndex: true }));
  for (const read of reads) expect(read).not.toHaveBeenCalled();
});

it.each(["en", "zh"] as const)("does not resolve a double-encoded %s path to the ordinary Cloud Sofa identity", async (language) => {
  seed.language = language;
  const product = nonAsciiProducts.find((item) => decodeURIComponent(item.slug) === "云团沙发")!;
  const slug = decodeURIComponent(product.slug);
  const onceEncoded = encodeURIComponent(slug);
  const doubleEncoded = encodeURIComponent(onceEncoded);
  seed.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: slug } };
  await render(onceEncoded);
  await settle();
  const key = publicContentQueries.furnitureProduct(doubleEncoded, language).queryKey;
  expect(client.getQueryState(key)?.status).toBe("success");
  expect(client.getQueryData(key)).toBeNull();
  expect(node.querySelector("h1")).toHaveTextContent(furnitureText[language].notFound);
  expect(node.textContent).not.toContain(localizeFurnitureProduct(product, language).name);
  expect(seed.pageMeta).toHaveBeenLastCalledWith(expect.objectContaining({ title: furnitureText[language].notFound, noIndex: true }));
});
