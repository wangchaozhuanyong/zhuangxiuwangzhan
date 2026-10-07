import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "@/i18n/routes";
import type { PublicDataPayload } from "@/lib/publicPreload";
import { getPublishedHomeFurniture } from "@/lib/furnitureCatalog";
import {
  getPublishedHomeJournal,
  getPublishedHomeServiceAreas,
  mapPublishedBlogPostRows,
  mapPublishedServiceAreaSummary,
} from "@/lib/contentApi";
import { invalidatePublishedContent } from "@/lib/adminInvalidate";
import { publicContentQueries } from "@/lib/publicContentQueries";
import { getPublicQuerySeed } from "@/lib/publicQuerySeed";
import { getPublicRoutePrefetchTasks, prefetchPublishedRouteContent } from "@/lib/publicRoutePrefetch";
import {
  usePublishedHomeFurniture,
  usePublishedHomeJournal,
  usePublishedHomeServiceAreas,
} from "@/hooks/usePublishedContent";

const fixture = vi.hoisted(() => ({ payload: null as PublicDataPayload | null }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => fixture.payload }));
vi.mock("@/lib/furnitureCatalog", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/furnitureCatalog")>(),
  getPublishedHomeFurniture: vi.fn(async () => []),
}));
vi.mock("@/lib/contentApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/contentApi")>(),
  getPublishedHomeJournal: vi.fn(async () => []),
  getPublishedHomeServiceAreas: vi.fn(async () => []),
}));
vi.mock("@/lib/homeContentApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/homeContentApi")>();
  return {
    ...actual,
    // Homepage route prefetch also reads the existing home bundle.
    getPublishedHomeContentBundle: vi.fn(async (language: Language) => ({
      data: actual.mapRemoteHomeContentBundle({}, language), source: "remote", reason: "remote-ok",
    })),
  };
});

const seedPayload = (): PublicDataPayload => ({
  homeFurniture: {
    en: [{ slug: "seed-chair", name: "Seed chair", image: "/seed-chair.webp", categoryKey: "living" }],
    zh: [{ slug: "seed-chair", name: "预载椅子", image: "/seed-chair.webp", categoryKey: "living" }],
  },
  homeJournalPosts: [{
    id: "seed-post", slug: "seed-post", title_en: "Seed article", title_zh: "预载文章",
    excerpt_en: "Article summary", excerpt_zh: "文章摘要", cover_image_url: "/seed-post.webp",
  }],
  homeServiceAreas: [{ slug: "seed-area", title_en: "Seed area", title_zh: "预载地区" }],
});

const readers = [getPublishedHomeFurniture, getPublishedHomeJournal, getPublishedHomeServiceAreas];
const descriptors = (language: Language) => [
  publicContentQueries.homeFurniture(language),
  publicContentQueries.homeJournal(language),
  publicContentQueries.homeServiceAreas(language),
];

let client: QueryClient;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let observed: {
  furniture: ReturnType<typeof usePublishedHomeFurniture>;
  journal: ReturnType<typeof usePublishedHomeJournal>;
  areas: ReturnType<typeof usePublishedHomeServiceAreas>;
};

function Probe({ language }: { language: Language }) {
  observed = {
    furniture: usePublishedHomeFurniture(language),
    journal: usePublishedHomeJournal(language),
    areas: usePublishedHomeServiceAreas(language),
  };
  return null;
}

const flushObservers = async () => {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
};
const render = async (language: Language) => {
  await act(async () => root.render(<QueryClientProvider client={client}><Probe language={language} /></QueryClientProvider>));
  await flushObservers();
};
const unmountProbe = async () => { await act(async () => root.render(null)); };
const expectReadCount = (count: number) => {
  for (const read of readers) expect(read).toHaveBeenCalledTimes(count);
};
const expectSeed = (language: Language) => {
  expect(observed.furniture.data).toMatchObject([{ slug: "seed-chair", name: language === "en" ? "Seed chair" : "预载椅子" }]);
  expect(observed.journal.data).toMatchObject([{ slug: "seed-post", title: language === "en" ? "Seed article" : "预载文章", content: "" }]);
  expect(observed.areas.data).toMatchObject([{ slug: "seed-area", name: language === "en" ? "Seed area" : "预载地区" }]);
};
const expectEmpty = () => {
  for (const query of Object.values(observed)) {
    expect(query.data).toEqual([]);
    expect(query.isSuccess).toBe(true);
  }
};
const setFreshReads = () => {
  vi.mocked(getPublishedHomeFurniture).mockResolvedValue([
    { slug: "new-chair", name: "Updated chair", image: "/updated-chair.webp", categoryKey: "living" },
  ]);
  vi.mocked(getPublishedHomeJournal).mockResolvedValue(mapPublishedBlogPostRows([
    { id: "new-post", slug: "new-post", title_en: "Updated article", cover_image_url: "/updated-post.webp" },
  ], "en"));
  vi.mocked(getPublishedHomeServiceAreas).mockResolvedValue([
    mapPublishedServiceAreaSummary({ slug: "new-area", title_en: "Updated area" }, "en"),
  ]);
};
const expectFresh = () => {
  expect(observed.furniture.data).toMatchObject([{ slug: "new-chair", name: "Updated chair" }]);
  expect(observed.journal.data).toMatchObject([{ slug: "new-post", title: "Updated article" }]);
  expect(observed.areas.data).toMatchObject([{ slug: "new-area", name: "Updated area" }]);
};

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fixture.payload = null;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.mocked(getPublishedHomeFurniture).mockReset().mockResolvedValue([]);
  vi.mocked(getPublishedHomeJournal).mockReset().mockResolvedValue([]);
  vi.mocked(getPublishedHomeServiceAreas).mockReset().mockResolvedValue([]);
});

afterEach(() => {
  act(() => root.unmount());
  client.clear();
  container.remove();
  vi.unstubAllGlobals();
});

describe("homepage showcase query lifecycle", () => {
  it.each(["en", "zh"] as const)("uses the %s HTML seed with zero reader calls, including route prefetch", async (language) => {
    fixture.payload = seedPayload();
    await prefetchPublishedRouteContent(client, `/${language}`, language);
    await render(language);
    expectSeed(language);
    expectReadCount(0);
    for (const descriptor of descriptors(language)) {
      expect(client.getQueryState(descriptor.queryKey)?.status).toBe("success");
    }
  });

  it("keeps explicitly empty published seeds empty without fetching or reviving defaults", async () => {
    fixture.payload = { homeFurniture: { en: [], zh: [] }, homeJournalPosts: [], homeServiceAreas: [] };
    await render("en");
    expectEmpty();
    expectReadCount(0);
  });

  it.each(["en", "zh"] as const)("reuses the %s route prefetch keys in all three real hooks", async (language) => {
    const tasks = getPublicRoutePrefetchTasks(`/${language}`, language);
    for (const descriptor of descriptors(language)) {
      expect(tasks.filter((task) => JSON.stringify(task.queryKey) === JSON.stringify(descriptor.queryKey))).toHaveLength(1);
    }
    await prefetchPublishedRouteContent(client, `/${language}`, language);
    expectReadCount(1);
    await render(language);
    expectEmpty();
    expectReadCount(1);
    for (const read of readers) expect(read).toHaveBeenLastCalledWith(language, expect.any(AbortSignal));
  });

  it("does not seed complete catalogues, directories, or details with homepage summaries", async () => {
    fixture.payload = seedPayload();
    await render("en");
    const q = publicContentQueries;
    for (const language of ["en", "zh"] as const) {
      const fullQueries = [
        q.furnitureCatalog(language), q.managedFurnitureProducts(language),
        q.furnitureProduct("seed-chair", language), q.managedFurnitureProduct("seed-chair", language),
        q.blogPosts(language), q.blogPost("seed-post", language),
        q.serviceAreas(language), q.serviceArea("seed-area", language),
      ];
      for (const descriptor of fullQueries) {
        expect(getPublicQuerySeed(descriptor.queryKey)).toBeUndefined();
        expect(client.getQueryState(descriptor.queryKey)).toBeUndefined();
      }
    }
    expectSeed("en");
    expectReadCount(0);
  });

  it("refreshes all summaries after publishing, honoring both deletions and newly published values", async () => {
    fixture.payload = seedPayload();
    await render("en");
    expectSeed("en");
    await act(async () => { await invalidatePublishedContent(client); });
    await flushObservers();
    expectReadCount(1);
    expectEmpty();

    setFreshReads();
    await act(async () => { await invalidatePublishedContent(client); });
    await flushObservers();
    expectReadCount(2);
    expectFresh();
    // The original HTML is deliberately unchanged throughout both refreshes.
    expect(fixture.payload.homeFurniture?.en[0].slug).toBe("seed-chair");
  });

  it.each(["remove", "clear"] as const)("does not restore stale HTML after cache %s and remount", async (operation) => {
    fixture.payload = seedPayload();
    await render("en");
    expectSeed("en");
    await unmountProbe();
    if (operation === "remove") client.removeQueries({ queryKey: ["published"] });
    else client.clear();

    setFreshReads();
    await render("en");
    expectReadCount(1);
    expectFresh();
  });

  it("keeps language caches independent and reuses each language's own seed on return", async () => {
    fixture.payload = seedPayload();
    await render("en");
    expectSeed("en");
    await render("zh");
    expectSeed("zh");
    await render("en");
    expectSeed("en");
    expectReadCount(0);

    const englishBefore = descriptors("en").map(({ queryKey }) => client.getQueryData(queryKey));
    await render("zh");
    await act(async () => {
      await Promise.all(descriptors("zh").map(({ queryKey }) => client.invalidateQueries({ queryKey, exact: true })));
    });
    await flushObservers();
    expectEmpty();
    expectReadCount(1);
    for (const read of readers) expect(read).toHaveBeenLastCalledWith("zh", expect.any(AbortSignal));
    expect(descriptors("en").map(({ queryKey }) => client.getQueryData(queryKey))).toEqual(englishBefore);
    await render("en");
    expectSeed("en");
    expectReadCount(1);
  });

  it("passes cancellation from homepage route prefetch through all three readers", async () => {
    vi.mocked(getPublishedHomeFurniture).mockImplementation(() => new Promise(() => {}));
    vi.mocked(getPublishedHomeJournal).mockImplementation(() => new Promise(() => {}));
    vi.mocked(getPublishedHomeServiceAreas).mockImplementation(() => new Promise(() => {}));
    const pending = prefetchPublishedRouteContent(client, "/en", "en");
    const signals = [
      vi.mocked(getPublishedHomeFurniture).mock.calls[0]?.[1],
      vi.mocked(getPublishedHomeJournal).mock.calls[0]?.[1],
      vi.mocked(getPublishedHomeServiceAreas).mock.calls[0]?.[1],
    ];
    for (const signal of signals) expect(signal).toBeInstanceOf(AbortSignal);
    await client.cancelQueries({ queryKey: ["published"] });
    await pending;
    for (const signal of signals) expect(signal?.aborted).toBe(true);
    for (const { queryKey } of descriptors("en")) {
      expect(client.getQueryState(queryKey)?.fetchStatus).toBe("idle");
      expect(client.getQueryData(queryKey)).toBeUndefined();
    }
  });
});
