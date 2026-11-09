import { afterEach, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
let sequence = 0;
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([
  ["/en", "/logo-flashcast.webp", "/logo-flashcast-20260605.webp?v=revision-1"],
  ["/zh", "/custom-logo.webp?size=small", "/custom-logo.webp?size=small&v=revision-1"],
  ["/ms", "https://media.example/custom.webp", "https://media.example/custom.webp?v=revision-1"],
  ["/en", "", null],
  ["/en/contact", "/logo-flashcast.webp", null],
])("preloads the published header logo only for the home document: %s %s", async (route, logo, expected) => {
  const api = `https://logo-${++sequence}.invalid`;
  vi.stubGlobal("caches", undefined);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.origin).toBe(api);
    if (url.pathname.endsWith("/site_settings")) return Response.json([{ company_name: "FLASH CAST", logo_url: logo, updated_at: "revision-1" }]);
    if (url.pathname.endsWith("/rpc/get_public_home_bundle")) return Response.json({ site_pages: [] });
    return Response.json([]);
  }));
  const response = await onRequest({ request: new Request(`https://flashcast.com.my${route}`),
    env: { VITE_SUPABASE_URL: api, VITE_SUPABASE_ANON_KEY: "synthetic-public-fixture", CF_PAGES_COMMIT_SHA: `logo-${sequence}`,
      ASSETS: { fetch: async () => new Response('<html><head></head><body><div id="root"></div></body></html>', { headers: { "content-type": "text/html" } }) } }, next: vi.fn() } as never);
  expect(response.status).toBe(200);
  const doc = new DOMParser().parseFromString(await response.text(), "text/html");
  const logos = [...doc.querySelectorAll('link[rel="preload"][as="image"]')].filter(link => link.getAttribute("href")?.includes("logo") || link.getAttribute("href")?.includes("media.example"));
  expect(logos.map(link => link.getAttribute("href"))).toEqual(expected ? [expected] : []);
  if (expected) expect(logos[0].getAttribute("fetchpriority")).toBe("high");
});
