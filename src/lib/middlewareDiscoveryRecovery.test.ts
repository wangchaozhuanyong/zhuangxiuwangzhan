import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const withdrawn = "https://flashcast.com.my/en/blog/withdrawn-post";
const current = "https://flashcast.com.my/en/blog/current-published-post";
const asset = `<urlset><url><loc>${withdrawn}</loc></url></urlset>`;
const env = {
  VITE_SUPABASE_URL: "https://discovery-recovery.supabase.co",
  VITE_SUPABASE_ANON_KEY: "fixture-public-key",
  ASSETS: { fetch: async () => new Response(asset) },
};
type Failure = () => Response | never;
const invoke = (pathname = "/sitemap.xml") => onRequest({
  request: new Request(`https://flashcast.com.my${pathname}`), env,
  next: async () => new Response(""),
} as Parameters<typeof onRequest>[0]);
const completeRows = (url: URL) => url.searchParams.has("id") ? [] : [{
  id: "current", slug: "current-published-post", status: "published",
  title_en: "Current post", content_en: "Current published source body",
}];

afterEach(() => vi.unstubAllGlobals());

describe("fresh public discovery recovery", () => {
  it.each<[string, Failure]>([
    ["503", () => new Response("unavailable", { status: 503 })],
    ["network", () => { throw new TypeError("fetch failed"); }],
    ["timeout", () => { throw new DOMException("read deadline", "TimeoutError"); }],
  ])("recovers one transient %s failure without reviving withdrawn URLs", async (_label, fail) => {
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (!url.pathname.endsWith("/blog_posts")) return new Response("[]");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      if (!url.searchParams.has("id") && ++attempts === 1) return fail();
      return new Response(JSON.stringify(completeRows(url)));
    }));
    const response = await invoke();
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain(current);
    expect(body).not.toContain(withdrawn);
    expect(attempts).toBe(2);
  });

  it.each<[string, Failure]>([
    ["403", () => new Response("forbidden", { status: 403 })],
    ["429", () => new Response("limited", { status: 429 })],
    ["invalid JSON", () => new Response("broken JSON")],
    ["non-array JSON", () => new Response("{}")],
    ["invalid published row", () => new Response('[{"id":"x","status":"published","slug":"wrong/path"}]')],
  ])("does not retry %s and fails closed", async (_label, fail) => {
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (!new URL(String(input)).pathname.endsWith("/blog_posts")) return new Response("[]");
      attempts++;
      return fail();
    }));
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain(withdrawn);
    expect(attempts).toBe(1);
  });

  it("limits recovery to one retry and does not expose an incomplete snapshot", async () => {
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (!new URL(String(input)).pathname.endsWith("/blog_posts")) return new Response("[]");
      attempts++;
      return new Response("unavailable", { status: 502 });
    }));
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(withdrawn);
    expect(attempts).toBe(2);
  });

  it("recovers a later keyset page while retaining all completed current rows", async () => {
    let terminalAttempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (!url.pathname.endsWith("/blog_posts")) return new Response("[]");
      if (url.searchParams.has("id") && ++terminalAttempts === 1) return new Response("unavailable", { status: 504 });
      return new Response(JSON.stringify(completeRows(url)));
    }));
    const response = await invoke();
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(current);
    expect(terminalAttempts).toBe(2);
  });

  it.each(["/sitemap.xml", "/llms.txt"])("recovers the furniture visibility read for %s", async (pathname) => {
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/home_sections") && ++attempts === 1) throw new TypeError("fetch failed");
      return new Response("[]");
    }));
    const response = await invoke(pathname);
    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
  });
});
