import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

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

  beforeEach(() => {
    edgeCache.clear();
    siteSettingsRevision = "2026-08-21T00:00:00.000Z";
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
  }: {
    deploymentVersion?: string;
    html?: string;
    path?: string;
    supabaseUrl?: string;
    headers?: HeadersInit;
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
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        },
      },
      next: async () => new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
      waitUntil: (promise: Promise<unknown>) => pendingTasks.push(promise),
    } as never);
  };

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
    ["/en/landing/office-renovation", "/en/services/office-renovation"],
    ["/zh/landing/kitchen-cabinet?source=legacy", "/zh/services/kitchen?source=legacy"],
    ["/en/landing/warehouse-shelving/", "/en/services/warehouse"],
  ])("permanently redirects %s to the mapped service path", async (path, expectedPath) => {
    const response = await onRequest({
      request: new Request(`https://flashcast.com.my${path}`),
      env: {},
      next: async () => new Response("not used"),
    } as never);

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://flashcast.com.my${expectedPath}`);
  });

  it("keeps the flooring landing page outside the redirect set", async () => {
    const next = vi.fn(async () => new Response("landing page"));
    const response = await onRequest({
      request: new Request("https://flashcast.com.my/en/landing/flooring"),
      env: {},
      next,
    } as never);

    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledOnce();
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

    expect(html).toContain('/images/_responsive/heroes/w360/v4/home-atelier-mobile.webp');
    expect(html).toContain('/images/_responsive/heroes/w560/v4/home-atelier-tablet.webp');
    expect(html).toContain('/images/_responsive/heroes/w720/v4/home-atelier-desktop.webp');
    expect(html).toContain('media="(max-width: 767px)"');
    expect(html).toContain('media="(min-width: 768px) and (max-width: 1179px)"');
    expect(html).toContain('media="(min-width: 1180px)"');
    expect(html).toContain('imagesizes="(min-width: 90rem) max(58vw, 178vh), (min-width: 73.75rem) max(60vw, 178vh), 100vw"');
    expect(html).not.toContain('imagesizes="(min-width: 1440px) 58vw, 60vw"');
    expect(html).not.toContain('rel="preload" as="image" href="/images/heroes/hero-luxury-living.webp"');
  });

  it("does not preload the homepage hero on non-home routes", async () => {
    const response = await requestPage({ path: "/zh/contact" });
    const html = await response.text();

    expect(html).not.toContain("data-flashcast-dynamic-image-preloads");
    expect(html).not.toContain("home-atelier-");
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
