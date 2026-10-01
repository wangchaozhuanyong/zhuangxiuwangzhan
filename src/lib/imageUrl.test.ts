import { describe, expect, it } from "vitest";
import { optimizeContentImageSrc, toLocalStaticImageSrc } from "@/lib/imageUrl";
import {
  buildLocalResponsiveSrcSet,
  toLocalResponsiveImageSrc,
  toVersionedLocalResponsiveImageSrc,
} from "@/lib/localResponsiveImage";
import { toSupabaseRenderImageUrl } from "@/lib/supabaseImage";

describe("imageUrl", () => {
  it("normalizes production static image URLs to local paths", () => {
    expect(toLocalStaticImageSrc("https://flashcast.com.my/images/services/renovation-works.jpg")).toBe(
      "/images/services/renovation-works.jpg",
    );
  });

  it("prefers local WebP assets for normalized static images", () => {
    expect(optimizeContentImageSrc("https://flashcast.com.my/images/services/renovation-works.jpg")).toBe(
      "/images/services/renovation-works.webp",
    );
  });

  it("rewrites the built-in root logo PNG to WebP", () => {
    expect(optimizeContentImageSrc("https://flashcast.com.my/logo-flashcast.png")).toBe(
      "/logo-flashcast-20260605.webp",
    );
  });

  it("keeps query strings when rewriting the built-in root logo PNG to WebP", () => {
    expect(optimizeContentImageSrc("/logo-flashcast.png?v=20260605")).toBe(
      "/logo-flashcast-20260605.webp?v=20260605",
    );
  });

  it("rewrites the old built-in root logo WebP to the cache-safe versioned URL", () => {
    expect(optimizeContentImageSrc("/logo-flashcast.webp")).toBe(
      "/logo-flashcast-20260605.webp",
    );
  });

  it("requests WebP from Supabase render images by default", () => {
    expect(
      toSupabaseRenderImageUrl(
        "https://example.supabase.co/storage/v1/object/public/site-images/projects/sample.webp",
        { width: 800, height: 600 },
      ),
    ).toContain("format=webp");
  });

  it("builds responsive project image variants for local portfolio images", () => {
    expect(toLocalResponsiveImageSrc("/images/projects/generated-portfolio/sample.webp", 480)).toBe(
      "/images/_responsive/projects/w560/generated-portfolio/sample.webp",
    );
    expect(buildLocalResponsiveSrcSet("/images/projects/sample.webp", [360, 560, 720])).toBe(
      "/images/_responsive/projects/w360/sample.webp 360w, /images/_responsive/projects/w560/sample.webp 560w, /images/_responsive/projects/w720/sample.webp 720w",
    );
  });

  it("builds responsive variants for local service, material, and hero images", () => {
    expect(toLocalResponsiveImageSrc("/images/services/kitchen-renovation.webp", 360)).toBe(
      "/images/_responsive/services/w360/content-20260930/kitchen.webp",
    );
    expect(toLocalResponsiveImageSrc("/images/materials/category-kitchen-cabinets.webp?v=1", 640)).toBe(
      "/images/_responsive/materials/w720/content-20261001/melamine-cabinet.webp?v=1",
    );
    expect(toLocalResponsiveImageSrc("/images/heroes/v2/hero-services-premium-mobile.webp", 720)).toBe(
      "/images/_responsive/heroes/w720/v2/hero-services-premium-mobile.webp",
    );
    expect(toLocalResponsiveImageSrc("/images/before-after/before-kitchen.webp", 560)).toBe(
      "/images/_responsive/before-after/w560/old-terrace-concept-v2/kitchen-before.webp",
    );
  });

  it("moves refreshed local images onto cache-safe versioned paths", () => {
    expect(toVersionedLocalResponsiveImageSrc("/images/services/old-house-renovation.webp")).toBe(
      "/images/services/v20260824/old-house-renovation.webp",
    );
    expect(
      toVersionedLocalResponsiveImageSrc(
        "/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp?fit=cover#preview",
      ),
    ).toBe(
      "/images/projects/v20260824/generated-portfolio/mont-kiara-luxury-condo-renovation.webp?fit=cover#preview",
    );
    expect(toVersionedLocalResponsiveImageSrc("/images/services/kitchen-renovation.webp")).toBe(
      "/images/services/content-20260930/kitchen.webp",
    );
  });

  it("serves the new high-resolution material photo through the published image URL", () => {
    const srcSet = buildLocalResponsiveSrcSet("/images/materials/kitchen-acrylic-cabinets.webp?v=2", [560, 720, 1200, 1600], 1600);
    expect(srcSet).toContain("/images/_responsive/materials/w1200/v20260928/kitchen-acrylic-cabinets.webp?v=2 1200w");
    expect(srcSet).toContain("/images/_responsive/materials/w1600/v20260928/kitchen-acrylic-cabinets.webp?v=2 1600w");
    expect(srcSet).toContain("/images/materials/v20260928/kitchen-acrylic-cabinets.webp?v=2 2400w");
    const fallbackSrcSet = buildLocalResponsiveSrcSet("/images/materials/acrylic-high-gloss-white.webp", [1200, 1600], 1600);
    expect(fallbackSrcSet).toContain("/images/_responsive/materials/w1600/v20260928/acrylic-high-gloss-white.webp 1600w");
    expect(fallbackSrcSet).toContain("/images/materials/v20260928/acrylic-high-gloss-white.webp 2400w");
  });

  it("includes the original's real pixels beyond the largest generated image", () => {
    const srcSet = buildLocalResponsiveSrcSet("/images/heroes/v6/home-daylight-mobile.webp", [360, 560, 720]);
    expect(srcSet).toContain("/images/heroes/v6/home-daylight-mobile.webp 887w");
  });
});
