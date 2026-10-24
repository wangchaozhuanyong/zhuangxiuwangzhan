import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";

afterEach(() => vi.unstubAllGlobals());

describe("public data marker cleaning with a fast no-op path", () => {
  it.each([
    ["Image-Rich Draft; works best when; warranty, and exclusions", "image-rich guide; works well when; after-sales terms, and exclusions"],
    ["FLASH CAST 店铺装修双语图文草案；双语图文草案；图文内容草案；图文草案；保修和不包含项目；第一印象；第一眼", "FLASH CAST 店铺装修与零售空间规划服务；双语服务指南；图文内容指南；服务规划指南；售后条款和不包含项目；入口观感；入口观感"],
    ["FLASH CAST image-rich draft for shop renovation and retail fit-out planning, including pre-opening preparation, customer flow, counter and storage planning, rendering concepts, FAQ, and consultation CTA.", "FLASH CAST plans shop renovation and retail fit-out for shoplots, retail stores, clinics, beauty front areas, F&B spaces, display flow, counter storage, material direction, and quotation preparation."],
    ["Bilingual shop renovation and retail fit-out planning content for FLASH CAST, covering", "Plan shop renovation and retail fit-out with FLASH CAST, covering"],
    ["已审核的沙发 & <script>safe</script> \u2028 🛋 https://example.invalid/reviewed.webp", "已审核的沙发 & <script>safe</script> \u2028 🛋 https://example.invalid/reviewed.webp"],
  ])("keeps existing rendered sanitization and safe JSON semantics: %s", async (input, expected) => {
    vi.stubGlobal("caches", undefined);
    vi.stubGlobal("fetch", vi.fn(async (value: RequestInfo | URL) => {
      const url = new URL(value instanceof Request ? value.url : String(value));
      return Response.json(url.pathname.endsWith("/site_settings") ? [{ company_name: input }] : []);
    }));
    const response = await onRequest({ request: new Request("https://flashcast.com.my/en/contact"),
      env: { VITE_SUPABASE_URL: `https://${Math.random().toString(36).slice(2)}.invalid`, VITE_SUPABASE_ANON_KEY: "fixture-public-placeholder",
        ASSETS: { fetch: async () => new Response('<html><head><title>Fixture</title></head><body><div id="root"></div></body></html>', { headers: { "content-type": "text/html" } }) } },
      next: vi.fn(),
    } as never);
    expect(response.status).toBe(200);
    const html = await response.text();
    const document = new DOMParser().parseFromString(html, "text/html");
    const seed = JSON.parse(document.querySelector("#flashcast-public-data")!.textContent!);
    expect(seed.siteSettings.company_name).toBe(expected);
    expect(document.querySelectorAll("script")).toHaveLength(2);
    expect(html).not.toContain("<script>safe</script>");
  });
});
