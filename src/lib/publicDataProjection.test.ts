import { describe, expect, it } from "vitest";
import { mapRemoteHomeContentBundle } from "./homeContentApi";
import {
  projectBlogPostSummariesForPreload,
  projectHomeContentBundleForPreload,
  projectMaterialsForPreload,
  projectProjectSummariesForPreload,
  projectServiceAreaSummariesForPreload,
  projectServiceSummariesForPreload,
  projectServiceDetailForPreload,
  projectBlogDetailForPreload,
  projectSitePageBundleForPreload,
} from "../../functions/publicDataProjection";

describe("public HTML data projection", () => {
  it.each(["en", "zh", "ms"] as const)("keeps only required detail locale fields while preserving the %s render", async language => {
    const { mapPublishedService, mapPublishedBlogPost } = await import("./contentApi");
    const row = { id: "detail", slug: "detail", title_en: "English", title_zh: "中文", title_ms: "Melayu", content_en: "English body", content_zh: "中文正文", content_ms: "Kandungan", suitable_for_en: ["Homes"], suitable_for_zh: ["住宅"], suitable_for_ms: ["Rumah"], faqs_en: [{ q: "English Q", a: "English A" }], faqs_zh: [{ q: "中文问", a: "中文答" }], faqs_ms: [{ q: "Soalan", a: "Jawapan" }] };
    const service = projectServiceDetailForPreload(row, language), blog = projectBlogDetailForPreload(row, language);
    expect(mapPublishedService(service, language)).toEqual(mapPublishedService(row, language));
    expect(mapPublishedBlogPost(blog, language)).toEqual(mapPublishedBlogPost(row, language));
    expect(service.preload_language).toBe(language);
    expect(blog.preload_language).toBe(language);
    for (const other of ["en", "zh", "ms"].filter(value => value !== language)) {
      expect(service).not.toHaveProperty(`content_${other}`);
      expect(blog).not.toHaveProperty(`content_${other}`);
    }
  });
  it.each(["en", "zh", "ms"] as const)("omits unused CMS home sections without changing the %s render", (language) => {
    const published = {
      id: "published-home", page_key: "home", path: "/",
      title_en: "Published home", title_zh: "已发布首页", title_ms: "Laman utama",
      description_en: "Published intro", description_zh: "已发布介绍", description_ms: "Pengenalan",
      seo_title_en: "Home SEO", seo_title_zh: "首页 SEO", seo_title_ms: "SEO utama",
    };
    const payload = {
      site_pages: [published],
      cms_pages: [{
        id: "cms-home", page_key: "home", title_en: "Unused home",
        cms_sections: [{ section_key: "hero", section_type: "hero", status: "published",
          content_en: { title: "Unused hero", description: "unused".repeat(1500) } }],
      }],
      home_sections: [{ section_key: "stats", status: "published", items_en: [{ label: "Rooms" }],
        items_zh: [{ label: "房间" }], items_ms: [{ label: "Bilik" }] }],
      projects: [{ id: "project", slug: "one", image_url: "/project.webp", title_en: "Project" }],
    };
    const projected = projectHomeContentBundleForPreload(payload);
    expect(projected).not.toHaveProperty("cms_pages");
    expect(mapRemoteHomeContentBundle(projected, language)).toEqual(mapRemoteHomeContentBundle(payload, language));
    expect(JSON.stringify(payload).length - JSON.stringify(projected).length).toBeGreaterThan(9000);
  });

  it.each([{ sitePages: [] }, { sitePages: [{ page_key: "services" }] }])("keeps the CMS fallback when the selected legacy row is not home ($sitePages)", ({ sitePages }) => {
    const payload = {
      site_pages: sitePages,
      cms_pages: [{ id: "cms-home", page_key: "home", title_en: "CMS home",
        cms_sections: [{ section_key: "hero", section_type: "hero", status: "published",
          content_en: { title: "CMS hero", description: "CMS description" } }] }],
    };
    const projected = projectHomeContentBundleForPreload(payload);
    expect(projected.cms_pages).toHaveLength(1);
    expect(mapRemoteHomeContentBundle(projected, "en")).toEqual(mapRemoteHomeContentBundle(payload, "en"));
  });

  it("keeps the bilingual homepage render contract while dropping detail-only fields", () => {
    const projected = projectHomeContentBundleForPreload({
      services: [{
        id: "service-1",
        slug: "office-renovation",
        title_en: "Office renovation",
        title_zh: "办公室装修",
        excerpt_en: "Office upgrade",
        excerpt_zh: "办公室升级",
        content_en: "Long service detail",
        content_zh: "很长的服务详情",
        faqs_en: [{ q: "Detail only", a: "Detail only" }],
        created_at: "2026-08-30",
      }],
      projects: [{
        id: "project-1",
        slug: "project-one",
        title_en: "Project one",
        title_zh: "项目一",
        excerpt_en: "Project summary",
        excerpt_zh: "项目摘要",
        project_images: [
          { image_url: "/gallery.webp", image_type: "gallery", sort_order: 0, alt_en: "Gallery", internal_note: "remove" },
          { image_url: "/cover.webp", image_type: "cover", sort_order: 2, alt_en: "Cover", alt_zh: "封面" },
        ],
        updated_at: "2026-08-30",
      }],
      site_pages: [{
        id: "home",
        page_key: "home",
        path: "/",
        title_en: "Home",
        title_zh: "首页",
        seo_title_en: "Home SEO",
        seo_title_zh: "首页 SEO",
        content_en: "Long homepage body",
        content_zh: "很长的首页正文",
      }],
      home_sections: [{ section_key: "brand_partners", status: "draft", created_at: "2026-08-30" }],
      unknown_admin_table: [{ secret: "remove" }],
    });

    const service = (projected.services as Record<string, unknown>[])[0];
    const project = (projected.projects as Record<string, unknown>[])[0];
    const page = (projected.site_pages as Record<string, unknown>[])[0];

    expect(service).toMatchObject({
      slug: "office-renovation",
      title_en: "Office renovation",
      title_zh: "办公室装修",
      excerpt_en: "Office upgrade",
      excerpt_zh: "办公室升级",
    });
    expect(service).not.toHaveProperty("content_en");
    expect(service).not.toHaveProperty("faqs_en");
    expect(service).not.toHaveProperty("created_at");
    expect(project.project_images).toEqual([{
      image_url: "/cover.webp",
      image_type: "cover",
      sort_order: 2,
      alt_en: "Cover",
      alt_zh: "封面",
    }]);
    expect(page).toMatchObject({ seo_title_en: "Home SEO", seo_title_zh: "首页 SEO" });
    expect(page).not.toHaveProperty("content_en");
    expect(projected).not.toHaveProperty("unknown_admin_table");
  });

  it("keeps list fallbacks and a directly requested material detail", () => {
    const services = projectServiceSummariesForPreload([{
      id: "service-1",
      slug: "service-one",
      title_en: "Service one",
      alt_en: "Warehouse shelving concept",
      alt_zh: "仓储货架规划概念图",
      excerpt_en: "",
      content_en: "Fallback description",
      content_zh: "中文回退描述",
    }]);
    expect(services[0]).toMatchObject({ content_en: "Fallback description", content_zh: "中文回退描述" });
    expect(services[0]).toMatchObject({ alt_en: "Warehouse shelving concept", alt_zh: "仓储货架规划概念图" });

    const materials = projectMaterialsForPreload([
      {
        id: "material-list",
        slug: "list-item",
        category: "Flooring",
        title_en: "List item",
        excerpt_en: "List summary",
        content_en: "Long list detail",
        pros_en: ["Detail only"],
      },
      {
        id: "material-detail",
        slug: "detail-item",
        category: "Flooring",
        title_en: "Detail item",
        excerpt_en: "Detail summary",
        content_en: "Full detail",
        pros_en: ["Durable"],
        created_at: "2026-08-30",
        material_images: [{ id: "image-1", image_url: "/detail.webp", image_type: "detail", alt_en: "Detail", created_at: "remove" }],
      },
    ], "detail-item");

    expect(materials[0]).not.toHaveProperty("content_en");
    expect(materials[0]).not.toHaveProperty("pros_en");
    expect(materials[1]).toMatchObject({ content_en: "Full detail", pros_en: ["Durable"] });
    expect(materials[1]).not.toHaveProperty("created_at");
    expect(materials[1].material_images).toEqual([{
      id: "image-1",
      image_url: "/detail.webp",
      image_type: "detail",
      alt_en: "Detail",
    }]);
  });

  it("projects collection rows to the fields consumed by their listing pages", () => {
    const projects = projectProjectSummariesForPreload([{
      id: "project-1",
      slug: "project-one",
      excerpt_en: "",
      content_en: "Project fallback",
      content_zh: "项目回退",
      client_need_en: "Detail only",
    }]);
    const locations = projectServiceAreaSummariesForPreload([{
      id: "area-1",
      slug: "bangsar",
      area_name: "Bangsar",
      excerpt_en: "Area summary",
      property_types: ["Condo"],
      content_en: "Detail only",
    }]);
    const blog = projectBlogPostSummariesForPreload([{
      id: "blog-1",
      slug: "guide",
      title_en: "Guide",
      title_zh: "指南",
      excerpt_en: "Summary",
      excerpt_zh: "摘要",
      content_en: Array.from({ length: 221 }, () => "word").join(" "),
      content_zh: "装".repeat(301),
      created_by: "remove",
    }]);

    expect(projects[0]).toMatchObject({ content_en: "Project fallback", content_zh: "项目回退" });
    expect(projects[0]).not.toHaveProperty("client_need_en");
    expect(locations[0]).toMatchObject({ area_name: "Bangsar", property_types: ["Condo"] });
    expect(locations[0]).not.toHaveProperty("content_en");
    expect(blog[0]).toMatchObject({ preload_read_minutes_en: 2, preload_read_minutes_zh: 2 });
    expect(blog[0]).not.toHaveProperty("content_en");
    expect(blog[0]).not.toHaveProperty("created_by");
  });

  it("keeps site-page rendering fields and strips publishing metadata", () => {
    const bundle = projectSitePageBundleForPreload({
      site_pages: [{
        id: "legacy",
        page_key: "services",
        content_en: "Page content",
        items_zh: ["项目"],
        created_at: "remove",
      }],
      cms_pages: [{
        id: "cms",
        page_key: "services",
        published_at: "remove",
        cms_sections: [{
          id: "hero",
          section_key: "hero",
          section_type: "hero",
          status: "published",
          content_en: { title: "Services" },
          settings: { image_url: "/hero.webp" },
          created_by: "remove",
        }],
      }],
    });

    const legacy = (bundle.site_pages as Record<string, unknown>[])[0];
    const cms = (bundle.cms_pages as Record<string, unknown>[])[0];
    const section = (cms.cms_sections as Record<string, unknown>[])[0];
    expect(legacy).toMatchObject({ content_en: "Page content", items_zh: ["项目"] });
    expect(legacy).not.toHaveProperty("created_at");
    expect(cms).not.toHaveProperty("published_at");
    expect(section).toMatchObject({ content_en: { title: "Services" }, settings: { image_url: "/hero.webp" } });
    expect(section).not.toHaveProperty("created_by");
  });
});
