import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicDataPayload } from "./publicPreload";
import { furnitureCatalog, getPublishedFurnitureCatalog, getPublishedFurnitureProductBySlug, type FurnitureMaterialRow, type FurnitureProduct } from "./furnitureCatalog";
import { normalizeFurnitureSlug } from "./furnitureCatalogOverrides";
import { getFurnitureQuerySeed } from "./furnitureQuerySeed";
import { publicContentQueries } from "./publicContentQueries";
import { getPublicQuerySeed } from "./publicQuerySeed";
import { claimPublicQuerySeed, documentSeedTime } from "./publicQuerySeedCache";
import { prefetchPublishedRouteContent } from "./publicRoutePrefetch";
import { fetchPublishedMaterialRowsByCategory, fetchPublishedHomeSectionRow } from "@/backend/modules/cms/repository/publicContentRepository";

const fixture = vi.hoisted(() => ({ payload: null as PublicDataPayload | null }));
vi.mock("./publicPreload", () => ({ readPreloadedPublicData: () => fixture.payload }));
vi.mock("@/backend/modules/cms/repository/publicContentRepository", () => ({
  fetchPublishedMaterialRowsByCategory: vi.fn(),
  fetchPublishedMaterialBySlugAndCategory: vi.fn(),
  fetchPublishedHomeSectionRow: vi.fn(),
}));

const baseline = furnitureCatalog.products[0]!;
const override = {
  slug: baseline.slug, enabled: true, name_en: "Saved chair", name_zh: "已保存椅子",
  shortDescription_en: "Saved summary", shortDescription_zh: "已保存简介",
  description_en: "Saved full description", description_zh: "已保存完整详情",
  price: "RM 199", images: ["/saved.webp"],
};
const managed = {
  id: "managed", slug: "fixture-managed", title_en: "Managed chair", title_zh: "后台椅子",
  category: "furniture", subcategory: "dining", content_en: "Managed full description", content_zh: "后台完整详情",
  image_url: "/managed.webp", price_mode: "none",
} as FurnitureMaterialRow;

beforeEach(() => {
  fixture.payload = null;
  vi.mocked(fetchPublishedMaterialRowsByCategory).mockReset().mockResolvedValue([]);
  vi.mocked(fetchPublishedHomeSectionRow).mockReset().mockResolvedValue(null);
});

describe("route-specific furniture HTML seeds", () => {
  it.each(["en", "zh"] as const)("matches all 158 non-ASCII %s details to the ordinary published reader", async (language) => {
    const products = furnitureCatalog.products.filter((product) => Array.from(decodeURIComponent(product.slug)).some((character) => character.charCodeAt(0) > 127));
    expect(products).toHaveLength(158);
    for (const product of products) {
      const decoded = decodeURIComponent(product.slug);
      fixture.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: decoded } };
      const seed = getFurnitureQuerySeed(publicContentQueries.furnitureProduct(decoded, language).queryKey) as FurnitureProduct;
      expect(seed).toEqual(await getPublishedFurnitureProductBySlug(decoded, language));
      expect(seed.slug).toBe(product.slug);
      expect(seed.sourceUrl).toBe(product.sourceUrl);
    }
  });

  it.each(["云团沙发", "1803齐边床", "331-wooden-garment-rack"])("keeps URL and decoded representations of %s on the same product", async (decoded) => {
    const encoded = encodeURIComponent(decoded);
    const variants = [...new Set([decoded, encoded, encoded.replace(/%[0-9A-F]{2}/g, (value) => value.toLowerCase()),
      encoded.replace(/%[0-9A-F]{2}/g, (value, index) => index % 2 ? value.toLowerCase() : value)])];
    for (const language of ["en", "zh"] as const) {
      const expected = await getPublishedFurnitureProductBySlug(decoded, language);
      expect(expected).not.toBeNull();
      for (const marker of variants) for (const query of variants) {
        fixture.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: marker } };
        expect(getFurnitureQuerySeed(publicContentQueries.furnitureProduct(query, language).queryKey)).toEqual(expected);
      }
    }
  });

  it.each(["en", "zh"] as const)("does not revive a hidden non-ASCII %s product through a managed slug alias", async (language) => {
    const decoded = "云团沙发";
    const product = furnitureCatalog.products.find((item) => decodeURIComponent(item.slug) === decoded)!;
    const hidden = { ...override, slug: product.slug, enabled: false };
    const rows = [{ ...managed, slug: encodeURIComponent(decoded) }];
    const setting = { items_zh: [hidden] };
    fixture.payload = { furnitureCatalog: { materials: rows, setting, detailSlug: decoded } };
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue(rows);
    vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue(setting as never);
    expect(getFurnitureQuerySeed(publicContentQueries.furnitureProduct(decoded, language).queryKey)).toBeNull();
    expect(await getPublishedFurnitureProductBySlug(decoded, language)).toBeNull();
    delete fixture.payload.furnitureCatalog!.detailSlug;
    const listing = getFurnitureQuerySeed(publicContentQueries.furnitureCatalog(language).queryKey) as FurnitureProduct[];
    expect(listing.some((item) => decodeURIComponent(item.slug) === decoded)).toBe(false);
    expect(await getPublishedFurnitureCatalog(language)).toEqual(listing);
  });

  it("rejects malformed, double-encoded or mismatched detail projections without fabricating null", () => {
    fixture.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: "云团沙发" } };
    expect(getFurnitureQuerySeed(["published", "furniture_catalog", "detail", 123, "en"])).toBeUndefined();
    for (const invalid of ["%", "%ZZ", "%E0%A4%A"]) {
      fixture.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: invalid } };
      expect(normalizeFurnitureSlug(invalid)).toBeUndefined();
      expect(getFurnitureQuerySeed(publicContentQueries.furnitureProduct(invalid, "en").queryKey)).toBeUndefined();
      expect(getFurnitureQuerySeed(publicContentQueries.furnitureCatalog("en").queryKey)).toBeUndefined();
    }
    fixture.payload = { furnitureCatalog: { materials: [], setting: null, detailSlug: encodeURIComponent(encodeURIComponent("云团沙发")) } };
    expect(getFurnitureQuerySeed(publicContentQueries.furnitureProduct("云团沙发", "en").queryKey)).toBeUndefined();
    fixture.payload.furnitureCatalog!.detailSlug = "1803齐边床";
    expect(getFurnitureQuerySeed(publicContentQueries.furnitureProduct("云团沙发", "zh").queryKey)).toBeUndefined();
    expect(normalizeFurnitureSlug("SKU-A")).not.toBe(normalizeFurnitureSlug("sku-a"));
  });

  it.each(["en", "zh"] as const)("retains the %s live reader's managed order, duplicate exclusion, edits and hidden products", async (language) => {
    const hidden = { ...override, slug: furnitureCatalog.products[1]!.slug, enabled: false };
    const rows = [managed, { ...managed, slug: baseline.slug }];
    const setting = { items_zh: [override, hidden] };
    fixture.payload = { furnitureCatalog: { materials: rows, setting } };
    vi.mocked(fetchPublishedMaterialRowsByCategory).mockResolvedValue(rows);
    vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue(setting as never);
    const seed = getFurnitureQuerySeed(publicContentQueries.furnitureCatalog(language).queryKey) as FurnitureProduct[];
    expect(seed).toEqual(await getPublishedFurnitureCatalog(language));
    expect(seed[0]?.slug).toBe(managed.slug);
    expect(seed.filter((product) => product.slug === baseline.slug)).toHaveLength(1);
    expect(seed.some((product) => product.slug === hidden.slug)).toBe(false);
    expect(seed.find((product) => product.slug === baseline.slug)).toMatchObject({
      name: override[`name_${language}`], description: override[`description_${language}`], price: "RM 199", images: ["/saved.webp"],
    });
  });

  it("seeds only the matching complete detail and preserves a confirmed hidden result as null", () => {
    const listKey = publicContentQueries.furnitureCatalog("zh").queryKey;
    const detailKey = publicContentQueries.furnitureProduct(baseline.slug, "zh").queryKey;
    fixture.payload = { furnitureCatalog: { materials: [], setting: { items_zh: [override] } } };
    expect(getFurnitureQuerySeed(detailKey)).toBeUndefined();
    fixture.payload.furnitureCatalog!.detailSlug = baseline.slug;
    expect(getFurnitureQuerySeed(listKey)).toBeUndefined();
    expect(getFurnitureQuerySeed(publicContentQueries.furnitureProduct("different-slug", "zh").queryKey)).toBeUndefined();
    expect(getFurnitureQuerySeed(detailKey)).toMatchObject({ description: override.description_zh, images: override.images });
    fixture.payload.furnitureCatalog!.setting = { items_zh: [{ ...override, enabled: false }] };
    expect(getFurnitureQuerySeed(detailKey)).toBeNull();
    expect(getPublicQuerySeed(detailKey)).toBeUndefined();
  });

  it("consumes per client and language once without reviving the old HTML after cache clear", async () => {
    fixture.payload = { furnitureCatalog: { materials: [], setting: { items_zh: [override] } } };
    const firstClient = new QueryClient();
    for (const language of ["en", "zh"] as const) {
      const key = publicContentQueries.furnitureCatalog(language).queryKey;
      expect(claimPublicQuerySeed(firstClient, key)).toEqual(expect.arrayContaining([expect.objectContaining({ name: override[`name_${language}`] })]));
      expect(claimPublicQuerySeed(firstClient, key)).toBeUndefined();
    }
    firstClient.clear();
    const key = publicContentQueries.furnitureCatalog("en").queryKey;
    expect(claimPublicQuerySeed(firstClient, key)).toBeUndefined();
    const nextClient = new QueryClient();
    expect(claimPublicQuerySeed(nextClient, key)).toBeDefined();
    nextClient.clear();
  });

  it("keeps document time for first prefetch and reads the actual changed source after invalidation/removal", async () => {
    fixture.payload = { furnitureCatalog: { materials: [], setting: { items_zh: [override] } } };
    const client = new QueryClient();
    const key = publicContentQueries.furnitureCatalog("en").queryKey;
    await prefetchPublishedRouteContent(client, "/en/furniture", "en");
    expect(client.getQueryState(key)?.dataUpdatedAt).toBe(documentSeedTime);
    expect(fetchPublishedHomeSectionRow).not.toHaveBeenCalled();
    vi.mocked(fetchPublishedHomeSectionRow).mockResolvedValue({ items_zh: [{ ...override, name_en: "Fresh source" }] } as never);
    await client.invalidateQueries({ queryKey: key, refetchType: "none" });
    await prefetchPublishedRouteContent(client, "/en/furniture", "en");
    expect((client.getQueryData(key) as FurnitureProduct[]).find((product) => product.slug === baseline.slug)?.name).toBe("Fresh source");
    client.removeQueries({ queryKey: key });
    await prefetchPublishedRouteContent(client, "/en/furniture", "en");
    expect(fetchPublishedHomeSectionRow).toHaveBeenCalledTimes(2);
    expect((client.getQueryData(key) as FurnitureProduct[]).find((product) => product.slug === baseline.slug)?.name).toBe("Fresh source");
    client.clear();
  });
});
