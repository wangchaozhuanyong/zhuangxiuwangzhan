import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

afterEach(() => vi.unstubAllGlobals());
async function seed(path: string, failure: "none" | "page" | "gallery" | "malay-readable") {
  vi.stubGlobal("caches", undefined);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname.endsWith("/site_settings")) return Response.json([{ id: "default", company_name: "FLASH CAST" }]);
    if (failure === "page" && url.pathname.endsWith("/site_pages") && url.searchParams.get("page_key") === "eq.contact") return new Response("Unavailable", { status: 503 });
    if (failure === "gallery" && url.pathname.endsWith("/material_images")) return new Response("Unavailable", { status: 503 });
    if (failure === "malay-readable" && url.pathname.endsWith("/services") && url.searchParams.get("slug") === "eq.renovation") return Response.json([{ id: "service", slug: "renovation", status: "published", title_en: "Renovation", title_ms: "Renovasi", content_en: "Full original service", content_ms: "Badan perkhidmatan asal", suitable_for_ms: ["Rumah"] }]);
    if (url.pathname.endsWith("/materials")) return Response.json([{ id: "material", slug: "spc-flooring-natural-oak", status: "published", category: "Flooring", price_mode: "reference", title_en: "Natural oak", excerpt_en: "Oak flooring", content_en: "Published flooring body", suitable_spaces_en: ["Home"], seo_title_en: "Oak flooring" }]);
    return Response.json([]);
  }));
  const shell = '<html><head><title>Fixture</title></head><body><div id="root"></div></body></html>';
  const response = await onRequest({ request: new Request(`https://flashcast.com.my${path}`), env: { VITE_SUPABASE_URL: `https://recovery-${failure}-${Math.random().toString(36).slice(2)}.invalid`, VITE_SUPABASE_ANON_KEY: "public-fixture", ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) } }, next: vi.fn() } as never);
  const document = new DOMParser().parseFromString(await response.text(), "text/html");
  return JSON.parse(document.getElementById("flashcast-public-data")?.textContent || "{}");
}

describe("failed HTML reads retain client recovery", () => {
  it("omits a failed contact bundle instead of creating successful empty data", async () => {
    const payload = await seed("/en/contact", "page");
    expect(payload.sitePages).toBeUndefined();
  });
  it("keeps a confirmed empty contact bundle authoritative", async () => {
    const payload = await seed("/en/contact", "none");
    expect(payload.sitePages).toEqual({ contact: {} });
  });
  it("does not seed a detail with a fabricated empty gallery after a failed read", async () => {
    const payload = await seed("/en/materials/spc-flooring-natural-oak", "gallery");
    expect(payload.materials).toBeUndefined();
    expect(payload.materialDetailContext).toBeUndefined();
  });
  it("retains a successful Malay detail during readable HTML generation", async () => {
    const payload = await seed("/ms/services/renovation", "malay-readable");
    expect(payload.serviceDetails?.renovation).toMatchObject({ content_ms: "Badan perkhidmatan asal", preload_language: "ms" });
    expect(payload.serviceDetails?.renovation).not.toHaveProperty("content_en");
  });
});
