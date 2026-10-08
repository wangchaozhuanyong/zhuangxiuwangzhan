import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

const JSDOM = createRequire(import.meta.url)("jsdom").JSDOM as new (html: string) => {
  window: { document: Document; close: () => void };
};
const shell = '<!doctype html><html><head><title>App</title></head><body><div id="root"></div></body></html>';
let fixtureId = 0;
const render = async (path: string, settings: Record<string, string>, fail = false) => {
  let selectedFields: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith("/site_settings")) {
      selectedFields = (url.searchParams.get("select") || "").split(",");
      return new Response(JSON.stringify([settings]), { status: fail ? 503 : 200 });
    }
    return new Response("[]", { headers: { "content-type": "application/json" } });
  }));
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my${path}`),
    env: {
      VITE_SUPABASE_URL: `https://social-${++fixtureId}.invalid`,
      VITE_SUPABASE_ANON_KEY: "fixture-public-key",
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }) },
    },
    next: async () => new Response(shell),
  } as Parameters<typeof onRequest>[0]);
  const dom = new JSDOM(await response.text());
  const document = dom.window.document;
  const graph = JSON.parse(document.querySelector("script[data-flashcast-edge-schema]")?.textContent || "{}")["@graph"] as Record<string, unknown>[];
  const result = {
    status: response.status,
    selectedFields,
    sameAs: graph.find(node => node["@id"] === "https://flashcast.com.my/#localbusiness")?.sameAs,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
  };
  dom.window.close();
  return result;
};

afterEach(() => vi.unstubAllGlobals());

describe("Edge SEO configured social profiles", () => {
  const profiles = {
    facebook_url: "https://www.facebook.com/flashcast111",
    instagram_url: "https://www.instagram.com/flashcast2025/",
    tiktok_url: "https://www.tiktok.com/@flashcast121",
    xiaohongshu_url: "https://www.xiaohongshu.com/user/profile/62088ac5000000001000ac0a",
  };
  it.each(["/zh", "/en"])("reads all four settings for the business identity on %s", async path => {
    const result = await render(path, profiles);
    expect(result.status).toBe(200);
    expect(result.selectedFields).toEqual(expect.arrayContaining(Object.keys(profiles)));
    expect(result.sameAs).toEqual(Object.values(profiles));
    expect(result.canonical).toBe(`https://flashcast.com.my${path}`);
  });
  it("reads changed accounts without a build-time account snapshot", async () => {
    const updated = { ...profiles, instagram_url: "https://www.instagram.com/new_account/" };
    expect((await render("/zh", updated)).sameAs).toEqual(Object.values(updated));
  });
  it("does not advertise cleared, unsafe or unavailable accounts", async () => {
    expect((await render("/zh", { facebook_url: "", instagram_url: "", tiktok_url: "", xiaohongshu_url: "" })).sameAs).toEqual([]);
    expect((await render("/zh", { facebook_url: "https://evil.example/profile", instagram_url: "javascript:alert(1)", tiktok_url: "https://www.tiktok.com/explore" })).sameAs).toEqual([]);
    expect((await render("/zh", profiles, true)).sameAs).toEqual([]);
  });
});
