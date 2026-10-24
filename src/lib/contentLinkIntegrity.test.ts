import { materialsData } from "../data/materials";
import catalog from "../data/furnitureCatalog.json";
import { materialCategories, furnitureCategories, furnitureProducts } from "../../supabase/functions/_shared/catalog-link-targets.ts";
import { describe, expect, it, vi } from "vitest";
import { collectContentLinks, contentLinkTarget, localizeContentLink, localizeHtmlLinks, pendingContentPaths, validateContentLinks } from "../../supabase/functions/_shared/content-links.mjs";
import { publishedContentLinkExists, type ContentLinkClient } from "../../supabase/functions/_shared/content-link-repository.ts";

describe("shared content link integrity", () => {
  it("extracts authored anchors and structured links without mistaking text, comments or asset URLs for page links", () => {
    const links = collectContentLinks({ content_ms: '<!-- <a href="/ms/ignored"> --> <script><a href="/ms/ignored">bad</a></script><a title="a > b" HREF=\'/ms/services/office-renovation\'>pejabat</a>',
      items_en: [{ href: "/en/blog/planning", label: "office-renovation", image_url: "/images/planning.webp" }] });
    expect(links.map(link => [link.field, link.language, link.href])).toEqual([
      ["content_ms", "ms", "/ms/services/office-renovation"], ["items_en[0].href", "en", "/en/blog/planning"],
    ]);
  });

  it("changes only the locale prefix, preserving slug, query, hash, entities and external destinations", () => {
    expect(localizeContentLink("/en/blog/kitchen-cabinet-material-guide?x=office&amp;y=1#office", "ms"))
      .toBe("/ms/blog/kitchen-cabinet-material-guide?x=office&amp;y=1#office");
    expect(localizeContentLink("https://flashcast.com.my/en/services/office-renovation", "ms"))
      .toBe("https://flashcast.com.my/ms/services/office-renovation");
    for (const href of ["https://flashcast.com.my.evil/en/blog/office", "https://external.test/en/office", "/images/office.webp", "#office", "mailto:office@example.com"])
      expect(localizeContentLink(href, "ms")).toBe(href);
    expect(localizeHtmlLinks('<a data-href="/en/other" href="/en/services/office-renovation">office</a>', "ms"))
      .toBe('<a data-href="/en/other" href="/ms/services/office-renovation">office</a>');
  });

  it("rejects missing targets and wrong-locale links across arbitrary slugs, not a repair alias list", async () => {
    const resolve = vi.fn(async target => target.value === "real-article");
    const issues = await validateContentLinks({ content_ms: '<a href="/ms/services/pejabat-renovation">a</a><a href="/ms/blog/terjemahan-rawak">b</a><a href="/en/blog/real-article">c</a><a href="/ms/blog/real-article">d</a>' }, resolve);
    expect(issues.map(issue => issue.reason)).toEqual(["missing_published_target", "missing_published_target", "wrong_language"]);
    expect(resolve).toHaveBeenCalledTimes(3);
  });

  it("resolves entity-encoded and relative URLs, deduplicates lookups and admits the row being published", async () => {
    const resolve = vi.fn().mockResolvedValue(true);
    const pendingPaths = pendingContentPaths("services", { status: "published", slug: "new-service" });
    const issues = await validateContentLinks({ content_en: '<a href="/en/services/new-service">self</a><a href="/en/blog/real?x=1&amp;y=2">a</a><a href="/en/blog/real#part">b</a><a href="https://external.test/article">outside</a>' }, resolve, { pendingPaths });
    expect(issues).toEqual([]); expect(resolve).toHaveBeenCalledOnce();
    expect(contentLinkTarget("../blog/real", "en", "/services/office-renovation")?.canonicalPath).toBe("/blog/real");
    expect(contentLinkTarget("/ms/blog/%E5%8A%9E%E5%85%AC", "ms")?.value).toBe("办公");
  });

  it("does not convert a target lookup failure into success", async () => {
    await expect(validateContentLinks({ content_en: '<a href="/en/blog/real">article</a>' }, async () => { throw new Error("offline"); })).rejects.toThrow("offline");
  });

  it("looks up only published target records, respecting CMS tombstones", async () => {
    const filters: unknown[][] = [];
    const query = { eq: (key: string, value: string) => { filters.push([key, value]); return query; },
      is: (key: string, value: null) => { filters.push([key, value]); return query; },
      limit: async () => ({ data: [{ id: "record" }], error: null }) };
    const client = { from: vi.fn(() => ({ select: () => query })) } as unknown as ContentLinkClient;
    expect(await publishedContentLinkExists(client, contentLinkTarget("/ms/custom-page", "ms")!)).toBe(true);
    expect(client.from).toHaveBeenCalledWith("cms_pages");
    expect(filters).toEqual([["status", "published"], ["path", "/custom-page"], ["deleted_at", null]]);
  });

  it("recognizes real catalog category routes and rejects an invented category", async () => {
    const from = vi.fn(() => { const query = { eq: () => query, limit: async () => ({ data: [], error: null }) }; return { select: () => query }; });
    const client = { from } as unknown as ContentLinkClient;
    expect(await publishedContentLinkExists(client, contentLinkTarget("/ms/materials/category/whole-house-custom/wardrobes", "ms")!)).toBe(true);
    expect(from).not.toHaveBeenCalled();
    expect(await publishedContentLinkExists(client, contentLinkTarget("/ms/materials/category/missing-category", "ms")!)).toBe(false);
    expect(from).toHaveBeenCalledWith("materials");
    expect(contentLinkTarget("/en/products/stone-top", "en")).toMatchObject({ table: "materials", key: "slug", value: "stone-top", canonicalPath: "/materials/stone-top" });
    expect(pendingContentPaths("materials", { status: "published", category: "furniture", slug: "new-chair" })).toEqual(["/furniture/product/new-chair"]);
    expect(await publishedContentLinkExists(client, contentLinkTarget("/en/furniture/product/ws-2102-wooden-bunk-bed-white", "en")!)).toBe(true);
    expect(await publishedContentLinkExists(client, contentLinkTarget("/en/furniture/product/nonexistent-furniture", "en")!)).toBe(false);
  });
});

it("keeps Edge fallback route identities identical to the public catalogs", () => {
  expect(materialCategories).toEqual(materialsData.map(c => ({key:c.slug,subcategories:c.subcategories.map(x => x.slug)})));
  expect(furnitureCategories).toEqual(catalog.taxonomy.map(c => ({key:c.key,subcategories:c.subcategories.map(x => x.key)})));
  expect(furnitureProducts).toEqual(catalog.products.map(x => x.slug));
});
