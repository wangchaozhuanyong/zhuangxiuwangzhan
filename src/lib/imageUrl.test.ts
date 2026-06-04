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

  it("does not rewrite root logo PNG to WebP", () => {
    expect(optimizeContentImageSrc("https://flashcast.com.my/logo-flashcast.png")).toBe(
      "/logo-flashcast.png",
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
});
