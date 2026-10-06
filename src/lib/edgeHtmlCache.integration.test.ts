import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { buildSupabaseSrcSet } from "./supabaseImage";

declare global {
  interface CacheStorage {
    default: Cache;
  }

  type PagesFunctionContext = {
    request: Request;
    env: Record<string, unknown>;
    next: (input?: RequestInfo | URL) => Promise<Response>;
    waitUntil?: (promise: Promise<unknown>) => void;
  };

  type PagesFunction = (context: PagesFunctionContext) => Response | Promise<Response>;
}

class MemoryEdgeCache {
  private readonly entries = new Map<string, Response>();

  async match(request: Request) {
    return this.entries.get(request.url)?.clone();
  }

  async put(request: Request, response: Response) {
    this.entries.set(request.url, response.clone());
  }

  clear() {
    this.entries.clear();
  }

  expireFreshnessMarker() {
    for (const key of this.entries.keys()) {
      if (key.includes("__flashcast_html_fresh=1")) this.entries.delete(key);
    }
  }

  getPublicHtmlEntry() {
    const entry = Array.from(this.entries.entries())
      .find(([key]) => !key.includes("__flashcast_html_fresh=1"));
    return entry?.[1].clone();
  }
}

const originalCachesDescriptor = Object.getOwnPropertyDescriptor(globalThis, "caches");

describe("public Edge HTML cache", () => {
  const edgeCache = new MemoryEdgeCache();
  const pendingTasks: Promise<unknown>[] = [];
  let siteSettingsRevision = "2026-08-21T00:00:00.000Z";
  const supabaseFetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes("/rest/v1/site_settings")
      ? JSON.stringify([{ updated_at: siteSettingsRevision }])
      : "[]";
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  const assetHtml = "<!doctype html><html><head><title>FLASH CAST</title></head><body><div id=\"root\"></div></body></html>";

  const catalogOverride = { slug: "ws-2102-wooden-bunk-bed-white", enabled: true, name_zh: "已更新双层床", name_en: "Updated bunk bed", shortDescription_zh: "更新后的床简介", shortDescription_en: "Updated bed summary", description_zh: "床详情", description_en: "Bed details", price: "RM475.00 – RM495.00", images: ["/updated-bed.webp"] };

  beforeEach(() => {
    edgeCache.clear();
    siteSettingsRevision = "2026-08-21T00:00:00.000Z";
    supabaseFetch.mockImplementation(async (input: RequestInfo | URL) => new Response(
      String(input).includes("/rest/v1/site_settings") ? JSON.stringify([{ updated_at: siteSettingsRevision }]) : "[]",
      { status: 200, headers: { "content-type": "application/json" } },
    ));
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: { default: edgeCache },
    });
    vi.stubGlobal("fetch", supabaseFetch);
  });

  afterEach(async () => {
    await Promise.all(pendingTasks.splice(0));
    vi.unstubAllGlobals();
    supabaseFetch.mockClear();
    if (originalCachesDescriptor) {
      Object.defineProperty(globalThis, "caches", originalCachesDescriptor);
    } else {
      delete (globalThis as { caches?: unknown }).caches;
    }
  });

  const requestPage = async ({
    deploymentVersion = "commit-a",
    html = assetHtml,
    path = "/zh/projects",
    supabaseUrl = "https://example.supabase.co",
    headers,
    assetHeaders,
  }: {
    deploymentVersion?: string;
    html?: string;
    path?: string;
    supabaseUrl?: string;
    headers?: HeadersInit;
    assetHeaders?: Record<string, string>;
  } = {}) => {
    const request = new Request(`https://flashcast.com.my${path}`, { headers });
    return onRequest({
      request,
      env: {
        CF_PAGES_COMMIT_SHA: deploymentVersion,
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
        ASSETS: {
          fetch: async () => new Response(html, {
            headers: { "content-type": "text/html; charset=utf-8", ...assetHeaders },
          }),
        },
      },
      next: async () => new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8", ...assetHeaders },
      }),
      waitUntil: (promise: Promise<unknown>) => pendingTasks.push(promise),
    } as never);
  };

  it.each(["gzip", "br"])("keeps rewritten HTML and cache hits decodable after an asset encoded as %s", async (encoding) => {
    const first = await requestPage({ assetHeaders: { "content-encoding": encoding, "content-length": "12" } });
    expect(first.headers.get("content-encoding")).toBeNull();
    expect(first.headers.get("content-length")).toBeNull();
    const html = await first.text();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('rel="canonical"');
    await Promise.all(pendingTasks.splice(0));
    const cached = edgeCache.getPublicHtmlEntry();
    expect(cached?.headers.get("content-encoding")).toBeNull();
    expect(cached?.headers.get("content-length")).toBeNull();
    const hit = await requestPage();
    expect(hit.headers.get("x-flashcast-html-cache")).toBe("hit");
    expect(await hit.text()).toBe(html);
    const revalidated = await requestPage({ headers: { "if-none-match": first.headers.get("etag") || "" } });
    expect(revalidated.status).toBe(304);
  });

  it.each(["/admin", "/en/not-a-published-route"])("removes old asset transport headers from bypass HTML at %s", async (path) => {
    const response = await requestPage({ path, assetHeaders: { "content-encoding": "gzip", "content-length": "12" } });
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toContain("noindex");
  });

  const requestVersion = async () => onRequest({
    request: new Request("https://flashcast.com.my/__flashcast/version"),
    env: {
      CF_PAGES_COMMIT_SHA: "commit-version-endpoint",
      VITE_SUPABASE_URL: "https://version-endpoint.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    next: async () => new Response("not used"),
  } as never);

  it("serves a lightweight uncached deployment and content version", async () => {
    const response = await requestVersion();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.json()).resolves.toEqual({
      deploymentVersion: "commit-version-endpoint",
      contentVersion: siteSettingsRevision,
    });
  });

  it("passes the dedicated offline document to the static asset handler", async () => {
    const offlineHtml = "<!doctype html><html><body><h1>当前网络不可用</h1></body></html>";
    const next = vi.fn(async () => new Response(offlineHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    }));

    const response = await onRequest({
      request: new Request("https://flashcast.com.my/offline"),
      env: {},
      next,
    } as never);

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain("当前网络不可用");
  });

  it.each([
    ["/en/products", "/en/materials"],
    ["/zh/products/spc-flooring-natural-oak/?source=legacy", "/zh/materials/spc-flooring-natural-oak?source=legacy"],
  ])("permanently redirects %s to the matching material path", async (path, expectedPath) => {
    const response = await onRequest({
      request: new Request(`https://flashcast.com.my${path}`),
      env: {},
      next: async () => new Response("not used"),
    } as never);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://flashcast.com.my${expectedPath}`);
  });

  it.each([
    ["/en/materials/acrylic-cabinet-door", "/en/materials/acrylic-cabinet-gloss-white"],
    ["/zh/materials/aluminium-sliding-door?source=gsc", "/zh/materials/aluminium-sliding-black?source=gsc"],
    ["/en/materials/fluted-wall-panel", "/en/materials/fluted-panel-charcoal"],
    ["/zh/materials/kitchen-melamine-cabinets", "/zh/materials/category/kitchen-cabinets/melamine-cabinets"],
    ["/en/materials/quartz-countertop-white", "/en/materials/quartz-countertop-carrara-white"],
  ])("permanently redirects historical material path %s to the verified replacement", async (path, expectedPath) => {
    const response = await onRequest({
      request: new Request(`https://flashcast.com.my${path}`),
      env: {},
      next: async () => new Response("not used"),
    } as never);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://flashcast.com.my${expectedPath}`);
  });

  it.each([
    ["/en/landing/office-renovation", "/en/services/office-renovation"],
    ["/zh/landing/kitchen-cabinet?source=legacy", "/zh/services/kitchen?source=legacy"],
    ["/en/landing/warehouse-shelving/", "/en/services/warehouse"],
    ["/en/landing/flooring?source=legacy", "/en/services/flooring?source=legacy"],
  ])("permanently redirects %s to the mapped service path", async (path, expectedPath) => {
    const response = await onRequest({
      request: new Request(`https://flashcast.com.my${path}`),
      env: {},
      next: async () => new Response("not used"),
    } as never);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://flashcast.com.my${expectedPath}`);
  });

  it("filters redirect-only URLs from the merged public sitemap", async () => {
    const staticSitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset>
      <url><loc>https://flashcast.com.my/en/products</loc></url>
      <url><loc>https://flashcast.com.my/zh/services/flooring</loc></url>
    </urlset>`;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (!url.searchParams.has("id") && ["/rest/v1/services", "/rest/v1/landing_pages"].includes(url.pathname)) {
        return new Response(JSON.stringify([{ id: "001", status: "published", slug: "flooring", title_en: "Flooring", title_zh: "地板", content_en: "Published flooring service", content_zh: "已发布地板服务正文" }]));
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await onRequest({
      request: new Request("https://flashcast.com.my/sitemap.xml"),
      env: {
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
        ASSETS: {
          fetch: async () => new Response(staticSitemap, { headers: { "content-type": "application/xml" } }),
        },
      },
      next: async () => new Response("not used"),
    } as never);
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(xml).toContain("https://flashcast.com.my/zh/services/flooring");
    expect(xml).toContain("https://flashcast.com.my/en/services/flooring");
    expect(xml).not.toContain("https://flashcast.com.my/en/products");
    expect(xml).not.toContain("https://flashcast.com.my/en/landing/flooring");
    expect(xml).not.toContain("https://flashcast.com.my/zh/landing/office-renovation");
  });

  it("uses catalog override metadata and preloads settings for the same product", async () => {
    supabaseFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const body = url.pathname.endsWith("/home_sections") ? [{ section_key: "furniture_catalog", items_zh: [catalogOverride], updated_at: "2026-10-04T01:00:00Z" }] : [];
      return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
    });
    const response = await requestPage({ path: `/zh/furniture/product/${catalogOverride.slug}`, supabaseUrl: "https://catalog-edit.supabase.co" });
    const html = await response.text();
    expect(html).toContain("已更新双层床");
    expect(html).toContain("更新后的床简介");
    expect(html).toContain("https://flashcast.com.my/updated-bed.webp");
    expect(html).toContain('"furnitureCatalog"');
    expect(html).toContain('"detailSlug":"ws-2102-wooden-bunk-bed-white"');
  });

  it("returns noindex and removes both language links when a catalog product is hidden", async () => {
    supabaseFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const body = url.pathname.endsWith("/home_sections") ? [{ section_key: "furniture_catalog", items_zh: [{ ...catalogOverride, enabled: false }] }]
        : url.pathname.endsWith("/materials") && !url.searchParams.has("id") ? [{ id: "001", status: "published", category: "furniture", slug: catalogOverride.slug, title_en: "Bed", title_zh: "床", content_en: "Published bed", content_zh: "已发布床正文" }] : [];
      return new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
    });
    const response = await requestPage({ path: `/en/furniture/product/${catalogOverride.slug}`, supabaseUrl: "https://catalog-hidden.supabase.co" });
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("noindex, nofollow");
    const xml = `<urlset><url><loc>https://flashcast.com.my/en/furniture/product/${catalogOverride.slug}</loc></url><url><loc>https://flashcast.com.my/zh/furniture/product/${catalogOverride.slug}</loc></url></urlset>`;
    const sitemapResponse = await requestPage({ path: "/sitemap.xml", html: xml, supabaseUrl: "https://catalog-hidden-sitemap.supabase.co" });
    expect(sitemapResponse.status).toBe(200);
    expect(await sitemapResponse.text()).not.toContain(catalogOverride.slug);
  });

  it("publishes admin furniture URLs in the sitemap without material detail URLs", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/rest/v1/materials") && !url.searchParams.has("id")) {
        return new Response(JSON.stringify([{ id: "001", status: "published", category: "furniture", slug: "test-furniture-chair", title_en: "Chair", title_zh: "椅子", content_en: "Published chair", content_zh: "已发布椅子正文" }]), { headers: { "content-type": "application/json" } });
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await onRequest({
      request: new Request("https://flashcast.com.my/sitemap.xml"),
      env: {
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
        ASSETS: { fetch: async () => new Response("<urlset></urlset>") },
      },
      next: async () => new Response("not used"),
    } as never);
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(xml).toContain("https://flashcast.com.my/en/furniture/product/test-furniture-chair");
    expect(xml).toContain("https://flashcast.com.my/zh/furniture/product/test-furniture-chair");
    expect(xml).not.toContain("/materials/test-furniture-chair");
  });

  it("serves localized metadata for a published admin furniture product", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/rest/v1/materials")) {
        expect(url.searchParams.get("category")).toBe("eq.furniture");
        return new Response(JSON.stringify([{
          id: "managed-furniture-1",
          slug: "test-furniture-chair",
          category: "furniture",
          status: "published",
          title_zh: "测试餐椅",
          title_en: "Test dining chair",
          seo_description_zh: "测试餐椅的商品详情",
          image_url: "/images/furniture/test-chair.webp",
          updated_at: "2026-09-29T00:00:00.000Z",
        }]), { headers: { "content-type": "application/json" } });
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({ path: "/zh/furniture/product/test-furniture-chair" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("测试餐椅");
    expect(html).toContain('rel="canonical" href="https://flashcast.com.my/zh/furniture/product/test-furniture-chair"');
    expect(html).toContain("测试餐椅的商品详情");
  });

  it("reads only blog metadata at the Edge and never uses the article body as the description fallback", async () => {
    const requestedSelects: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/site_settings")) {
        return new Response(JSON.stringify([{ updated_at: siteSettingsRevision }]), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.pathname.endsWith("/blog_posts")) {
        requestedSelects.push(url.searchParams.get("select") || "");
        return new Response(JSON.stringify([{
          id: "blog-dbkl",
          slug: "renovation-permit-dbkl-guide",
          title_en: "DBKL permit guide",
          title_zh: "DBKL 装修准证指南",
          excerpt_en: "",
          seo_description_en: "",
          content_en: "BODY_TEXT_MUST_NOT_BECOME_EDGE_DESCRIPTION",
          tags: { invalid: true },
          published_at: "not-a-date",
          updated_at: "also-not-a-date",
        }]), { headers: { "content-type": "application/json" } });
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({ path: "/en/blog/renovation-permit-dbkl-guide" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(requestedSelects).toHaveLength(1);
    expect(requestedSelects[0]).not.toBe("*");
    expect(requestedSelects[0]).not.toContain("content_en");
    expect(requestedSelects[0]).not.toContain("content_zh");
    expect(html).not.toContain("BODY_TEXT_MUST_NOT_BECOME_EDGE_DESCRIPTION");
    expect(html).toContain('rel="canonical" href="https://flashcast.com.my/en/blog/renovation-permit-dbkl-guide"');
    expect(html).toContain('hreflang="zh-CN"');
    expect(html).toContain('hreflang="en"');
  });

  it.each([
    ["zh", "+601100000001"],
    ["en", "+601100000001"],
    ["zh", undefined],
    ["en", undefined],
    ["zh", ""],
    ["en", ""],
  ])("publishes a language-aware Service with a ContactPoint for %s and phone %s", async (lang, phone) => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/site_settings")) {
        return new Response(JSON.stringify([{
          company_name: "FLASH CAST SDN. BHD.",
          phone_e164: phone,
          updated_at: siteSettingsRevision,
        }]), { headers: { "content-type": "application/json" } });
      }
      if (url.pathname.endsWith("/services")) {
        return new Response(JSON.stringify([{
          id: "service-bathroom",
          slug: "bathroom",
          title_en: "Bathroom Renovation and Waterproofing",
          title_zh: "浴室装修与防水工程",
          seo_title_en: "Bathroom Renovation Malaysia | FLASH CAST",
          seo_title_zh: "吉隆坡浴室装修与防水工程 | FLASH CAST",
          seo_description_en: "Plan bathroom waterproofing, drainage, tiles and sanitary fittings around the real site.",
          seo_description_zh: "根据真实现场规划浴室防水、排水、瓷砖与洁具范围。",
          image_url: "/images/services/bathroom-renovation.webp",
          faqs_zh: [{ q: "浴室漏水一定要全部翻新吗？", a: "不一定，应先检查漏水来源和现场条件。" }],
          updated_at: siteSettingsRevision,
          status: "published",
        }]), { headers: { "content-type": "application/json" } });
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({
      path: `/${lang}/services/bathroom`,
      // Isolate each settings fixture from the middleware's in-memory cache.
      supabaseUrl: `https://service-schema-${lang}-${phone ? "configured" : phone === undefined ? "missing" : "empty"}.supabase.co`,
    });
    const html = await response.text();
    const schemaMatch = html.match(/data-flashcast-edge-schema>([\s\S]*?)<\/script>/);

    expect(response.status).toBe(200);
    expect(schemaMatch?.[1]).toBeTruthy();
    const schema = JSON.parse(schemaMatch?.[1] || "{}");
    const service = schema["@graph"].find((node: Record<string, unknown>) => node["@type"] === "Service");
    const webPage = schema["@graph"].find((node: Record<string, unknown>) => node["@type"] === "WebPage");

    expect(service).toMatchObject({
      "@id": `https://flashcast.com.my/${lang}/services/bathroom#service`,
      name: lang === "zh" ? "浴室装修与防水工程" : "Bathroom Renovation and Waterproofing",
      serviceType: lang === "zh" ? "浴室装修与防水工程" : "Bathroom Renovation and Waterproofing",
      url: `https://flashcast.com.my/${lang}/services/bathroom`,
      provider: { "@id": "https://flashcast.com.my/#localbusiness" },
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: `https://flashcast.com.my/${lang}/quote`,
        servicePhone: {
          "@type": "ContactPoint",
          telephone: phone || "+601128853888",
        },
      },
    });
    expect(webPage.mainEntity).toEqual({ "@id": `https://flashcast.com.my/${lang}/services/bathroom#service` });
  });

  it("returns the manifest app shell when the blog metadata read reaches its timeout", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/site_settings")) {
        return new Response(JSON.stringify([{ updated_at: siteSettingsRevision }]), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.pathname.endsWith("/blog_posts")) {
        return new Promise<Response>((_resolve, reject) => {
          expect(init?.signal).toBeInstanceOf(AbortSignal);
          init?.signal?.addEventListener("abort", () => reject(new DOMException("timed out", "TimeoutError")), { once: true });
        });
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({ path: "/en/blog/renovation-permit-dbkl-guide" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-flashcast-edge-fallback")).toBe("manifest");
    expect(html).toContain("DBKL Renovation Permit");
    expect(html).not.toMatch(/502 Bad Gateway|Application error/i);
  }, 5_000);

  it("keeps genuinely unknown blog routes as 404 with noindex", async () => {
    const response = await requestPage({ path: "/en/blog/definitely-not-published" });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(response.headers.get("x-flashcast-edge-fallback")).toBeNull();
  });

  it("omits oversized public preload JSON and lets the client fetch on demand", async () => {
    const oversizedContent = "x".repeat(300 * 1024);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/site_settings")) {
        return new Response(JSON.stringify([{ updated_at: siteSettingsRevision }]), {
          headers: { "content-type": "application/json" },
        });
      }
      if (url.pathname.endsWith("/site_pages")) {
        return new Response(JSON.stringify([{
          id: "services-page",
          page_key: "services",
          path: "/services",
          title_en: "Services",
          title_zh: "服务项目",
          content_en: oversizedContent,
          updated_at: siteSettingsRevision,
        }]), { headers: { "content-type": "application/json" } });
      }
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({ path: "/en/services" });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-flashcast-public-data")).toBe("omitted-too-large");
    expect(html).not.toContain('id="flashcast-public-data"');
    expect(new TextEncoder().encode(html).byteLength).toBeLessThan(250 * 1024);
  });

  it("serves a fresh cache hit without querying Supabase again", async () => {
    const firstResponse = await requestPage();
    expect(firstResponse.headers.get("x-flashcast-html-cache")).toBe("miss");
    expect(firstResponse.headers.get("cache-tag")).toBe("flashcast-public-html");
    expect(firstResponse.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
    expect(firstResponse.headers.get("cdn-cache-control")).toBe("no-store");
    expect(firstResponse.headers.get("cloudflare-cdn-cache-control")).toBe("no-store");
    expect(firstResponse.headers.get("etag")).toMatch(/^"sha256-[a-f0-9]{64}"$/);
    expect(firstResponse.headers.get("last-modified")).toBeTruthy();
    await Promise.all(pendingTasks.splice(0));
    const cachedPublicHtml = edgeCache.getPublicHtmlEntry();
    expect(cachedPublicHtml?.headers.get("cache-control")).toBe("public, max-age=300");
    expect(cachedPublicHtml?.headers.get("cdn-cache-control")).toBe("public, max-age=300");
    const fetchesAfterMiss = supabaseFetch.mock.calls.length;
    expect(fetchesAfterMiss).toBeGreaterThan(0);

    const secondResponse = await requestPage();

    expect(secondResponse.headers.get("x-flashcast-html-cache")).toBe("hit");
    expect(secondResponse.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
    expect(secondResponse.headers.get("cdn-cache-control")).toBe("no-store");
    expect(supabaseFetch).toHaveBeenCalledTimes(fetchesAfterMiss);
  });

  it("returns 304 when the browser revalidates an unchanged cached page", async () => {
    const firstResponse = await requestPage();
    const etag = firstResponse.headers.get("etag");
    expect(etag).toBeTruthy();
    await Promise.all(pendingTasks.splice(0));

    const revalidatedResponse = await requestPage({ headers: { "if-none-match": etag || "" } });

    expect(revalidatedResponse.status).toBe(304);
    expect(revalidatedResponse.headers.get("etag")).toBe(etag);
    expect(revalidatedResponse.headers.get("x-flashcast-html-cache")).toBe("hit");
    expect(revalidatedResponse.headers.get("cache-control")).toBe("no-cache, max-age=0, must-revalidate");
    expect(await revalidatedResponse.text()).toBe("");
  });

  it("returns 304 through Last-Modified when an upstream proxy strips ETag", async () => {
    const firstResponse = await requestPage();
    const lastModified = firstResponse.headers.get("last-modified");
    expect(lastModified).toBeTruthy();
    await Promise.all(pendingTasks.splice(0));

    const revalidatedResponse = await requestPage({
      headers: { "if-modified-since": lastModified || "" },
    });

    expect(revalidatedResponse.status).toBe(304);
    expect(revalidatedResponse.headers.get("last-modified")).toBe(lastModified);
    expect(revalidatedResponse.headers.get("x-flashcast-html-cache")).toBe("hit");
    expect(await revalidatedResponse.text()).toBe("");
  });

  it("gives If-None-Match precedence over If-Modified-Since", async () => {
    const firstResponse = await requestPage();
    const lastModified = firstResponse.headers.get("last-modified");
    await Promise.all(pendingTasks.splice(0));

    const revalidatedResponse = await requestPage({
      headers: {
        "if-none-match": '"different-content"',
        "if-modified-since": lastModified || "",
      },
    });

    expect(revalidatedResponse.status).toBe(200);
  });

  it("serves stale HTML immediately and refreshes it in the background", async () => {
    const firstResponse = await requestPage();
    const etag = firstResponse.headers.get("etag");
    const lastModified = firstResponse.headers.get("last-modified");
    await Promise.all(pendingTasks.splice(0));
    edgeCache.expireFreshnessMarker();
    const fetchesBeforeRefresh = supabaseFetch.mock.calls.length;

    const staleResponse = await requestPage({ headers: { "if-none-match": etag || "" } });

    expect(staleResponse.status).toBe(304);
    expect(staleResponse.headers.get("x-flashcast-html-cache")).toBe("stale");
    expect(pendingTasks.length).toBeGreaterThan(0);
    await Promise.all(pendingTasks.splice(0));
    expect(supabaseFetch.mock.calls.length).toBeGreaterThan(fetchesBeforeRefresh);

    const refreshedResponse = await requestPage({ headers: { "if-none-match": etag || "" } });
    expect(refreshedResponse.status).toBe(304);
    expect(refreshedResponse.headers.get("etag")).toBe(etag);
    expect(refreshedResponse.headers.get("last-modified")).toBe(lastModified);
  });

  it("does not reuse cached HTML across deployments", async () => {
    const firstHtml = assetHtml.replace("</body>", '<span data-build="a"></span></body>');
    const secondHtml = assetHtml.replace("</body>", '<span data-build="b"></span></body>');
    await requestPage({ deploymentVersion: "commit-a", html: firstHtml });
    await Promise.all(pendingTasks.splice(0));

    const nextDeploymentResponse = await requestPage({ deploymentVersion: "commit-b", html: secondHtml });

    expect(nextDeploymentResponse.headers.get("x-flashcast-html-cache")).toBe("miss");
    expect(await nextDeploymentResponse.text()).toContain('data-build="b"');
  });

  it("preloads one responsive homepage art direction per viewport", async () => {
    const response = await requestPage({ path: "/zh" });
    const html = await response.text();

    expect(html).toContain('/images/_responsive/heroes/w360/v6/home-daylight-mobile.webp');
    expect(html).toContain('/images/_responsive/heroes/w720/v6/home-daylight-desktop.webp');
    expect(html).toContain('media="(max-width: 1023px)"');
    expect(html).toContain('media="(min-width: 1024px)"');
    expect(html).toContain('imagesizes="100vw"');
    expect(html).not.toContain('home-atelier-');
    expect(html).not.toContain('rel="preload" as="image" href="/images/heroes/hero-luxury-living.webp"');
  });

  it("starts the first two published homepage project images from the HTML", async () => {
    const imageUrl = (name: string) => `https://home-preload-test.supabase.co/storage/v1/object/public/site-images/${name}.webp`;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes("/rest/v1/rpc/get_public_home_bundle")
        ? JSON.stringify({ projects: ["featured", "supporting"].map((name) => ({
            slug: name,
            project_images: [{ image_type: "cover", sort_order: 0, image_url: imageUrl(name) }],
          })) })
        : url.includes("/rest/v1/site_settings")
          ? JSON.stringify([{ updated_at: siteSettingsRevision }])
          : "[]";
      return new Response(body, { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({ path: "/zh", supabaseUrl: "https://home-preload-test.supabase.co" });
    const html = await response.text();

    expect(html).toContain("/render/image/public/site-images/featured.webp?quality=86&amp;width=560&amp;height=1050&amp;format=webp");
    expect(html).toContain("/render/image/public/site-images/supporting.webp?quality=84&amp;width=360&amp;height=450&amp;resize=cover&amp;format=webp");
    expect(html).toContain('media="(max-width: 47.9375rem)" fetchpriority="low"');
    expect(html).toContain('media="(min-width: 48rem)" fetchpriority="low"');
    const preloads = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll('link[rel="preload"][as="image"]')];
    const featured = preloads.find((link) => link.getAttribute("href")?.includes("featured.webp"));
    const supportingMobile = preloads.find((link) => link.getAttribute("media") === "(max-width: 47.9375rem)");
    expect(featured?.getAttribute("imagesrcset")).toBe(buildSupabaseSrcSet(imageUrl("featured"), [560, 720, 960, 1200, 1600], { height: 1050, quality: 86 }));
    expect(supportingMobile?.getAttribute("imagesrcset")).toBe(buildSupabaseSrcSet(imageUrl("supporting"), [360, 560, 720, 960], { quality: 84, resize: "cover", targetAspectRatio: { width: 4, height: 5 } }));
  });

  it("starts the project detail hero and two related images from the HTML", async () => {
    const imageUrl = (name: string) => `https://detail-preload-test.supabase.co/storage/v1/object/public/site-images/${name}.webp`;
    const project = (slug: string) => ({
      slug,
      title_en: slug,
      title_zh: slug,
      project_images: [{ image_type: "cover", sort_order: 0, image_url: imageUrl(slug) }],
    });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const body = url.pathname.endsWith("/projects")
        ? url.searchParams.has("slug")
          ? JSON.stringify([project("detail")])
          : JSON.stringify([project("related-one"), project("detail"), project("related-two")])
        : url.pathname.endsWith("/site_settings")
          ? JSON.stringify([{ updated_at: siteSettingsRevision }])
          : "[]";
      return new Response(body, { headers: { "content-type": "application/json" } });
    }));

    const response = await requestPage({
      path: "/zh/projects/detail",
      supabaseUrl: "https://detail-preload-test.supabase.co",
    });
    const html = await response.text();

    expect(html).toContain("/render/image/public/site-images/detail.webp?quality=86&amp;width=560&amp;height=1100&amp;format=webp");
    expect(html).toContain("/render/image/public/site-images/related-one.webp?quality=82&amp;width=360&amp;height=750&amp;format=webp");
    expect(html).toContain("/render/image/public/site-images/related-two.webp?quality=82&amp;width=360&amp;height=540&amp;format=webp");
    expect((html.match(/fetchpriority="low"/g) || []).length).toBe(2);
    const preloads = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll('link[rel="preload"][as="image"]')];
    const hero = preloads.find((link) => link.getAttribute("href")?.includes("detail.webp"));
    expect(hero?.getAttribute("imagesrcset")).toBe(buildSupabaseSrcSet(imageUrl("detail"), [560, 720, 960, 1200, 1600], { height: 1100, quality: 86 }));
  });

  it("does not preload the homepage hero on non-home routes", async () => {
    const response = await requestPage({ path: "/zh/contact" });
    const html = await response.text();

    expect(html).not.toContain("data-flashcast-dynamic-image-preloads");
    expect(html).not.toContain("home-daylight-");
  });

  it("does not reuse cached HTML after the published content revision advances", async () => {
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const supabaseUrl = "https://revision.supabase.co";

    const firstResponse = await requestPage({ supabaseUrl });
    const firstEtag = firstResponse.headers.get("etag");
    await Promise.all(pendingTasks.splice(0));
    siteSettingsRevision = "2026-08-21T00:00:06.000Z";
    now += 6_000;

    const revisedResponse = await requestPage({
      supabaseUrl,
      headers: { "if-none-match": firstEtag || "" },
    });

    expect(revisedResponse.status).toBe(200);
    expect(revisedResponse.headers.get("x-flashcast-html-cache")).toBe("miss");
    expect(revisedResponse.headers.get("etag")).not.toBe(firstEtag);
  });
});
