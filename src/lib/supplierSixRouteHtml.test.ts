import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import displaySafety from "../data/furnitureDisplaySafety.json";
import manifest from "./fixtures/supplierSixRouteMeta.test.json";

const siteOrigin = "https://flashcast.com.my";
const slugs = Object.keys(displaySafety);

afterEach(() => {
  vi.doUnmock("../../functions/seo-manifest.json");
  vi.resetModules();
});

describe("supplier product route HTML through the current middleware", () => {
  it("returns all six HTML shell responses with exact canonical, hreflang and safe summary", async () => {
    vi.doMock("../../functions/seo-manifest.json", () => ({ default: manifest }));
    const { onRequest } = await import("../../functions/_middleware");
    // Exercise real middleware transforms without depending on a prior build.
    // The deployed build is validated separately by the release workflow.
    const shell = readFileSync("index.html", "utf8");
    expect(shell).toContain('<div id="root"></div>');

    for (const slug of slugs) {
      const safe = displaySafety[slug as keyof typeof displaySafety];
      for (const lang of ["en", "zh"] as const) {
        const route = `/${lang}/furniture/product/${slug}`;
        const html = await onRequest({
          request: new Request(`${siteOrigin}${route}`),
          env: {
            ASSETS: {
              fetch: async (request: Request) => {
                expect(new URL(request.url).pathname).toBe("/");
                return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
              },
            },
          },
          next: async () => new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } }),
        } as Parameters<typeof onRequest>[0]);
        const body = await html.text();
        const meta = manifest[route as keyof typeof manifest];
        const escapedTitle = `${safe[lang].name} | FLASH CAST SDN. BHD.`
          .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        const escapedDescription = safe[lang].shortDescription.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

        expect(html.status).toBe(200);
        expect(body).toContain(`<title data-rh="true">${escapedTitle}`);
        expect(body).toContain(`name="description" content="${escapedDescription}"`);
        expect(body).toContain(`rel="canonical" href="${meta.canonical}"`);
        expect(body).toContain(`hreflang="en" href="${meta.hreflang.en}"`);
        expect(body).toContain(`hreflang="zh-CN" href="${meta.hreflang.zh}"`);
        expect(body).toContain(`hreflang="x-default" href="${meta.hreflang.xDefault}"`);
        expect(body).toContain('<noscript data-flashcast-geo-summary><section');
        expect(body).toContain(`<h1>${escapedTitle}</h1>`);
        expect(body).toContain(escapedDescription);
        expect(body).toContain(lang === "en" ? "delivery" : "配送");
        expect(body).toContain(lang === "en" ? "assembly" : "组装");
        expect(body).not.toMatch(/2211|2237|L140|140\s*[x×]|limited stock|库存有限|防水|耐热/i);
      }
    }
  });
});
