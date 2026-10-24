import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

type Mode = "published" | "empty" | "failed";
const shell = '<!doctype html><html><head><title>App</title></head><body><div id="root"></div></body></html>';
let sequence = 0;
beforeEach(() => vi.stubGlobal("caches", undefined));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function render(language: string, path: string, mode: Mode) {
  const origin = `https://footer-cta-${++sequence}.invalid`;
  const blockKey = path ? "about_final" : "home_final";
  const ctaRequests: URL[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    expect(url.origin).toBe(origin);
    if (url.pathname.endsWith("/site_settings")) return Response.json([{ company_name: "FLASH CAST" }]);
    if (url.pathname.endsWith("/rpc/get_public_home_bundle")) return Response.json({ site_pages: [] });
    if (url.pathname.endsWith("/cta_blocks")) {
      ctaRequests.push(url);
      expect(url.searchParams.get("status")).toBe("eq.published");
      expect(url.searchParams.get("block_key")).toBe(`eq.${blockKey}`);
      expect(url.searchParams.get("limit")).toBe("1");
      if (mode === "failed") return new Response("Unavailable", { status: 503 });
      return Response.json(mode === "empty" ? [] : [{
        id: "published-invitation", block_key: blockKey, status: "published",
        title_en: "Start your renovation", title_zh: "开始装修", title_ms: "Mulakan renovasi",
        primary_label_en: "Get quote", primary_label_zh: "获取报价", primary_label_ms: "Dapatkan sebut harga",
        primary_url: "/quote", image_url: "/invitation.webp", internal_note: "PRIVATE_CTA_FIXTURE",
      }]);
    }
    return Response.json([]);
  });
  vi.stubGlobal("fetch", fetcher);
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my/${language}${path}`),
    env: { VITE_SUPABASE_URL: origin, VITE_SUPABASE_ANON_KEY: "fixture-public-placeholder", CF_PAGES_COMMIT_SHA: `footer-${sequence}`, ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) } },
    next: vi.fn(),
  } as never);
  const body = await response.text();
  const document = new DOMParser().parseFromString(body, "text/html");
  const payload = JSON.parse(document.getElementById("flashcast-public-data")?.textContent || "{}");
  expect(response.status).toBe(200);
  expect(body).not.toContain("PRIVATE_CTA_FIXTURE");
  return { payload, ctaRequests, blockKey, fetcher };
}

describe("managed footer CTA HTML preloading", () => {
  it.each(["en", "zh", "ms"].flatMap(language => ["", "/about"].map(path => ({ language, path }))))("seeds the owning page and language: $language$path", async ({ language, path }) => {
    const { payload, ctaRequests, blockKey } = await render(language, path, "published");
    expect(ctaRequests).toHaveLength(1);
    expect(payload.ctaBlocks).toHaveProperty(blockKey);
    expect(Object.keys(payload.ctaBlocks)).toEqual([blockKey]);
    expect(payload.ctaBlocks[blockKey].title_ms).toBe("Mulakan renovasi");
  });

  it.each(["", "/about"])("records confirmed empty content so hydration does not query it again: %s", async path => {
    const { payload, blockKey } = await render("en", path, "empty");
    expect(payload.ctaBlocks).toEqual({ [blockKey]: null });
    const previous = document.body.innerHTML;
    try {
      vi.resetModules();
      const node = document.createElement("script"); node.id = "flashcast-public-data"; node.type = "application/json"; node.textContent = JSON.stringify(payload); document.body.replaceChildren(node);
      const { getPublicQuerySeed } = await import("@/lib/publicQuerySeed");
      expect(getPublicQuerySeed(["published", "cta", "en", blockKey])).toBeNull();
      expect(getPublicQuerySeed(["published", "cta", "en", "unread_key"])).toBeUndefined();
    } finally { document.body.innerHTML = previous; }
  });

  it.each(["", "/about"])("omits an unsuccessful read so client recovery remains available: %s", async path => {
    const { payload, ctaRequests } = await render("en", path, "failed");
    expect(ctaRequests).toHaveLength(1);
    expect(payload).not.toHaveProperty("ctaBlocks");
  });
});
