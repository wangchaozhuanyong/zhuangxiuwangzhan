import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicDataPayload } from "./publicPreload";

const fixture = vi.hoisted(() => ({
  payload: null as PublicDataPayload | null,
  readerLoads: 0,
  mapperLoads: 0,
  read: vi.fn(async (_language: string, _signal?: AbortSignal) => []),
}));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => fixture.payload }));
beforeEach(() => {
  vi.resetModules();
  fixture.payload = null;
  fixture.readerLoads = 0;
  fixture.mapperLoads = 0;
  fixture.read.mockClear();
  vi.doMock("@/lib/furnitureCatalog", () => {
    fixture.readerLoads++;
    return {
      getPublishedHomeFurniture: fixture.read,
      getPublishedFurnitureCatalog: fixture.read,
      getPublishedFurnitureProductBySlug: fixture.read,
      getPublishedManagedFurnitureProductBySlug: fixture.read,
      getPublishedManagedFurnitureProducts: fixture.read,
      mapFurnitureCatalogSeed: () => [],
    };
  });
  vi.doMock("@/lib/furnitureCatalogPresentation", () => {
    fixture.mapperLoads++;
    return { mapFurnitureCatalogSeed: () => [] };
  });
});
afterEach(() => {
  vi.doUnmock("@/lib/furnitureCatalog");
  vi.doUnmock("@/lib/furnitureCatalogPresentation");
  vi.resetModules();
});

describe("furniture loading boundary", () => {
  it("imports ordinary public query, seed, hook and prefetch modules without loading the catalog", async () => {
    const { publicContentQueries } = await import("./publicContentQueries");
    await import("./publicQuerySeed");
    const { getPublicRoutePrefetchTasks } = await import("./publicRoutePrefetch");
    await import("@/hooks/usePublishedContent");
    expect(getPublicRoutePrefetchTasks("/zh/services", "zh").map((task) => task.queryKey)).toContainEqual(publicContentQueries.services("zh").queryKey);
    expect(getPublicRoutePrefetchTasks("/en/projects", "en").map((task) => task.queryKey)).toContainEqual(publicContentQueries.projectSummaries("en").queryKey);
    // Constructing a speculative furniture descriptor also must not download it.
    publicContentQueries.furnitureCatalog("zh");
    expect(fixture.readerLoads).toBe(0);
    expect(fixture.mapperLoads).toBe(0);
  });

  it("seeds the four home cards in both languages without loading the full catalog", async () => {
    fixture.payload = { homeFurniture: {
      en: Array.from({ length: 4 }, (_, index) => ({ slug: `card-${index}`, name: `Chair ${index}`, image: "/chair.webp", categoryKey: "dining" })),
      zh: Array.from({ length: 4 }, (_, index) => ({ slug: `card-${index}`, name: `椅子 ${index}`, image: "/chair.webp", categoryKey: "dining" })),
    } };
    await import("./publicQuerySeed");
    const { publicContentQueries } = await import("./publicContentQueries");
    const { claimPublicQuerySeed } = await import("./publicQuerySeedCache");
    const client = new QueryClient();
    for (const language of ["en", "zh"] as const) {
      expect(claimPublicQuerySeed(client, publicContentQueries.homeFurniture(language).queryKey)).toEqual(fixture.payload.homeFurniture![language]);
    }
    expect(fixture.readerLoads).toBe(0);
    expect(fixture.mapperLoads).toBe(0);
    client.clear();
  });

  it("loads a furniture reader only when its real source query runs and passes cancellation", async () => {
    const { publicContentQueries } = await import("./publicContentQueries");
    const task = publicContentQueries.furnitureCatalog("zh");
    expect(fixture.readerLoads).toBe(0);
    const signal = new AbortController().signal;
    await task.queryFn({ signal });
    expect(fixture.readerLoads).toBe(1);
    expect(fixture.read).toHaveBeenCalledWith("zh", signal);
    expect(fixture.mapperLoads).toBe(0);
  });

  it("registers the furniture mapper before the first prefetch seed claim", async () => {
    fixture.payload = { furnitureCatalog: { materials: [], setting: null } };
    const { prefetchPublishedRouteContent } = await import("./publicRoutePrefetch");
    const { publicContentQueries } = await import("./publicContentQueries");
    const { documentSeedTime } = await import("./publicQuerySeedCache");
    expect(fixture.mapperLoads).toBe(0);
    const client = new QueryClient();
    await prefetchPublishedRouteContent(client, "/zh/furniture", "zh");
    const key = publicContentQueries.furnitureCatalog("zh").queryKey;
    expect(client.getQueryData(key)).toEqual([]);
    expect(client.getQueryState(key)?.dataUpdatedAt).toBe(documentSeedTime);
    expect(fixture.mapperLoads).toBe(1);
    expect(fixture.readerLoads).toBe(0);
    expect(fixture.read).not.toHaveBeenCalled();
    client.clear();
  });
});
