import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PublicDataPayload } from "@/lib/publicPreload";
import { furnitureCatalog, localizeFurnitureProduct } from "@/lib/furnitureCatalog";
import { publicContentQueries } from "@/lib/publicContentQueries";
import { furnitureText } from "@/i18n/furnitureText";
import FurnitureProductDetail from "./FurnitureProductDetail";

const seed = vi.hoisted(() => ({ payload: null as PublicDataPayload | null }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => seed.payload }));
vi.mock("@/lib/supabaseConfig", () => ({ isSupabaseConfigured: false }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ language: "zh" }) }));
vi.mock("@/hooks/useSiteSettings", () => ({ useSiteSettings: () => ({ whatsapp_url: () => "https://example.invalid" }) }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePageWhatsAppMessage: () => {} }));
vi.mock("@/components/SmartImage", () => ({ SmartImage: () => null }));
vi.mock("@/components/PageMeta", () => ({ default: () => null }));
vi.mock("@/components/JsonLd", () => ({ JsonLdBreadcrumb: () => null }));

let root: Root, node: HTMLDivElement, client: QueryClient;
const staticProduct = furnitureCatalog.products[0]!;
async function settle() { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); }
async function render(slug: string) {
  await act(async () => root.render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={[`/zh/furniture/product/${encodeURIComponent(slug)}`]}><Routes>
      <Route path="/:lang/furniture/product/:slug" element={<FurnitureProductDetail />} />
    </Routes></MemoryRouter>
  </QueryClientProvider>)); await settle();
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); seed.payload = null; onlineManager.setOnline(true);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  node = document.createElement("div"); document.body.append(node); root = createRoot(node);
});
afterEach(async () => {
  await act(async () => root.unmount()); client.clear(); node.remove(); onlineManager.setOnline(true); vi.unstubAllGlobals();
});

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
