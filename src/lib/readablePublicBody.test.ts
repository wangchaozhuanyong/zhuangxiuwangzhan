import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildReadablePublicBody } from "../../functions/readablePublicBody";

type PublicService = Record<string, unknown>;

// Frozen reviewed public records are local regression inputs, not live Saved evidence.
function reviewedService(slug: "builtin" | "kitchen" | "renovation"): PublicService {
  const file = new URL("../../drafts/publishing/fc-20261010-paid-three-page-native-20261010/previews/" + slug + "/desired.json", import.meta.url);
  return (JSON.parse(readFileSync(file, "utf8")) as { record: PublicService }).record;
}

const text = (value: string) => value.replace(/\s+/g, " ").trim();
const sourceText = (html: string) => {
  const dom = new JSDOM("<body>" + html + "</body>");
  const result = text(dom.window.document.body.textContent || "");
  dom.window.close();
  return result;
};

describe("reviewed service no-JS primary content", () => {
  for (const slug of ["kitchen", "renovation"] as const) {
    for (const lang of ["en", "zh"] as const) {
      const route = "/" + lang + "/services/" + slug;
      it("renders native " + lang + "/" + slug + " title, excerpt and full body instead of retained SEO description", () => {
        const row = reviewedService(slug);
        const before = JSON.stringify(row);
        const html = buildReadablePublicBody(route, row);
        const dom = new JSDOM("<body>" + html + "</body>");
        const main = dom.window.document.querySelector("main[data-flashcast-readable-body]");
        expect(main).not.toBeNull();
        expect(main?.getAttribute("lang")).toBe(lang === "zh" ? "zh-CN" : "en");
        expect(main?.querySelectorAll("h1")).toHaveLength(1);
        expect(main?.querySelector("h1")?.textContent).toBe(row["title_" + lang]);
        expect(main?.textContent).toContain(row["excerpt_" + lang]);
        expect(text(main?.textContent || "")).toContain(sourceText(String(row["content_" + lang])));
        expect(main?.querySelectorAll("script,iframe,form,input")).toHaveLength(0);
        for (const faq of row["faqs_" + lang] as { q: string; a: string }[]) {
          expect(main?.textContent).toContain(faq.q);
          expect(main?.textContent).toContain(faq.a);
        }
        for (const item of row["scope_items_" + lang] as string[]) expect(main?.textContent).toContain(item);
        expect(main?.querySelector("[data-flashcast-reviewed-cta]")).toBeNull();
        expect(JSON.stringify(row)).toBe(before);
        dom.window.close();
      });

      it("keeps " + lang + "/" + slug + " behind published, slug and complete-language guards", () => {
        const row = reviewedService(slug);
        for (const status of ["draft", "archived", "unpublished", null]) expect(buildReadablePublicBody(route, { ...row, status })).toBe("");
        expect(buildReadablePublicBody(route, { ...row, slug: "other-service" })).toBe("");
        expect(buildReadablePublicBody(route, { ...row, ["content_" + lang]: "" })).toBe("");
        expect(buildReadablePublicBody(route, { ...row, ["content_" + lang]: "x".repeat(131073) })).toBe("");
        expect(buildReadablePublicBody(route, { ...row, ["title_" + lang]: "" })).toBe("");
        expect(buildReadablePublicBody(route, null)).toBe("");
      });

      it("sanitizes " + lang + "/" + slug + " body and preserves only safe language-scoped links", () => {
        const row = reviewedService(slug);
        const content = '<p>Visible reviewed paragraph.</p><h2 onclick="evil()">Visible heading</h2>'
          + '<script>evil()</script><svg onload="evil()">bad</svg><img src=x onerror=evil()>'
          + '<a href="javascript&#58;evil()">unsafe protocol</a><a href="https://evil.example/en">foreign origin</a>'
          + '<a href="/' + (lang === "en" ? "zh" : "en") + '/quote">wrong language</a>'
          + '<a href="/' + lang + '/quote?x=1&amp;y=2" onclick="evil()">allowed link</a>'
          + '<p>&lt;img src=x onerror=evil()&gt;</p></noscript><script>bad()</script>';
        const html = buildReadablePublicBody(route, { ...row, ["content_" + lang]: content });
        const dom = new JSDOM("<body>" + html + "</body>");
        const main = dom.window.document.querySelector("main[data-flashcast-readable-body]");
        expect(main).not.toBeNull();
        expect(main?.querySelectorAll("script,svg,img,iframe,form,[onclick],[onerror],[onload]")).toHaveLength(0);
        expect(main?.querySelectorAll("a[href]")).toHaveLength(1);
        expect(main?.querySelector("a[href]")?.getAttribute("href")).toBe("/" + lang + "/quote?x=1&y=2");
        expect(main?.textContent).toContain("Visible reviewed paragraph.");
        expect(main?.textContent).toContain("<img src=x onerror=evil()>");
        expect(html).not.toContain("</noscript>");
        dom.window.close();
      });
    }
  }

  it("keeps a third service, unprefixed routes and unsupported languages outside this renderer", () => {
    const row = { ...reviewedService("kitchen"), slug: "shop-renovation" };
    for (const route of ["/en/services/shop-renovation", "/zh/services/shop-renovation", "/services/kitchen", "/fr/services/kitchen", "/en/admin"]) {
      expect(buildReadablePublicBody(route, row)).toBe("");
    }
  });

  for (const lang of ["en", "zh"] as const) {
    it("preserves existing " + lang + "/builtin content and contact-independent output", () => {
      const row = reviewedService("builtin");
      const html = buildReadablePublicBody("/" + lang + "/services/builtin", row);
      const dom = new JSDOM("<body>" + html + "</body>");
      const main = dom.window.document.querySelector("main[data-flashcast-readable-body]");
      expect(main?.querySelector("h1")?.textContent).toBe(row["title_" + lang]);
      expect(main?.textContent).toContain(row["excerpt_" + lang]);
      expect(text(main?.textContent || "")).toContain(sourceText(String(row["content_" + lang])));
      expect(html).toBe(buildReadablePublicBody("/" + lang + "/services/builtin", row, { phone_e164: "+601128853888", email: "support@flashcast.com.my" }));
      expect(main?.querySelector("[data-flashcast-reviewed-cta]")).toBeNull();
      dom.window.close();
    });
  }
});

