import { describe, expect, it } from "vitest";
import { mapPublishedBlogPost, translateBlogContent } from "@/lib/contentApi";

const serviceLinks = [
  ["/zh/services/renovation", "Renovation", "装修"],
  ["/zh/services/kitchen", "Kitchen", "厨房"],
  ["/zh/services/bathroom", "Bathroom", "浴室"],
  ["/zh/services/office-renovation", "Office Renovation", "办公室装修"],
  ["/zh/services/shop-renovation", "Shop Renovation", "店铺装修"],
] as const;

const serviceLinkHtml = serviceLinks
  .map(([href, label]) => `<p><a href="${href}" data-source="${label}">${label}</a></p>`)
  .join("");

const readLinks = (html: string) => {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  return Array.from(documentNode.querySelectorAll("a")).map((link) => ({
    href: link.getAttribute("href"),
    source: link.getAttribute("data-source"),
    text: link.textContent,
  }));
};

describe("blog content localization", () => {
  it("translates visible link text while preserving all five service href slugs and attributes", () => {
    const localized = translateBlogContent(serviceLinkHtml, "zh");

    expect(readLinks(localized)).toEqual(
      serviceLinks.map(([href, source, text]) => ({ href, source, text })),
    );
  });

  it("keeps fallback plain-text localization behavior", () => {
    expect(translateBlogContent("Homeowners planning a renovation", "zh")).toBe("正在规划装修的屋主");
    expect(translateBlogContent("Homeowners planning a renovation", "en")).toBe("Homeowners planning a renovation");
  });

  it("keeps CMS title and excerpt localization while preserving HTML href targets", () => {
    const post = mapPublishedBlogPost({
      id: "blog-1",
      slug: "office-renovation-guide",
      title_en: "Office Renovation",
      excerpt_en: "Homeowners planning a renovation",
      content_zh: serviceLinkHtml,
      category: "office-retail-fitout",
      published_at: "2026-09-09T00:00:00.000Z",
    }, "zh");

    expect(post.title).toBe("办公室装修");
    expect(post.excerpt).toBe("正在规划装修的屋主");
    expect(readLinks(post.content).map((link) => link.href)).toEqual(
      serviceLinks.map(([href]) => href),
    );
  });
});
