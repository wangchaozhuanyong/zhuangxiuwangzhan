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

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("fresh public discovery recovery", () => {
  it("leaves a connection slot for the static asset while reading every public source", async () => {
    let pendingHeaders = 0;
    let maximum = 0;
    const tables = new Set<string>();
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      tables.add(new URL(String(input)).pathname.split("/").at(-1)!);
      maximum = Math.max(maximum, ++pendingHeaders);
      await Promise.resolve();
      pendingHeaders--;
      return new Response("[]");
    }));
    expect((await invoke()).status).toBe(200);
    expect(tables.size).toBe(9);
    expect(maximum).toBeLessThanOrEqual(5);
  });

  it("starts deadlines after application queuing instead of exhausting retries in a six-header-connection runtime", async () => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, "timeout").mockImplementation((milliseconds) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException("read deadline", "TimeoutError")), milliseconds);
      return controller.signal;
    });
    let active = 0;
    const queued: (() => void)[] = [];
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
      const url = new URL(String(input));
      let started = false;
      let ended = false;
      let timer: ReturnType<typeof setTimeout>;
      const release = () => {
        ended = true;
        if (started) active--;
        while (active < 6 && queued.length) queued.shift()!();
      };
      const start = () => {
        if (ended) return;
        started = true;
        active++;
        timer = setTimeout(() => {
          release();
          const empty = url.pathname.endsWith("/home_sections") || url.searchParams.has("id");
          resolve(new Response(JSON.stringify(empty ? [] : [{
            id: "current", status: "published", slug: "runtime-fixture", path: "/runtime-fixture",
            title_en: "Published fixture", content_en: "Published source body",
          }])));
        }, 1400);
      };
      init?.signal?.addEventListener("abort", () => {
        if (ended) return;
        clearTimeout(timer);
        release();
        reject(init.signal?.reason);
      }, { once: true });
      if (active < 6) start(); else queued.push(start);
    })));
    const pending = invoke();
    await vi.advanceTimersByTimeAsync(20_000);
    expect((await pending).status).toBe(200);
  });

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
  ])("does not retry %s and fails closed", async (label, fail) => {
    let attempts = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (!new URL(String(input)).pathname.endsWith("/blog_posts")) return new Response("[]");
      attempts++;
      return fail();
    }));
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const code = label === "invalid published row" ? "invalid-source"
      : label.includes("JSON") ? "invalid-response" : "http";
    expect(response.headers.get("x-flashcast-edge-fallback")).toBe(`discovery-${code}`);
    expect(response.headers.get("x-flashcast-discovery-source")).toBe("blog_posts");
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
    expect(response.headers.get("x-flashcast-discovery-status")).toBe("502");
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

  it("classifies missing runtime configuration without exposing credential values", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]")));
    const response = await onRequest({ request: new Request("https://flashcast.com.my/sitemap.xml"),
      env: { ...env, VITE_SUPABASE_ANON_KEY: undefined }, next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(503);
    expect(response.headers.get("x-flashcast-edge-fallback")).toBe("discovery-configuration");
    expect(await response.text()).toBe("Public discovery temporarily unavailable.");
    expect(JSON.stringify([...response.headers])).not.toContain(env.VITE_SUPABASE_ANON_KEY);
  });

  it("classifies a settings read failure separately from a content source", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => new Response(
      new URL(String(input)).pathname.endsWith("/home_sections") ? "unavailable" : "[]",
      { status: new URL(String(input)).pathname.endsWith("/home_sections") ? 503 : 200 },
    )));
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(response.headers.get("x-flashcast-edge-fallback")).toBe("discovery-http");
    expect(response.headers.get("x-flashcast-discovery-source")).toBe("furniture-settings");
    expect(response.headers.get("x-flashcast-discovery-status")).toBe("503");
  });

  it("does not expose an unclassified provider exception in headers, body or logs", async () => {
    const privateMessage = "private-provider-detail-not-for-browser";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]")));
    const response = await onRequest({ request: new Request("https://flashcast.com.my/sitemap.xml"),
      env: { ...env, ASSETS: { fetch: async () => { throw new Error(privateMessage); } } },
      next: async () => new Response("") } as Parameters<typeof onRequest>[0]);
    expect(response.status).toBe(503);
    expect(response.headers.get("x-flashcast-edge-fallback")).toBe("discovery-unclassified");
    expect(JSON.stringify([...response.headers]) + await response.text() + JSON.stringify(warn.mock.calls)).not.toContain(privateMessage);
  });
});
