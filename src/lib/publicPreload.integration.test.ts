import { afterEach, describe, expect, it, vi } from "vitest";

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
  it("uses preloaded site settings before reading Supabase", async () => {
    setPreloadedPublicData({
      siteSettings: {
        company_name: "FLASH CAST Test",
        logo_url: "/logo-flashcast.png",
      },
    });

    const { fetchSiteSettings, resolveSiteSettings } = await import("@/lib/siteSettingsApi");
    const settings = resolveSiteSettings(await fetchSiteSettings(), "zh");

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

    const { getPublishedBlogPosts, getPublishedMaterials, getPublishedServices } = await import("@/lib/contentApi");

    expect((await getPublishedServices("en"))[0]?.title).toBe("Office Renovation");
    expect((await getPublishedMaterials("en"))[0]?.items[0]?.name).toBe("Vinyl Plank");
    const blogPost = (await getPublishedBlogPosts("en"))[0];
    expect(blogPost?.title).toBe("Renovation Guide");
    expect(blogPost?.imageAlt).toBe("Renovation planning guide cover");
    expect(blogPost?.seoTitle).toBe("Renovation Planning Guide | FLASH CAST");
    expect(blogPost?.seoDescription).toBe("Plan a renovation with a clear scope and material direction.");
    expect(blogPost?.updatedAt).toBe("2026-06-03T08:00:00.000Z");
    expect(blogPost?.readTime).toBe("1 min");
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

    const { getPublishedCtaBlock, getPublishedSitePage } = await import("@/lib/homeContentApi");

    expect((await getPublishedSitePage("en", "services"))?.seo_title).toBe("Services SEO");
    expect((await getPublishedCtaBlock("en", "home_final"))?.title).toBe("Start your renovation");
  });

  it("keeps preloaded homepage brands hidden when the visibility setting is off", async () => {
    setPreloadedPublicData({
      homeContentBundle: {
        home_sections: [{ section_key: "brand_partners", status: "draft" }],
        brand_partners: [{ id: "brand-1", name: "Test Brand", logo_url: "/images/brands/test.webp" }],
      },
    });

    const { getPublishedHomeContentBundle } = await import("@/lib/homeContentApi");
    const result = await getPublishedHomeContentBundle("en");

    expect(result.source).toBe("remote");
    expect(result.data.brandPartners).toHaveLength(1);
    expect(result.data.brandPartnersEnabled).toBe(false);
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

    const { getPublishedHomeContentBundle } = await import("@/lib/homeContentApi");
    const result = await getPublishedHomeContentBundle("en");

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

    const { getPublishedSitePage } = await import("@/lib/homeContentApi");

    expect(await getPublishedSitePage("en", "promotions")).toBeNull();
  });
});
