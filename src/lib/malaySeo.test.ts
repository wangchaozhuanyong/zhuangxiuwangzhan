import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

afterEach(() => vi.unstubAllGlobals());

describe("Malay Edge HTML", () => {
  it.each([true, false])("serves native metadata and gates discovery for a complete=%s translation", async (complete) => {
    const row = {
      id: "malay-article", status: "published", slug: "malay-fixture", title_en: "English article", title_zh: "中文文章",
      title_ms: "Panduan rumah", excerpt_en: "English summary", excerpt_ms: "Ringkasan rumah",
      content_en: "<p>Original English body</p>", content_ms: complete ? "<p>Kandungan Bahasa Melayu</p>" : null,
      seo_title_ms: "Panduan pengubahsuaian", seo_description_ms: "Panduan rumah di Kuala Lumpur.",
      cover_image_url: "/fixture.webp", alt_ms: "Ruang rumah", updated_at: "2026-10-18T00:00:00Z",
    };
    const requests: URL[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input)); requests.push(url);
      const data = url.pathname.endsWith("/blog_posts") && !url.searchParams.get("id")?.startsWith("gt.") ? [row] : [];
      return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
    }));
    const html = "<!doctype html><html><head><title>FLASH CAST</title></head><body><div id=\"root\"></div></body></html>";
    const asset = () => Promise.resolve(new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }));
    const response = await onRequest({
      request: new Request("https://flashcast.com.my/ms/blog/malay-fixture"),
      env: { VITE_SUPABASE_URL: `https://malay-${complete}.supabase.co`, VITE_SUPABASE_ANON_KEY: "synthetic-public-fixture", ASSETS: { fetch: asset } },
      next: asset,
    } as never);
    const document = await response.text();
    expect(response.status).toBe(200);
    expect(document).toContain('lang="ms-MY"');
    expect(document).toContain("Panduan pengubahsuaian");
    expect(document).toContain("https://flashcast.com.my/ms/blog/malay-fixture");
    expect(document.includes("noindex")).toBe(!complete);
    expect(document.includes('hreflang="ms-MY"')).toBe(complete);
    expect(requests.find((url) => url.pathname.endsWith("/blog_posts"))?.searchParams.get("select")).toContain("title_ms");
    // Site settings retain their existing bilingual address schema.
    expect(requests.find((url) => url.pathname.endsWith("/site_settings"))?.searchParams.get("select")).not.toContain("address_ms");
  });
});
