import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const JSDOM = createRequire(import.meta.url)("jsdom").JSDOM as new (html: string) => {
  window: { document: Document; close: () => void };
};

const shell = '<!doctype html><html><head><title>App</title></head><body><div id="root"></div></body></html>';

const render = async (pathname: string) => {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith("/service_areas")) {
      return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
  }));

  const response = await onRequest({
    request: new Request(`https://flashcast.com.my${pathname}`),
    env: {
      VITE_SUPABASE_URL: "https://hub-test-fixture.supabase.co",
      VITE_SUPABASE_ANON_KEY: "fixture-anon-key",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }) },
    },
    next: async () => new Response(shell),
  } as Parameters<typeof onRequest>[0]);

  const html = await response.text();
  return { response, html };
};

describe("middleware locations hub pre-injection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("satisfies the curl acceptance criteria on /en/locations", async () => {
    const { response, html } = await render("/en/locations");
    expect(response.status).toBe(200);

    // 1. data-flashcast-readable-body marker present
    const markerCount = (html.match(/data-flashcast-readable-body/g) || []).length;
    expect(markerCount).toBe(1);

    // 2. Exactly 30 regional page links in initial HTML (user curl test)
    const matches = [...html.matchAll(/href="\/en\/locations\/[a-z0-9-]+"/g)].map(m => m[0]);
    const unique = new Set(matches);
    expect(unique.size).toBe(30);

    // 3. Visible body text length >= 2,000 characters
    const dom = new JSDOM(html);
    const main = dom.window.document.querySelector("main[data-flashcast-readable-body]");
    expect(main).not.toBeNull();
    const textLength = main?.textContent?.trim().length || 0;
    expect(textLength).toBeGreaterThanOrEqual(2000);
    dom.window.close();
  });

  it("satisfies the curl acceptance criteria on /zh/locations", async () => {
    const { response, html } = await render("/zh/locations");
    expect(response.status).toBe(200);

    const markerCount = (html.match(/data-flashcast-readable-body/g) || []).length;
    expect(markerCount).toBe(1);

    const matches = [...html.matchAll(/href="\/zh\/locations\/[a-z0-9-]+"/g)].map(m => m[0]);
    const unique = new Set(matches);
    expect(unique.size).toBe(30);

    const dom = new JSDOM(html);
    const main = dom.window.document.querySelector("main[data-flashcast-readable-body]");
    const textLength = main?.textContent?.trim().length || 0;
    expect(textLength).toBeGreaterThanOrEqual(1200);
    dom.window.close();
  });
});
