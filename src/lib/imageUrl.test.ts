import { describe, expect, it } from "vitest";
import { optimizeContentImageSrc, toLocalStaticImageSrc } from "@/lib/imageUrl";
import { buildLocalResponsiveSrcSet, toLocalResponsiveImageSrc } from "@/lib/localResponsiveImage";
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
      "/images/_responsive/services/w360/kitchen-renovation.webp",
    );
    expect(toLocalResponsiveImageSrc("/images/materials/category-kitchen-cabinets.webp?v=1", 640)).toBe(
      "/images/_responsive/materials/w720/category-kitchen-cabinets.webp?v=1",
    );
    expect(toLocalResponsiveImageSrc("/images/heroes/v2/hero-services-premium-mobile.webp", 720)).toBe(
      "/images/_responsive/heroes/w720/v2/hero-services-premium-mobile.webp",
    );
    expect(toLocalResponsiveImageSrc("/images/before-after/before-kitchen.webp", 560)).toBe(
      "/images/_responsive/before-after/w560/before-kitchen.webp",
    );
  });
});
