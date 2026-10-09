import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../functions/_middleware";
import { notFoundPageText } from "../i18n/notFoundPageText";

const shell = '<!doctype html><html lang="en"><head><title>App</title><link rel="canonical" href="https://flashcast.com.my/en"><link rel="alternate" hreflang="en" href="https://flashcast.com.my/en"></head><body><div id="root"></div></body></html>';
let fixtureId = 0;
async function render(path: string, page: Record<string, unknown> | null, failReads = false) {
  const origin = `http://127.0.0.1:49499/metadata-${++fixtureId}`;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    expect(request.method).toBe("GET");
    const url = new URL(request.url);
    expect(url.origin).toBe("http://127.0.0.1:49499");
    if (url.pathname.endsWith("/site_settings")) return Response.json([{ company_name: "FLASH CAST SDN. BHD.", og_image_url: "https://flashcast.com.my/current-share.webp" }]);
    if (failReads) throw new Error("fixture source unavailable");
    const rows = page && url.pathname.endsWith("/site_pages") ? [page] : [];
    return Response.json(rows);
  }));
  const pending: Promise<unknown>[] = [];
  const response = await onRequest({
    request: new Request(`https://flashcast.com.my${path}`),
    env: {
      VITE_SUPABASE_URL: origin, VITE_SUPABASE_ANON_KEY: "local-public-placeholder", CF_PAGES_COMMIT_SHA: `metadata-${fixtureId}`,
      ASSETS: { fetch: async () => new Response(shell, { headers: { "content-type": "text/html" } }) },
    },
    next: async () => new Response(shell),
    waitUntil: (task: Promise<unknown>) => pending.push(task),
  } as Parameters<typeof onRequest>[0]);
  const document = new DOMParser().parseFromString(await response.text(), "text/html");
  await Promise.all(pending);
  return { response, document };
}
afterEach(() => vi.unstubAllGlobals());

describe("current public metadata contract", () => {
  it("uses current metadata-only builtin fields and its explicit image", async () => {
    const { response, document } = await render("/zh/contact", {
      id: "current-contact", path: "/contact", page_key: "contact", status: "published",
      title_zh: "当前联系标题", title_en: "Current contact", description_zh: "当前 CMS 描述",
      seo_title_zh: "", seo_description_zh: "", content_zh: "", image_url: "/current-contact.webp",
    });
    expect(response.status).toBe(200);
    expect(document.title).toBe("当前联系标题 | FLASH CAST SDN. BHD.");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("当前 CMS 描述");
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe("https://flashcast.com.my/current-contact.webp");
  });
  it("uses Admin default sharing image for a builtin without an explicit image", async () => {
    const { document } = await render("/en/contact", {
      id: "contact-default", path: "/contact", page_key: "contact", status: "published", title_en: "Contact", description_en: "Contact current team",
    });
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe("https://flashcast.com.my/current-share.webp");
  });
  it.each([["images/current.webp", "https://flashcast.com.my/images/current.webp"], ["http://", "https://flashcast.com.my/current-share.webp"], ["javascript:alert(1)", "https://flashcast.com.my/current-share.webp"]])("normalizes or rejects saved metadata image %s", async (image_url, expected) => {
    const { document } = await render("/en/contact", { id: "contact-image", path: "/contact", page_key: "contact", status: "published", title_en: "Contact", description_en: "Current", image_url });
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(expected);
  });
  it.each([false, true])("keeps Chinese missing-route identity through source failure=%s", async failReads => {
    const path = "/zh/metadata-fixture-missing";
    const { response, document } = await render(path, null, failReads);
    expect(response.status).toBe(404);
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.title).toBe(`404 | ${notFoundPageText.zh.title} | FLASH CAST SDN. BHD.`);
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(notFoundPageText.zh.metaDescription);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
    expect(document.querySelector('link[rel="canonical"], link[rel="alternate"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(`https://flashcast.com.my${path}`);
  });
});
