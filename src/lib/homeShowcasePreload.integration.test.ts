import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { furnitureCatalog } from "./furnitureCatalogPresentation";
import * as homeFurniture from "./homeFurniture";

type Row = Record<string, unknown>;
type FailedSource = "furniture-materials" | "furniture-settings" | "journal" | "areas";
type FixtureOptions = { empty?: boolean; failedSource?: FailedSource; invalidSource?: "journal" | "areas" };
type ShowcasePayload = Record<string, unknown> & {
  homeFurniture?: homeFurniture.HomeFurnitureSeed;
  homeJournalPosts?: Row[];
  homeServiceAreas?: Row[];
};

const shell = "<!doctype html><html><head><title>FLASH CAST</title></head><body><div id=\"root\"></div></body></html>";
const privateBody = "HOME_SHOWCASE_BODY_MUST_NOT_BE_PRELOADED".repeat(80);
const preferredChair = "lc-40108-1-seater-pu-lounge-chair-cream";
let fixtureSequence = 0;

const furnitureOverrides = (allHidden: boolean) => furnitureCatalog.products.map((product) => ({
  slug: product.slug,
  enabled: !allHidden && product.slug === preferredChair,
  name_en: "Saved lounge chair",
  name_zh: "已保存休闲椅",
  shortDescription_en: "Private product summary",
  shortDescription_zh: "不应预载的商品摘要",
  description_en: privateBody,
  description_zh: privateBody,
  price: "RM 999",
  images: ["/images/fixture/saved-lounge-chair.webp"],
}));

const journalRows: Row[] = Array.from({ length: 7 }, (_, index) => ({
  id: `journal-${index}`,
  slug: `renovation-reading-${index}`,
  status: "published",
  title_en: `Planning article ${index}`,
  title_zh: `装修规划文章 ${index}`,
  excerpt_en: `Practical planning summary ${index}.`,
  excerpt_zh: `实用装修规划摘要 ${index}。`,
  category: "materials-design",
  cover_image_url: `/images/fixture/article-${index}.webp`,
  alt_en: `Material study ${index}`,
  alt_zh: `材料搭配示意 ${index}`,
  published_at: "2026-10-07T00:00:00.000Z",
  created_at: "2026-10-06T00:00:00.000Z",
  updated_at: "2026-10-07T00:00:00.000Z",
  content_en: privateBody,
  content_zh: privateBody,
  seo_description_en: privateBody,
  seo_description_zh: privateBody,
}));

const areaRows: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: `area-${index}`,
  slug: `service-area-${index}`,
  status: "published",
  area_name: `Service area ${index}`,
  title_en: `Service area ${index}`,
  title_zh: `服务地区 ${index}`,
  excerpt_en: `Renovation planning in area ${index}.`,
  excerpt_zh: `地区 ${index} 的装修规划。`,
  property_types: ["Condo", "Landed"],
  sort_order: index,
  content_en: privateBody,
  content_zh: privateBody,
  construction_notes_en: privateBody,
  construction_notes_zh: privateBody,
  faqs_en: [{ q: "Private detail question", a: privateBody }],
  projects: [{ slug: "private-detail-project", description: privateBody }],
}));

const homeBundle = {
  site_pages: [{
    id: "home", page_key: "home", path: "/", status: "published",
    title_en: "Home", title_zh: "首页", description_en: "Spaces for everyday life.", description_zh: "适合日常生活的空间。",
    content_en: privateBody, content_zh: privateBody,
  }],
  hero_slides: [{ id: "hero", image_url: "/images/fixture/home.webp", title_en: "A better space", title_zh: "更好的空间" }],
  services: Array.from({ length: 6 }, (_, index) => ({
    id: `service-${index}`, slug: `service-${index}`, title_en: `Service ${index}`, title_zh: `服务 ${index}`,
    excerpt_en: "Service summary", excerpt_zh: "服务摘要", image_url: `/images/fixture/service-${index}.webp`, content_en: privateBody, content_zh: privateBody,
  })),
  projects: Array.from({ length: 6 }, (_, index) => ({
    id: `project-${index}`, slug: `project-${index}`, title_en: `Project ${index}`, title_zh: `项目 ${index}`,
    excerpt_en: "Project summary", excerpt_zh: "项目摘要", project_type: "residential", content_en: privateBody, content_zh: privateBody,
    project_images: [{ image_url: `/images/fixture/project-${index}.webp`, image_type: "cover", sort_order: 0 }],
  })),
  faqs: [{ id: "home-question", page_key: "home", status: "published", question_en: "How do I start?", question_zh: "如何开始？", answer_en: "Share your floor plan.", answer_zh: "提供你的户型图。" }],
};

// Emulate PostgREST's column projection and limit so the fixture proves that
// the middleware requests summaries rather than downloading whole articles.
const queryRows = (rows: Row[], url: URL) => {
  const selected = url.searchParams.get("select") || "*";
  const limit = Number(url.searchParams.get("limit") || rows.length);
  return rows.slice(0, limit).map((row) => selected === "*"
    ? row
    : Object.fromEntries(selected.split(",").flatMap((field) => Object.prototype.hasOwnProperty.call(row, field) ? [[field, row[field]]] : [])));
};

const renderHome = async (language: "en" | "zh", { empty = false, failedSource, invalidSource }: FixtureOptions = {}) => {
  const fixtureId = ++fixtureSequence;
  const supabaseUrl = `https://home-showcase-${fixtureId}.supabase.co`;
  const requests: URL[] = [];
  const setting = { section_key: "furniture_catalog", items_zh: furnitureOverrides(empty), updated_at: "2026-10-07T00:00:00.000Z" };
  const furnitureRows: Row[] = empty ? [] : [{
    id: "managed-chair", slug: "managed-dining-chair", category: "furniture", subcategory: "dining", status: "published",
    title_en: "Managed dining chair", title_zh: "后台餐椅", image_url: "/images/fixture/managed-chair.webp",
    excerpt_en: "Private product summary", excerpt_zh: "不应预载的商品摘要", content_en: privateBody, content_zh: privateBody,
    reference_price: "RM 900", seo_description_en: privateBody, seo_description_zh: privateBody,
  }];

  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    requests.push(url);
    let source: FailedSource | undefined;
    let body: unknown = [];
    if (url.pathname.endsWith("/site_settings")) body = [{ company_name: "FLASH CAST Fixture", updated_at: `fixture-${fixtureId}` }];
    else if (url.pathname.endsWith("/rpc/get_public_home_bundle")) body = homeBundle;
    else if (url.pathname.endsWith("/materials") && url.searchParams.get("category") === "eq.furniture") {
      source = "furniture-materials";
      body = queryRows(furnitureRows, url);
    } else if (url.pathname.endsWith("/home_sections") && url.searchParams.get("section_key") === "eq.furniture_catalog") {
      source = "furniture-settings";
      body = [setting];
    } else if (url.pathname.endsWith("/blog_posts")) {
      source = "journal";
      body = queryRows(empty ? [] : journalRows, url);
    } else if (url.pathname.endsWith("/service_areas")) {
      source = "areas";
      body = queryRows(empty ? [] : areaRows, url);
    }
    if (invalidSource && source === invalidSource) body = invalidSource === "journal" ? { error: "Unexpected response object" } : [null];
    return new Response(JSON.stringify(body), {
      status: source === failedSource && failedSource !== undefined ? 503 : 200,
      headers: { "content-type": "application/json" },
    });
  }));

  const response = await onRequest({
    request: new Request(`https://flashcast.com.my/${language}`),
    env: {
      CF_PAGES_COMMIT_SHA: `home-showcase-fixture-${fixtureId}`,
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }) },
    },
    next: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }),
  } as never);
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  const serialized = document.getElementById("flashcast-public-data")?.textContent;
  expect(response.status).toBe(200);
  expect(serialized, "a standard homepage must retain its preload script").toBeTruthy();
  return { response, html, requests, serialized: serialized!, payload: JSON.parse(serialized!) as ShowcasePayload };
};

const expectCompactQuery = (requests: URL[], table: string, limit: number, requiredFields: string[]) => {
  const matching = requests.filter((url) => url.pathname.endsWith(`/${table}`));
  expect(matching, `${table} should be read once for homepage summaries`).toHaveLength(1);
  const query = matching[0].searchParams;
  expect(query.get("status")).toBe("eq.published");
  expect(query.get("limit")).toBe(String(limit));
  const fields = query.get("select")?.split(",") ?? [];
  expect(fields).toEqual(expect.arrayContaining(requiredFields));
  expect(fields).not.toContain("*");
  expect(fields.some((field) => /^(?:content|construction_notes|faqs|projects|seo_)/.test(field))).toBe(false);
};

describe("compact homepage showcase preload", () => {
  beforeEach(() => {
    // A distinct source URL also isolates the middleware's in-memory row cache.
    vi.stubGlobal("caches", undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["en", "zh"] as const)("injects bounded bilingual showcase summaries on /%s within the existing 55000-byte budget", async (language) => {
    const { response, requests, serialized, payload } = await renderHome(language);
    expect(response.headers.get("x-flashcast-public-data")).not.toBe("omitted-too-large");
    expect(new TextEncoder().encode(serialized).byteLength).toBeLessThanOrEqual(55_000);
    expect(payload.homeContentBundle).toBeTruthy();
    expect(payload.homeFurniture).toBeDefined();
    expect(payload.homeJournalPosts).toHaveLength(3);
    expect(payload.homeServiceAreas).toHaveLength(8);
    for (const key of ["furnitureCatalog", "blogPosts", "serviceAreas"]) expect(payload).not.toHaveProperty(key);
    expect(serialized).not.toContain("HOME_SHOWCASE_BODY_MUST_NOT_BE_PRELOADED");
    expect(serialized).not.toContain("Private product summary");
    expect(serialized).not.toContain("RM 999");

    for (const locale of ["en", "zh"] as const) {
      const cards = payload.homeFurniture![locale];
      expect(cards).toHaveLength(2);
      expect(cards[0]).toMatchObject({ slug: preferredChair, name: locale === "en" ? "Saved lounge chair" : "已保存休闲椅", image: "/images/fixture/saved-lounge-chair.webp" });
      expect(cards[1]).toMatchObject({ slug: "managed-dining-chair", name: locale === "en" ? "Managed dining chair" : "后台餐椅", categoryKey: "dining" });
      for (const card of cards) expect(Object.keys(card).sort()).toEqual(["categoryKey", "image", "name", "slug"]);
    }
    expect(payload.homeJournalPosts?.[0]).toMatchObject({ slug: "renovation-reading-0", title_en: "Planning article 0", title_zh: "装修规划文章 0", cover_image_url: "/images/fixture/article-0.webp" });
    expect(payload.homeServiceAreas?.[0]).toMatchObject({ slug: "service-area-0", title_en: "Service area 0", title_zh: "服务地区 0" });
    for (const row of [...payload.homeJournalPosts!, ...payload.homeServiceAreas!]) {
      expect(row).not.toHaveProperty("content_en");
      expect(row).not.toHaveProperty("content_zh");
      expect(row).not.toHaveProperty("construction_notes_en");
      expect(row).not.toHaveProperty("faqs_en");
      expect(row).not.toHaveProperty("projects");
    }
    expectCompactQuery(requests, "blog_posts", 3, ["slug", "title_en", "title_zh", "excerpt_en", "excerpt_zh", "cover_image_url"]);
    expectCompactQuery(requests, "service_areas", 8, ["slug", "title_en", "title_zh", "area_name"]);
    expect(requests.filter((url) => url.pathname.endsWith("/materials") && url.searchParams.get("category") === "eq.furniture")).toHaveLength(1);
    expect(requests.find((url) => url.pathname.endsWith("/materials"))?.searchParams.get("order")).toBe("sort_order.asc,created_at.desc");
    expect(requests.filter((url) => url.pathname.endsWith("/home_sections") && url.searchParams.get("section_key") === "eq.furniture_catalog")).toHaveLength(1);
  });

  it.each(["en", "zh"] as const)("preserves successful empty lists and an entirely hidden furniture catalog on /%s", async (language) => {
    const { payload } = await renderHome(language, { empty: true });
    expect(payload.homeFurniture).toEqual({ en: [], zh: [] });
    expect(payload.homeJournalPosts).toEqual([]);
    expect(payload.homeServiceAreas).toEqual([]);
    for (const key of ["furnitureCatalog", "blogPosts", "serviceAreas"]) expect(payload).not.toHaveProperty(key);
  });

  it.each(["en", "zh"] as const)("preserves a successful empty furniture locale without replacing the compact seed on /%s", async (language) => {
    const compactSeed: homeFurniture.HomeFurnitureSeed = {
      en: [{ slug: "fixture-chair", name: "Fixture chair", image: "/images/fixture/chair.webp", categoryKey: "living" }],
      zh: [],
    };
    const mapper = vi.spyOn(homeFurniture, "mapHomeFurnitureSeed").mockReturnValue(compactSeed);
    const { payload } = await renderHome(language);
    expect(mapper).toHaveBeenCalledOnce();
    expect(payload.homeFurniture).toEqual(compactSeed);
    expect(payload).not.toHaveProperty("furnitureCatalog");
  });

  it.each([
    ["furniture-materials", "homeFurniture"],
    ["furniture-settings", "homeFurniture"],
    ["journal", "homeJournalPosts"],
    ["areas", "homeServiceAreas"],
  ] as const)("omits only the failed %s seed instead of presenting a successful empty result", async (failedSource, missingKey) => {
    const { payload } = await renderHome("en", { failedSource });
    expect(payload).not.toHaveProperty(missingKey);
    expect(payload.homeContentBundle).toBeTruthy();
    for (const key of ["homeFurniture", "homeJournalPosts", "homeServiceAreas"] as const) {
      if (key !== missingKey) expect(payload).toHaveProperty(key);
    }
    for (const key of ["furnitureCatalog", "blogPosts", "serviceAreas"]) expect(payload).not.toHaveProperty(key);
  });

  it.each([
    ["journal", "homeJournalPosts"],
    ["areas", "homeServiceAreas"],
  ] as const)("omits an invalid %s response without crashing or seeding an empty success", async (invalidSource, missingKey) => {
    const { payload } = await renderHome("zh", { invalidSource });
    expect(payload).not.toHaveProperty(missingKey);
    expect(payload.homeFurniture?.zh).toHaveLength(2);
    expect(payload.homeContentBundle).toBeTruthy();
    expect(payload).toHaveProperty(invalidSource === "journal" ? "homeServiceAreas" : "homeJournalPosts");
  });
});
