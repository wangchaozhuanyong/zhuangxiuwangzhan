import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const xml = (locations: string[]) => `<urlset>${locations.map((location) => `<url><loc>${location}</loc></url>`).join("")}</urlset>`;
const completeXml = (locations: string[], generatedAt = new Date().toISOString()) => `<?xml version="1.0"?>\n<!-- flashcast-sitemap-snapshot:v1 complete=true generated-at="${generatedAt}" -->\n${xml(locations)}`;
const withdrawn = "https://flashcast.com.my/en/blog/renovation-materials-malaysia";
const current = "https://flashcast.com.my/en/blog/current-published-post";
const staticAbout = "https://flashcast.com.my/en/about";
const shell = '<!doctype html><html lang="en"><head><title>App</title></head><body><div id="root"></div></body></html>';
const env = { VITE_SUPABASE_URL: "https://fixture.supabase.co", VITE_SUPABASE_ANON_KEY: "fixture-public-key", ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) } };

afterEach(() => vi.unstubAllGlobals());

describe("withdrawn published-blog source", () => {
  it("returns 404/noindex for a successful exact published-row miss", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { headers: { "content-type": "application/json" } })));
    const response = await onRequest({ request: new Request("https://flashcast.com.my/en/blog/renovation-materials-malaysia"), env, next: async () => new Response(shell) } as Parameters<typeof onRequest>[0]);
    const html = await response.text();
    expect(response.status).toBe(404);
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toContain(`rel="canonical" href="${withdrawn}"`);
  });

  it("removes a stale generated blog URL when the fresh published sitemap omits it", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith("/functions/v1/sitemap")) return new Response(completeXml([staticAbout, current]), { headers: { "content-type": "application/xml" } });
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));
    const staticXml = xml([staticAbout, withdrawn]);
    const assets = { fetch: async (assetRequest: Request) => assetRequest.url.endsWith("/sitemap.xml")
      ? new Response(staticXml, { headers: { "content-type": "application/xml" } })
      : new Response(shell, { headers: { "content-type": "text/html" } }) };
    const request = new Request("https://flashcast.com.my/sitemap.xml");
    const response = await onRequest({ request, env: { ...env, ASSETS: assets }, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
    const sitemap = await response.text();
    expect(response.status).toBe(200);
    expect(sitemap).toContain(staticAbout);
    expect(sitemap).toContain(current);
    expect(sitemap).not.toContain(withdrawn);
    expect(sitemap).not.toContain("flashcast.com/en/");
  });

  it("keeps static blog URLs when a partial 200 snapshot has no completeness proof", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith("/functions/v1/sitemap")) return new Response(xml([staticAbout, current]), { headers: { "content-type": "application/xml" } });
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));
    const staticXml = xml([staticAbout, withdrawn]);
    const assets = { fetch: async () => new Response(staticXml, { headers: { "content-type": "application/xml" } }) };
    const response = await onRequest({ request: new Request("https://flashcast.com.my/sitemap.xml"), env: { ...env, ASSETS: assets }, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(withdrawn);
  });

  it.each([[5_000, true], [5_001, false]])("checks the source clock skew boundary at %i ms", async (skew, accepted) => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    try {
      vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (url.pathname.endsWith("/functions/v1/sitemap")) return new Response(completeXml([staticAbout, current], new Date(now + skew).toISOString()));
        return new Response("[]", { headers: { "content-type": "application/json" } });
      }));
      const assets = { fetch: async () => new Response(xml([staticAbout, withdrawn]), { headers: { "content-type": "application/xml" } }) };
      const response = await onRequest({ request: new Request("https://flashcast.com.my/sitemap.xml"), env: { ...env, ASSETS: assets }, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
      const sitemap = await response.text();
      expect(sitemap).toContain(current);
      expect(sitemap.includes(withdrawn)).toBe(!accepted);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it.each([
    ["503", new Response("unavailable", { status: 503 })],
    ["empty 200", new Response("")],
    ["wrong-host 200", new Response(completeXml(["https://example.com/en/blog/other"]))],
    ["stale complete snapshot", new Response(completeXml([staticAbout, current], "2020-01-01T00:00:00.000Z"))],
    ["far-future complete snapshot", new Response(completeXml([staticAbout, current], "2099-01-01T00:00:00.000Z"))],
  ])("keeps static blog URLs for %s dynamic fallback", async (_label, dynamicResponse) => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith("/functions/v1/sitemap")) return dynamicResponse;
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));
    const staticXml = xml([staticAbout, withdrawn]);
    const assets = { fetch: async () => new Response(staticXml, { headers: { "content-type": "application/xml" } }) };
    const response = await onRequest({ request: new Request("https://flashcast.com.my/sitemap.xml"), env: { ...env, ASSETS: assets }, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(withdrawn);
  });
});
