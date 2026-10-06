import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const xml = (locations: string[]) => `<urlset>${locations.map((location) => `<url><loc>${location}</loc></url>`).join("")}</urlset>`;
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
      if (url.pathname.endsWith("/rest/v1/blog_posts") && !url.searchParams.has("id")) return new Response(JSON.stringify([{id:"current",slug:"current-published-post",status:"published",title_en:"Current post",content_en:"Published source body"}]));
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

  it.each([
    ["503", () => new Response("unavailable", { status: 503 })],
    ["empty response", () => new Response("")],
    ["non-array response", () => new Response("{}")],
    ["invalid source row", () => new Response('[{"id":"invalid","slug":"wrong/path","status":"published"}]')],
  ])("returns 503 rather than revive static blog URLs for %s source failure", async (_label, response) => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith("/rest/v1/blog_posts")) return response();
      return new Response("[]", { headers: { "content-type": "application/json" } });
    }));
    const staticXml = xml([staticAbout, withdrawn]);
    const assets = { fetch: async () => new Response(staticXml) };
    const result = await onRequest({ request: new Request("https://flashcast.com.my/sitemap.xml"), env: { ...env, ASSETS: assets }, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
    expect(result.status).toBe(503);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.text()).not.toContain(withdrawn);
  });
});
