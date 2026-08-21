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
}

const originalCachesDescriptor = Object.getOwnPropertyDescriptor(globalThis, "caches");

describe("public Edge HTML cache", () => {
  const edgeCache = new MemoryEdgeCache();
  const pendingTasks: Promise<unknown>[] = [];
  const supabaseFetch = vi.fn(async () => new Response("[]", {
    status: 200,
    headers: { "content-type": "application/json" },
  }));
  const assetHtml = "<!doctype html><html><head><title>FLASH CAST</title></head><body><div id=\"root\"></div></body></html>";

  beforeEach(() => {
    edgeCache.clear();
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
  }: { deploymentVersion?: string; html?: string; path?: string } = {}) => {
    const request = new Request(`https://flashcast.com.my${path}`);
    return onRequest({
      request,
      env: {
        CF_PAGES_COMMIT_SHA: deploymentVersion,
        VITE_SUPABASE_URL: "https://example.supabase.co",
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

  it("serves a fresh cache hit without querying Supabase again", async () => {
    const firstResponse = await requestPage();
    expect(firstResponse.headers.get("x-flashcast-html-cache")).toBe("miss");
    await Promise.all(pendingTasks.splice(0));
    const fetchesAfterMiss = supabaseFetch.mock.calls.length;
    expect(fetchesAfterMiss).toBeGreaterThan(0);

    const secondResponse = await requestPage();

    expect(secondResponse.headers.get("x-flashcast-html-cache")).toBe("hit");
    expect(supabaseFetch).toHaveBeenCalledTimes(fetchesAfterMiss);
  });

  it("serves stale HTML immediately and refreshes it in the background", async () => {
    await requestPage();
    await Promise.all(pendingTasks.splice(0));
    edgeCache.expireFreshnessMarker();
    const fetchesBeforeRefresh = supabaseFetch.mock.calls.length;

    const staleResponse = await requestPage();

    expect(staleResponse.headers.get("x-flashcast-html-cache")).toBe("stale");
    expect(pendingTasks.length).toBeGreaterThan(0);
    await Promise.all(pendingTasks.splice(0));
    expect(supabaseFetch.mock.calls.length).toBeGreaterThan(fetchesBeforeRefresh);
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
    expect(html).not.toContain('rel="preload" as="image" href="/images/heroes/hero-luxury-living.webp"');
  });
});
