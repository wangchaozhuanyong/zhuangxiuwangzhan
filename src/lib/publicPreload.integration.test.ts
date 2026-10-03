import { afterEach, describe, expect, it, vi } from "vitest";
import {
  projectBlogPostSummariesForPreload,
  projectHomeContentBundleForPreload,
  projectMaterialsForPreload,
  projectProjectSummariesForPreload,
  projectServiceAreaSummariesForPreload,
  projectServiceSummariesForPreload,
} from "../../functions/publicDataProjection";

const originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");

const setPreloadedPublicData = (payload: unknown) => {
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      getElementById: (id: string) =>
        id === "flashcast-public-data"
          ? { textContent: JSON.stringify(payload) }
          : null,
    },
  });
};

afterEach(() => {
  vi.resetModules();
  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, "document", originalDocumentDescriptor);
  } else {
    delete (globalThis as { document?: unknown }).document;
  }
});

describe("public preload data", () => {
  it("does not hydrate detail fields from a projected summary body fallback", async () => {
    setPreloadedPublicData({ services: [{ slug: "fixture", content_en: "Summary fallback" }], materials: [{ slug: "fixture", category: "Flooring", content_en: "Summary fallback" }] });
    const { getPublicQuerySeed } = await import("@/lib/publicQuerySeed");
    expect(getPublicQuerySeed(["published", "service", "fixture", "en"])).toBeUndefined();
    expect(getPublicQuerySeed(["published", "material", "fixture", "en"])).toBeUndefined();
  });
  it("hydrates a full projected product detail without another list/detail read", async () => {
    setPreloadedPublicData({ materials: [{ id: "fixture", slug: "fixture", category: "Flooring", subcategory: "Vinyl", title_en: "Full detail", content_en: "Full body", material_images: [{ image_url: "/fixture.webp", image_type: "cover", is_active: true }] }] });
    const { getPublicQuerySeed } = await import("@/lib/publicQuerySeed");
    expect(getPublicQuerySeed(["published", "material", "fixture", "en"])).toMatchObject({ material: { slug: "fixture", description: "Full body" } });
  });

  it("seeds settings without a repository request", async () => {
    setPreloadedPublicData({
      siteSettings: {
        company_name: "FLASH CAST Test",
        logo_url: "/logo-flashcast.png",
      },
    });

    const { resolveSiteSettings } = await import("@/lib/siteSettingsApi");
    const { getPublicQuerySeed } = await import("@/lib/publicQuerySeed");
    const settings = resolveSiteSettings(getPublicQuerySeed(["site-settings"]) as Parameters<typeof resolveSiteSettings>[0], "zh");

    expect(settings.company_name).toBe("FLASH CAST Test");
    expect(settings.logo_url).toBe("/logo-flashcast-20260605.webp");
  });

  it("uses preloaded services, materials, and blog posts", async () => {
    setPreloadedPublicData({
      services: [
        {
          id: "service-1",
          slug: "office-renovation",
          title_en: "Office Renovation",
          title_zh: "办公室装修",
          excerpt_en: "Office upgrade",
          content_en: "Office renovation content",
          image_url: "/images/services/office-renovation.webp",
        },
      ],
      materials: [
        {
          id: "material-1",
          slug: "vinyl-plank",
          category: "Flooring",
          subcategory: "Vinyl",
          title_en: "Vinyl Plank",
          excerpt_en: "Durable flooring",
          image_url: "/images/materials/vinyl-plank-ash-grey.webp",
        },
      ],
      blogPosts: [
        {
          id: "blog-1",
          slug: "renovation-guide",
          title_en: "Renovation Guide",
          excerpt_en: "Planning notes",
          content_en: "Full guide",
          category: "Renovation",
          published_at: "2026-06-01",
          updated_at: "2026-06-03T08:00:00.000Z",
          cover_image_url: "/images/projects/residential-renovation.webp",
          alt_en: "Renovation planning guide cover",
          seo_title_en: "Renovation Planning Guide | FLASH CAST",
          seo_description_en: "Plan a renovation with a clear scope and material direction.",
          tags: ["Renovation"],
        },
      ],
    });

    type getPublishedBlogPosts = typeof import("@/lib/contentApi")["getPublishedBlogPosts"];
type getPublishedMaterials = typeof import("@/lib/contentApi")["getPublishedMaterials"];
type getPublishedServices = typeof import("@/lib/contentApi")["getPublishedServices"];

    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "services", "en"]) as Awaited<ReturnType<getPublishedServices>>)[0]?.title).toBe("Office Renovation");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "materials", "en"]) as Awaited<ReturnType<getPublishedMaterials>>)[0]?.items[0]?.name).toBe("Vinyl Plank");
    const blogPost = ((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "blog", "en"]) as Awaited<ReturnType<getPublishedBlogPosts>>)[0];
    expect(blogPost?.title).toBe("Renovation Guide");
    expect(blogPost?.imageAlt).toBe("Renovation planning guide cover");
    expect(blogPost?.seoTitle).toBe("Renovation Planning Guide | FLASH CAST");
    expect(blogPost?.seoDescription).toBe("Plan a renovation with a clear scope and material direction.");
    expect(blogPost?.updatedAt).toBe("2026-06-03T08:00:00.000Z");
    expect(blogPost?.readTime).toBe("1 min");
  });

  it("hydrates both languages from the projected Edge listing contract", async () => {
    setPreloadedPublicData({
      services: projectServiceSummariesForPreload([{
        id: "service-1",
        slug: "office-renovation",
        title_en: "Office Renovation",
        title_zh: "办公室装修",
        alt_en: "Office layout concept",
        alt_zh: "办公室布局概念图",
        excerpt_en: "Office upgrade",
        excerpt_zh: "办公室升级",
        content_en: "Detail omitted from the listing preload",
      }]),
      materials: projectMaterialsForPreload([{
        id: "material-1",
        slug: "vinyl-plank",
        category: "Flooring",
        subcategory: "Vinyl",
        title_en: "Vinyl Plank",
        title_zh: "乙烯基地板",
        excerpt_en: "Durable flooring",
        excerpt_zh: "耐用地板",
        image_url: "/vinyl.webp",
        content_en: "Detail omitted from the listing preload",
      }]),
      projectSummaries: projectProjectSummariesForPreload([{
        id: "project-1",
        slug: "project-one",
        title_en: "Project One",
        title_zh: "项目一",
        excerpt_en: "Project summary",
        excerpt_zh: "项目摘要",
        project_images: [{ image_type: "cover", image_url: "/project.webp", alt_en: "Project", alt_zh: "项目" }],
      }]),
      serviceAreas: projectServiceAreaSummariesForPreload([{
        id: "area-1",
        slug: "bangsar",
        area_name: "Bangsar",
        excerpt_en: "Bangsar renovation",
        excerpt_zh: "孟沙装修",
        property_types: ["Condo"],
      }]),
      blogPosts: projectBlogPostSummariesForPreload([{
        id: "blog-1",
        slug: "renovation-guide",
        title_en: "Renovation Guide",
        title_zh: "装修指南",
        excerpt_en: "Planning notes",
        excerpt_zh: "规划说明",
        content_en: Array.from({ length: 221 }, () => "word").join(" "),
        content_zh: "装".repeat(301),
        category: "Renovation",
      }]),
    });

    type getPublishedBlogPosts = typeof import("@/lib/contentApi")["getPublishedBlogPosts"];
type getPublishedMaterials = typeof import("@/lib/contentApi")["getPublishedMaterials"];
type getPublishedProjectSummaries = typeof import("@/lib/contentApi")["getPublishedProjectSummaries"];
type getPublishedServiceAreas = typeof import("@/lib/contentApi")["getPublishedServiceAreas"];
type getPublishedServices = typeof import("@/lib/contentApi")["getPublishedServices"];

    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "services", "en"]) as Awaited<ReturnType<getPublishedServices>>)[0]?.title).toBe("Office Renovation");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "services", "zh"]) as Awaited<ReturnType<getPublishedServices>>)[0]?.title).toBe("办公室装修");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "services", "en"]) as Awaited<ReturnType<getPublishedServices>>)[0]?.imageAlt).toBe("Office layout concept");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "services", "zh"]) as Awaited<ReturnType<getPublishedServices>>)[0]?.imageAlt).toBe("办公室布局概念图");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "materials", "zh"]) as Awaited<ReturnType<getPublishedMaterials>>)[0]?.items[0]?.name).toBe("乙烯基地板");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "project_summaries", "en", "all"]) as Awaited<ReturnType<getPublishedProjectSummaries>>)[0]?.thumbnail).toBe("/project.webp");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "service_areas", "zh"]) as Awaited<ReturnType<getPublishedServiceAreas>>)[0]?.description).toBe("孟沙装修");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "blog", "en"]) as Awaited<ReturnType<getPublishedBlogPosts>>)[0]?.readTime).toBe("2 min");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "blog", "zh"]) as Awaited<ReturnType<getPublishedBlogPosts>>)[0]?.readTime).toBe("2 min");
  });

  it("uses preloaded site pages and footer CTA blocks", async () => {
    setPreloadedPublicData({
      sitePages: {
        services: {
          site_pages: [
            {
              id: "page-1",
              page_key: "services",
              title_en: "Services",
              description_en: "Service intro",
              seo_title_en: "Services SEO",
            },
          ],
        },
      },
      ctaBlocks: {
        home_final: {
          id: "cta-1",
          block_key: "home_final",
          title_en: "Start your renovation",
          description_en: "Talk to us",
          primary_label_en: "Get quote",
          primary_url: "/quote",
        },
      },
    });

    type getPublishedCtaBlock = typeof import("@/lib/homeContentApi")["getPublishedCtaBlock"];
type getPublishedSitePage = typeof import("@/lib/homeContentApi")["getPublishedSitePage"];

    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "site_page", "en", "services"]) as Awaited<ReturnType<getPublishedSitePage>>)?.seo_title).toBe("Services SEO");
    expect(((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "cta", "en", "home_final"]) as Awaited<ReturnType<getPublishedCtaBlock>>)?.title).toBe("Start your renovation");
  });

  it("keeps preloaded homepage brands hidden when the visibility setting is off", async () => {
    setPreloadedPublicData({
      homeContentBundle: {
        home_sections: [{ section_key: "brand_partners", status: "draft" }],
        brand_partners: [{ id: "brand-1", name: "Test Brand", logo_url: "/images/brands/test.webp" }],
      },
    });

    type getPublishedHomeContentBundle = typeof import("@/lib/homeContentApi")["getPublishedHomeContentBundle"];
    const result = (await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "home_bundle", "en"]) as Awaited<ReturnType<getPublishedHomeContentBundle>>;

    expect(result.source).toBe("remote");
    expect(result.data.brandPartners).toHaveLength(1);
    expect(result.data.brandPartnersEnabled).toBe(false);
  });

  it("hydrates the visible homepage fields from the projected bilingual bundle", async () => {
    setPreloadedPublicData({
      homeContentBundle: projectHomeContentBundleForPreload({
        site_pages: [{
          id: "home",
          page_key: "home",
          path: "/",
          seo_title_en: "Home SEO",
          seo_title_zh: "首页 SEO",
          image_url: "/home.webp",
          alt_en: "Home",
          alt_zh: "首页",
          content_en: "Detail omitted from the homepage preload",
        }],
        hero_slides: [{
          id: "hero",
          title_en: "Build well",
          title_zh: "认真建造",
          button_label_en: "Get a quote",
          button_label_zh: "获取报价",
          button_url: "/quote",
          image_url: "/hero.webp",
        }],
        services: [{
          id: "service",
          slug: "office-renovation",
          title_en: "Office renovation",
          title_zh: "办公室装修",
          excerpt_en: "Office upgrade",
          excerpt_zh: "办公室升级",
          content_en: "Detail omitted from the homepage preload",
        }],
        projects: [{
          id: "project",
          slug: "project-one",
          title_en: "Project One",
          title_zh: "项目一",
          excerpt_en: "Project summary",
          excerpt_zh: "项目摘要",
          project_images: [{ image_type: "cover", image_url: "/project.webp", alt_en: "Project", alt_zh: "项目" }],
        }],
        faqs: [{
          id: "faq",
          page_key: "home",
          question_en: "Question?",
          question_zh: "问题？",
          answer_en: "Answer.",
          answer_zh: "答案。",
        }],
      }),
    });

    type getPublishedHomeContentBundle = typeof import("@/lib/homeContentApi")["getPublishedHomeContentBundle"];
    const english = (await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "home_bundle", "en"]) as Awaited<ReturnType<getPublishedHomeContentBundle>>;
    const chinese = (await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "home_bundle", "zh"]) as Awaited<ReturnType<getPublishedHomeContentBundle>>;

    expect(english.data.pageContent?.seo_title).toBe("Home SEO");
    expect(chinese.data.pageContent?.seo_title).toBe("首页 SEO");
    expect(english.data.heroSlides[0]?.buttonLabel).toBe("Get a quote");
    expect(chinese.data.heroSlides[0]?.buttonLabel).toBe("获取报价");
    expect(english.data.services[0]?.summary).toBe("Office upgrade");
    expect(chinese.data.projects[0]?.thumbnailAlt).toBe("项目");
    expect(chinese.data.faqs[0]?.answer).toBe("答案。");
  });

  it("keeps the hydrated homepage aligned with the published site_pages record", async () => {
    setPreloadedPublicData({
      homeContentBundle: {
        cms_pages: [{
          id: "cms-home",
          page_key: "home",
          path: "/",
          title_en: "Old CMS home",
          seo_title_en: "Old CMS home SEO",
          image_url: "/images/heroes/old-home.webp",
        }],
        site_pages: [{
          id: "published-home",
          page_key: "home",
          path: "/",
          title_en: "Published home",
          seo_title_en: "Published home SEO",
          image_url: "/images/heroes/published-home.webp",
          status: "published",
        }],
      },
    });

    type getPublishedHomeContentBundle = typeof import("@/lib/homeContentApi")["getPublishedHomeContentBundle"];
    const result = (await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "home_bundle", "en"]) as Awaited<ReturnType<getPublishedHomeContentBundle>>;

    expect(result.source).toBe("remote");
    expect(result.data.pageContent?.id).toBe("published-home");
    expect(result.data.pageContent?.seo_title).toBe("Published home SEO");
    expect(result.data.pageContent?.image_url).toBe("/images/heroes/published-home.webp");
  });

  it("treats an empty preloaded site page as a resolved CMS result", async () => {
    setPreloadedPublicData({
      sitePages: {
        promotions: {},
      },
    });

    type getPublishedSitePage = typeof import("@/lib/homeContentApi")["getPublishedSitePage"];

    expect((await import("@/lib/publicQuerySeed")).getPublicQuerySeed(["published", "site_page", "en", "promotions"]) as Awaited<ReturnType<getPublishedSitePage>>).toBeNull();
  });
});
