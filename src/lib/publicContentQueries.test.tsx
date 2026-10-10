import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "@/i18n/routes";
import type { PublicDataPayload } from "@/lib/publicPreload";
import { getPublishedProjectSummaries, getPublishedServices } from "@/lib/contentApi";
import { publicContentQueries, readPublicContentQueryKey } from "@/lib/publicContentQueries";
import { getPublicQuerySeed } from "@/lib/publicQuerySeed";
import { getPublicRoutePrefetchTasks, prefetchPublishedRouteContent } from "@/lib/publicRoutePrefetch";
import { usePublishedProjectSummaries, usePublishedServices } from "@/hooks/usePublishedContent";

const fixture = vi.hoisted(() => ({ payload: null as PublicDataPayload | null }));
vi.mock("@/lib/publicPreload", () => ({ readPreloadedPublicData: () => fixture.payload }));
vi.mock("@/lib/contentApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/contentApi")>(),
  getPublishedProjectSummaries: vi.fn(async () => []),
  getPublishedServices: vi.fn(async () => []),
}));
vi.mock("@/lib/homeContentApi", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/homeContentApi")>(),
  getPublishedSitePage: vi.fn(async () => null),
}));

let client: QueryClient;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let observed: ReturnType<typeof usePublishedServices> | ReturnType<typeof usePublishedProjectSummaries>;

function Probe({ language, projects = false, limit }: { language: Language; projects?: boolean; limit?: number }) {
  // Each probe retains the same hook family for its mounted lifetime.
  const projectsQuery = usePublishedProjectSummaries(language, limit, { enabled: projects });
  const servicesQuery = usePublishedServices(language, { enabled: !projects });
  observed = projects ? projectsQuery : servicesQuery;
  return null;
}
const render = async (language: Language, projects = false, limit?: number) => {
  await act(async () => root.render(<QueryClientProvider client={client}><Probe language={language} projects={projects} limit={limit} /></QueryClientProvider>));
  // Query promises resolve before TanStack's batched observer notifications.
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
};

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fixture.payload = null;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  vi.mocked(getPublishedProjectSummaries).mockReset().mockResolvedValue([]);
  vi.mocked(getPublishedServices).mockReset().mockResolvedValue([]);
});
afterEach(() => { act(() => root.unmount()); client.clear(); container.remove(); vi.unstubAllGlobals(); });

describe("shared public query consumers", () => {
  it.each(["en", "zh"] as const)("reuses route prefetch in the real %s project hook and isolates a limited query", async (language) => {
    await prefetchPublishedRouteContent(client, `/${language}/projects`, language);
    expect(getPublishedProjectSummaries).toHaveBeenCalledTimes(1);
    await render(language, true);
    expect(observed.data).toEqual([]);
    expect(getPublishedProjectSummaries).toHaveBeenCalledTimes(1);
    await render(language, true, 2);
    expect(getPublishedProjectSummaries).toHaveBeenCalledTimes(2);
    expect(getPublishedProjectSummaries).toHaveBeenLastCalledWith(language, 2, expect.any(AbortSignal));
    expect(client.getQueryState(publicContentQueries.projectSummaries(language).queryKey)?.status).toBe("success");
    expect(client.getQueryState(publicContentQueries.projectSummaries(language, 2).queryKey)?.status).toBe("success");
  });

  it("switches language using prefetched cache while retaining both languages", async () => {
    await prefetchPublishedRouteContent(client, "/zh/services", "en");
    await prefetchPublishedRouteContent(client, "/en/services", "zh");
    await render("zh"); await render("en"); await render("zh");
    expect(getPublishedServices).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(publicContentQueries.services("zh").queryKey)).toEqual([]);
    expect(client.getQueryData(publicContentQueries.services("en").queryKey)).toEqual([]);
  });

  it("consumes HTML once and reads the network after invalidation or cache removal", async () => {
    fixture.payload = { services: [{ id: "seed", slug: "fixture", title_en: "Seeded service", content_en: "Body" }] };
    const key = publicContentQueries.services("en").queryKey;
    await render("en");
    expect(observed.data).toMatchObject([{ title: "Seeded service" }]);
    expect(getPublishedServices).not.toHaveBeenCalled();
    await act(async () => { await client.invalidateQueries({ queryKey: key }); });
    // TanStack batches observer notifications after the query promise resolves.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    expect(getPublishedServices).toHaveBeenCalledTimes(1);
    expect(observed.data).toEqual([]);
    await act(async () => root.render(null));
    client.removeQueries({ queryKey: key });
    await render("en");
    expect(getPublishedServices).toHaveBeenCalledTimes(2);
    expect(observed.data).toEqual([]);
  });

  it("passes cancellation through route prefetch to the existing API reader", async () => {
    vi.mocked(getPublishedProjectSummaries).mockImplementation(() => new Promise(() => {}));
    const pending = prefetchPublishedRouteContent(client, "/en/projects", "en");
    const signal = vi.mocked(getPublishedProjectSummaries).mock.calls[0]?.[2];
    expect(signal).toBeInstanceOf(AbortSignal);
    await client.cancelQueries({ queryKey: publicContentQueries.projectSummaries("en").queryKey });
    await pending;
    expect(signal?.aborted).toBe(true);
  });
});

describe("shared HTML seed parameter semantics", () => {
  it("seeds optional homepage visibility only from a matching confirmed row", () => {
    const key = publicContentQueries.homeOptionalSectionVisibility("brand_partners").queryKey;
    expect(key).toEqual(["published", "home_optional_visibility", "brand_partners"]);
    fixture.payload = { homeContentBundle: { home_sections: [{ section_key: "stats", status: "published" }] } };
    expect(getPublicQuerySeed(key)).toBeUndefined();
    fixture.payload = { homeContentBundle: { home_sections: [{ section_key: "brand_partners", status: "published", items_zh: [{ enabled: false }] }] } };
    expect(getPublicQuerySeed(key)).toBe(false);
    fixture.payload.homeContentBundle!.home_sections = [{ section_key: "brand_partners", status: "published", items_zh: [{ enabled: true }] }];
    expect(getPublicQuerySeed(key)).toBe(true);
  });
  it("retains the existing cache identities for every public reader", () => {
    const q = publicContentQueries;
    const legacyKeys = [
      [q.homeBundle("zh"), ["published", "home_bundle", "zh"]],
      [q.services("zh"), ["published", "services", "zh"]],
      [q.serviceSummaries("zh"), ["published", "service_summaries", "zh", "all"]],
      [q.projectSummaries("zh", 3), ["published", "project_summaries", "zh", 3]],
      [q.materials("zh"), ["published", "materials", "zh"]],
      [q.managedFurnitureProducts("zh"), ["published", "furniture", "zh"]],
      [q.furnitureCatalog("zh"), ["published", "furniture_catalog", "zh"]],
      [q.furnitureProduct("fixture", "zh"), ["published", "furniture_catalog", "detail", "fixture", "zh"]],
      [q.managedFurnitureProduct("fixture", "zh"), ["published", "furniture", "detail", "fixture", "zh"]],
      [q.productHighlights("zh"), ["published", "product_highlights", "zh", 4]],
      [q.blogPosts("zh"), ["published", "blog", "zh"]],
      [q.faqs("zh"), ["published", "faqs", "zh", "general"]],
      [q.heroSlides("zh"), ["published", "hero_slides", "zh"]],
      [q.testimonials("zh"), ["published", "testimonials", "zh"]],
      [q.brandPartners(), ["published", "brand_partners"]],
      [q.beforeAfterItems("zh"), ["published", "before_after", "zh"]],
      [q.homeSection("zh", "stats"), ["published", "home_section", "zh", "stats"]],
      [q.processSteps("zh"), ["published", "process_steps", "zh"]],
      [q.ctaBlock("zh", "home_final"), ["published", "cta", "zh", "home_final"]],
      [q.aboutSection("zh", "hero"), ["published", "about_section", "zh", "hero"]],
      [q.sitePage("zh", "services"), ["published", "site_page", "zh", "services"]],
      [q.project("fixture", "zh"), ["published", "project", "fixture", "zh"]],
      [q.material("fixture", "zh"), ["published", "material", "fixture", "zh"]],
      [q.blogPost("fixture", "zh"), ["published", "blog_post", "fixture", "zh"]],
      [q.serviceArea("fixture", "zh"), ["published", "service_area", "fixture", "zh"]],
      [q.serviceAreas("zh"), ["published", "service_areas", "zh"]],
      [q.service("fixture", "zh"), ["published", "service", "fixture", "zh"]],
      [q.landingPage("fixture", "zh"), ["published", "landing", "fixture", "zh"]],
      [q.cmsPage("zh", "/fixture"), ["published", "cms_path", "zh", "/fixture"]],
    ] as const;
    for (const [descriptor, oldKey] of legacyKeys) expect(descriptor.queryKey).toEqual(oldKey);
  });

  it("does not treat a detail slug equal to zh as the query language", () => {
    fixture.payload = { services: [{ id: "seed", slug: "zh", title_en: "English service", title_zh: "中文服务", content_en: "English body", content_zh: "中文正文", suitable_for_en: [] }] };
    const task = getPublicRoutePrefetchTasks("/zh/services/zh", "en")[0];
    expect(task?.queryKey).toEqual(publicContentQueries.service("zh", "en").queryKey);
    expect(getPublicQuerySeed(task!.queryKey)).toMatchObject({ title: "English service" });
  });

  it("shares summary limits with HTML seed slicing, including the legacy all key", () => {
    fixture.payload = { services: [{ id: "one", title_en: "First" }, { id: "two", title_en: "Second" }] };
    expect(getPublicQuerySeed(publicContentQueries.serviceSummaries("en", 1).queryKey)).toMatchObject([{ title: "First" }]);
    expect(getPublicQuerySeed(publicContentQueries.serviceSummaries("en").queryKey)).toHaveLength(2);
    expect(publicContentQueries.serviceSummaries("en").queryKey).toEqual(["published", "service_summaries", "en", "all"]);
  });

  it("decodes page, block and furniture detail parameters without confusing them with language", () => {
    expect(readPublicContentQueryKey(publicContentQueries.sitePage("en", "zh").queryKey)).toMatchObject({ language: "en", pageKey: "zh" });
    expect(readPublicContentQueryKey(publicContentQueries.ctaBlock("en", "zh").queryKey)).toMatchObject({ language: "en", blockKey: "zh" });
    expect(readPublicContentQueryKey(publicContentQueries.furnitureProduct("zh", "en").queryKey)).toMatchObject({ language: "en", slug: "zh" });
    expect(readPublicContentQueryKey(["published", "services", "zh", "unexpected"])).toBeUndefined();
  });
});
