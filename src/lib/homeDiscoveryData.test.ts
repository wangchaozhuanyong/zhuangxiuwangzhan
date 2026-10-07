import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPublishedBlogPosts,
  getPublishedHomeJournal,
  getPublishedHomeServiceAreas,
  getPublishedServiceAreas,
  mapPublishedBlogPostRows,
  mapPublishedServiceAreaSummary,
} from "./contentApi";
import {
  HOME_JOURNAL_LIMIT,
  HOME_JOURNAL_ORDER,
  HOME_JOURNAL_SELECT,
  HOME_SERVICE_AREAS_LIMIT,
  HOME_SERVICE_AREAS_ORDER,
  HOME_SERVICE_AREAS_SELECT,
  projectHomeJournalPosts,
  projectHomeServiceAreas,
} from "./homeDiscoveryData";

const fixture = vi.hoisted(() => ({
  configured: true,
  response: { data: [] as unknown, error: null as Error | null },
  from: vi.fn(),
}));
vi.mock("@/lib/supabaseConfig", () => ({ get isSupabaseConfigured() { return fixture.configured; } }));
vi.mock("@/lib/supabase", () => ({ supabase: { from: fixture.from } }));

const request = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  abortSignal: vi.fn().mockReturnThis(),
  then: (resolve: (value: typeof fixture.response) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(fixture.response).then(resolve, reject),
};

const blogRows = Array.from({ length: 5 }, (_, index) => ({
  id: `blog-${index}`, slug: `journal-${index}`, title_en: `Journal ${index}`, title_zh: `文章${index}`,
  excerpt_en: "Saved summary", excerpt_zh: "保存的摘要", alt_en: "Saved image", alt_zh: "保存的图片",
  cover_image_url: "/saved-image.webp", category: "materials-design", published_at: "2026-10-07",
  content_en: "Article body should stay out of homepage data", seo_title_en: "Detail SEO", created_by: "internal-author",
}));
const areaRows = Array.from({ length: 10 }, (_, index) => ({
  slug: `area-${index}`, area_name: `Area ${index}`, title_en: `English area ${index}`, title_zh: `地区${index}`,
  excerpt_en: "Directory description", content_en: "Area body", property_types: ["Condo"], sort_order: index,
}));

beforeEach(() => {
  vi.clearAllMocks();
  fixture.configured = true;
  fixture.response = { data: [], error: null };
  fixture.from.mockReturnValue(request);
});

describe("homepage discovery projection", () => {
  it("limits cards and strips fields unused by the homepage without changing source rows", () => {
    const before = JSON.stringify({ blogRows, areaRows });
    const posts = projectHomeJournalPosts(blogRows);
    const areas = projectHomeServiceAreas(areaRows);
    expect(posts).toHaveLength(HOME_JOURNAL_LIMIT);
    expect(areas).toHaveLength(HOME_SERVICE_AREAS_LIMIT);
    expect(Object.keys(posts[0]).sort()).toEqual(HOME_JOURNAL_SELECT.split(",").sort());
    expect(Object.keys(areas[0]).sort()).toEqual(HOME_SERVICE_AREAS_SELECT.split(",").sort());
    expect(JSON.stringify({ posts, areas })).not.toContain("Article body");
    expect(JSON.stringify({ posts, areas })).not.toContain("Area body");
    expect(JSON.stringify({ posts, areas })).not.toContain("internal-author");
    expect(JSON.stringify({ blogRows, areaRows })).toBe(before);
  });

  it.each(["en", "zh"] as const)("uses the existing %s mappers with the same projected rows as Edge", async (language) => {
    fixture.response.data = blogRows;
    const posts = await getPublishedHomeJournal(language);
    expect(posts).toEqual(mapPublishedBlogPostRows(projectHomeJournalPosts(blogRows), language));
    expect(posts[0].title).toBe(language === "en" ? "Journal 0" : "文章0");
    fixture.response.data = areaRows;
    expect(await getPublishedHomeServiceAreas(language)).toEqual(
      projectHomeServiceAreas(areaRows).map((row) => mapPublishedServiceAreaSummary(row, language)),
    );
  });
});

describe("homepage discovery read contracts", () => {
  it("requests only three published article summaries and forwards cancellation", async () => {
    fixture.response.data = blogRows;
    const signal = new AbortController().signal;
    await getPublishedHomeJournal("en", signal);
    expect(fixture.from).toHaveBeenCalledWith("blog_posts");
    expect(request.select).toHaveBeenCalledWith(HOME_JOURNAL_SELECT);
    expect(request.eq).toHaveBeenCalledWith("status", "published");
    expect(request.order).toHaveBeenCalledWith(HOME_JOURNAL_ORDER.column, { ascending: HOME_JOURNAL_ORDER.ascending });
    expect(request.limit).toHaveBeenCalledWith(3);
    expect(request.abortSignal).toHaveBeenCalledWith(signal);
  });

  it("requests only eight published area links and forwards cancellation", async () => {
    fixture.response.data = areaRows;
    const signal = new AbortController().signal;
    await getPublishedHomeServiceAreas("zh", signal);
    expect(fixture.from).toHaveBeenCalledWith("service_areas");
    expect(request.select).toHaveBeenCalledWith(HOME_SERVICE_AREAS_SELECT);
    expect(request.eq).toHaveBeenCalledWith("status", "published");
    expect(request.order).toHaveBeenCalledWith(HOME_SERVICE_AREAS_ORDER.column, { ascending: HOME_SERVICE_AREAS_ORDER.ascending });
    expect(request.limit).toHaveBeenCalledWith(8);
    expect(request.abortSignal).toHaveBeenCalledWith(signal);
  });

  it("retains successful empty results instead of restoring local content", async () => {
    expect(await getPublishedHomeJournal("en")).toEqual([]);
    expect(await getPublishedHomeServiceAreas("zh")).toEqual([]);
  });

  it("propagates failed reads instead of reporting an empty or fallback success", async () => {
    const failure = new Error("Published content unavailable");
    fixture.response = { data: null, error: failure };
    await expect(getPublishedHomeJournal("en")).rejects.toBe(failure);
    await expect(getPublishedHomeServiceAreas("zh")).rejects.toBe(failure);
  });

  it.each([null, {}, [null], [42], [[]]])("rejects malformed successful responses: %j", async (data) => {
    fixture.response.data = data;
    await expect(getPublishedHomeJournal("en")).rejects.toThrow("Homepage journal data unavailable");
    await expect(getPublishedHomeServiceAreas("zh")).rejects.toThrow("Homepage service area data unavailable");
  });

  it.each(["en", "zh"] as const)("uses limited local %s fallback only when no database is configured", async (language) => {
    fixture.configured = false;
    const posts = await getPublishedHomeJournal(language);
    const areas = await getPublishedHomeServiceAreas(language);
    expect(posts).toHaveLength(3);
    expect(areas).toHaveLength(8);
    expect(posts.every((post) => post.slug && post.title && post.image)).toBe(true);
    expect(areas.every((area) => area.slug && area.name)).toBe(true);
    expect(fixture.from).not.toHaveBeenCalled();
  });

  it("keeps existing full article and area directory reads complete and unrestricted", async () => {
    fixture.response.data = blogRows;
    const fullPosts = await getPublishedBlogPosts("en");
    expect(fullPosts).toHaveLength(5);
    expect(fullPosts[0].content).toContain("Article body");
    fixture.response.data = areaRows;
    const fullAreas = await getPublishedServiceAreas("en");
    expect(fullAreas).toHaveLength(10);
    expect(fullAreas[0].description).toBe("Directory description");
    expect(request.select.mock.calls).toEqual([["*"], ["*"]]);
    expect(request.limit).not.toHaveBeenCalled();
  });
});
