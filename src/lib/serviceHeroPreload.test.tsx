import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { getDynamicImagePreloads } from "../../functions/publicImagePreloads";
import { SchemeARouteHero } from "@/components/scheme-a/SchemeARoutePrimitives";
import { mapSitePageRows } from "@/lib/homeContentApi";
import { pageHeroImages, resolvePageHeroImage } from "@/lib/pageHeroImages";

vi.mock("@/components/ImmersiveHero", () => ({ default: ({ children }: { children: ReactNode }) => <section>{children}</section> }));

const route = { isHomePage: false, projectDetailSlug: null, topLevelPublicPageKey: "services" };
type Bundle = Record<string, unknown>;

function assertMatchesRenderedHero(language: "en" | "zh", bundle: Bundle | null) {
  const page = mapSitePageRows(bundle || {}, language);
  const image = resolvePageHeroImage(page?.image_url, pageHeroImages.services);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() => root.render(<SchemeARouteHero kind="listing" image={image.desktop} imageSourceWidth={image.desktopWidth}
      tabletImage={image.tablet} tabletImageSourceWidth={image.tabletWidth} mobileImage={image.mobile} mobileImageSourceWidth={image.mobileWidth}
      imageAlt="Service space" label="Services" title="Services" description="Planning your space" />));
    const preloads = getDynamicImagePreloads(`/${language}/services`, null, null, null, { ...route, publicPageBundle: bundle });
    expect(preloads).toHaveLength(3);
    const sources = container.querySelectorAll("picture source");
    for (const [index, source] of Array.from(sources).entries()) {
      expect(preloads[index].media).toBe(source.getAttribute("media"));
      expect(preloads[index].srcSet || preloads[index].href).toBe(source.getAttribute("srcset"));
      expect(preloads[index].sizes).toBe(source.getAttribute("sizes"));
      expect(preloads[index].fetchPriority).toBe("high");
    }
    const img = container.querySelector("img")!;
    expect(preloads[2].srcSet).toBe(img.getAttribute("srcset"));
    expect(preloads[2].sizes).toBe(img.getAttribute("sizes"));
    expect(preloads[2].href).toBe(img.getAttribute("src"));
    return preloads;
  } finally {
    act(() => root.unmount());
    container.remove();
  }
}

describe("service listing first image discovery", () => {
  it.each(["en", "zh"] as const)("matches actual fallback picture requests in %s", language => {
    assertMatchesRenderedHero(language, null);
    const preloads = assertMatchesRenderedHero(language, { site_pages: [{ image_url: "/images/heroes/hero-services.webp" }] });
    expect(preloads[0].href).toContain("hero-services-v5-desktop.webp");
  });

  it.each(["en", "zh"] as const)("uses only the published %s CMS hero with exact mobile/tablet/desktop transforms", language => {
    const remote = "https://fixture.supabase.co/storage/v1/object/public/media/current-service.webp";
    const bundle = {
      site_pages: [{ page_key: "services", image_url: "/images/heroes/hero-services.webp" }],
      cms_pages: [{ cms_sections: [
        { section_type: "hero", status: "draft", sort_order: 0, content_en: { image_url: "/images/heroes/private.webp" }, content_zh: { image_url: "/images/heroes/private.webp" } },
        { section_key: "hero", status: "published", deleted_at: "2026-10-10", sort_order: 1, content_en: { image_url: "/images/heroes/withdrawn.webp" } },
        { section_type: " Hero ", status: "published", sort_order: 2, content_en: { image_url: remote }, content_zh: { image_url: `${remote}?locale=zh` } },
      ] }],
    };
    const preloads = assertMatchesRenderedHero(language, bundle);
    expect(preloads[0].href).toContain("width=560&height=385&resize=cover&format=webp");
    expect(preloads[1].href).toContain("quality=84&width=720&height=495");
    expect(preloads[2].href).not.toContain("private");
    expect(preloads[2].href).not.toContain("withdrawn");
  });

  it("does not preload another language's missing CMS hero", () => {
    const preloads = assertMatchesRenderedHero("zh", { cms_pages: [{ cms_sections: [
      { section_type: "hero", status: "published", content_en: { image_url: "https://fixture.supabase.co/storage/v1/object/public/media/english-only.webp" } },
    ] }] });
    expect(preloads[0].href).toContain("hero-services-v5-desktop.webp");
  });

  it("matches CMS absolute static picture sources without speculatively downloading different mobile variants", () => {
    const preloads = assertMatchesRenderedHero("en", { site_pages: [{
      image_url: "https://flashcast.com.my/images/heroes/v5/hero-services-v5-desktop.webp",
    }] });
    expect(preloads[0].href).toBe("https://flashcast.com.my/images/heroes/v5/hero-services-v5-desktop.webp");
    expect(preloads[0].srcSet).toBeUndefined();
    expect(preloads[2].href).toContain("/images/_responsive/heroes/w560/");
  });
});
