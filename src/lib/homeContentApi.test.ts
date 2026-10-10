import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublishedHomeContentBundle, getPublishedHomeOptionalSectionVisibility, isPublishedHomeSectionEnabled, mapSitePageRows } from "@/lib/homeContentApi";

const readers = vi.hoisted(() => ({
  bundle: vi.fn(), visibility: vi.fn(), configured: vi.fn(() => true),
}));
vi.mock("@/backend/modules/cms/repository/publicContentRepository", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/backend/modules/cms/repository/publicContentRepository")>(),
  fetchPublicHomeBundleData: readers.bundle,
  fetchPublishedHomeSectionRow: readers.visibility,
  hasPublicContentDatabaseClient: readers.configured,
}));
beforeEach(() => { readers.bundle.mockReset(); readers.visibility.mockReset(); readers.configured.mockReturnValue(true); });

describe("independent optional homepage visibility", () => {
  it("returns the successful core bundle without starting or awaiting optional reads", async () => {
    readers.bundle.mockResolvedValue({ site_pages: [{ page_key: "home", title_en: "Current home" }], home_sections: [] });
    readers.visibility.mockImplementation(() => new Promise(() => {}));
    const signal = new AbortController().signal;
    const result = await getPublishedHomeContentBundle("en", signal);
    expect(result.source).toBe("remote");
    expect(result.data.pageContent?.title).toBe("Current home");
    expect(result.data.brandPartnersEnabled).toBe(false);
    expect(result.data.testimonialsEnabled).toBe(false);
    expect(readers.bundle).toHaveBeenCalledWith(signal);
    expect(readers.visibility).not.toHaveBeenCalled();
  });

  it.each(["brand_partners", "testimonials"] as const)("requires a confirmed explicit %s activation", async (sectionKey) => {
    const signal = new AbortController().signal;
    readers.visibility.mockResolvedValue({ section_key: sectionKey, status: "published", items_zh: [{ enabled: true }] });
    expect(await getPublishedHomeOptionalSectionVisibility(sectionKey, signal)).toBe(true);
    expect(readers.visibility).toHaveBeenCalledWith(sectionKey, signal);
    readers.visibility.mockResolvedValue(null);
    expect(await getPublishedHomeOptionalSectionVisibility(sectionKey, signal)).toBe(false);
    readers.visibility.mockResolvedValue({ section_key: sectionKey, status: "draft", items_zh: [{ enabled: true }] });
    expect(await getPublishedHomeOptionalSectionVisibility(sectionKey, signal)).toBe(false);
    readers.visibility.mockResolvedValue({ section_key: sectionKey, status: "published", items_en: [{ enabled: true }] });
    expect(await getPublishedHomeOptionalSectionVisibility(sectionKey, signal)).toBe(false);
  });

  it("keeps visibility failure distinct from confirmed disabled content and the successful bundle", async () => {
    readers.bundle.mockResolvedValue({ site_pages: [{ page_key: "home", title_zh: "当前首页" }] });
    readers.visibility.mockRejectedValue(new Error("Visibility unavailable"));
    await expect(getPublishedHomeOptionalSectionVisibility("brand_partners")).rejects.toThrow("Visibility unavailable");
    expect((await getPublishedHomeContentBundle("zh")).source).toBe("remote");
    readers.configured.mockReturnValue(false);
    await expect(getPublishedHomeOptionalSectionVisibility("testimonials")).rejects.toThrow("Content source unavailable");
  });
});

describe("homepage section visibility", () => {
  it("keeps a section disabled when its setting is missing or not published", () => {
    expect(isPublishedHomeSectionEnabled("brand_partners", null)).toBe(false);
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "brand_partners", status: "draft" })).toBe(false);
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "brand_partners", status: "archived" })).toBe(false);
  });

  it("enables only the matching published section", () => {
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "brand_partners", status: "published" })).toBe(true);
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "stats", status: "published" })).toBe(false);
  });
});

describe("published page metadata authority", () => {
  it("uses the current page title and description when SEO fields are empty", () => {
    const page = mapSitePageRows({ site_pages: [{ id: "page", page_key: "contact", path: "/contact", title_zh: "当前联系页", description_zh: "<p>当前已发布说明</p>", seo_title_zh: "", seo_description_zh: "", image_url: "/images/current.webp" }] }, "zh");
    expect(page?.seo_title).toBe("当前联系页");
    expect(page?.seo_description).toBe("当前已发布说明");
    expect(page?.seoImage).toBe("/images/current.webp");
  });

  it("keeps page-level SEO authoritative while preserving visible CMS section content", () => {
    const page = mapSitePageRows({
      site_pages: [{ id: "page", page_key: "contact", path: "/contact", title_en: "Current contact", seo_description_en: "Current metadata", image_url: "/images/current.webp" }],
      cms_pages: [{ id: "cms", page_key: "contact", path: "/contact", title_en: "CMS visible title", seo_title_en: "Other SEO source", seo_description_en: "Other metadata", cms_sections: [{ status: "published", section_type: "hero", content_en: { title: "Visible hero", image_url: "/images/visible-hero.webp" } }] }],
    }, "en");
    expect(page?.title).toBe("CMS visible title");
    expect(page?.image_url).toBe("/images/visible-hero.webp");
    expect(page?.seo_title).toBe("Current contact");
    expect(page?.seo_description).toBe("Current metadata");
    expect(page?.seoImage).toBe("/images/current.webp");
  });

  it("does not use the other language's metadata when selected fields are empty", () => {
    const page = mapSitePageRows({ site_pages: [{ title_en: "English", seo_description_en: "English description", content_en: "English body" }] }, "zh");
    expect(page?.seo_title).toBe("");
    expect(page?.seo_description).toBe("");
  });
});
