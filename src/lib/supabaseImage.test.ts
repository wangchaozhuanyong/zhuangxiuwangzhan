import { describe, expect, it } from "vitest";
import {
  buildSupabaseSrcSet,
  resolveSupabaseHeightForWidth,
} from "@/lib/supabaseImage";

const publicImageUrl = "https://example.supabase.co/storage/v1/object/public/site-images/projects/sample.webp";

describe("supabaseImage", () => {
  it("derives each responsive height from the target container ratio", () => {
    const srcSet = buildSupabaseSrcSet(publicImageUrl, [360, 560, 720, 960], {
      quality: 84,
      resize: "cover",
      targetAspectRatio: { width: 4, height: 5 },
    });

    expect(srcSet).toBeTruthy();
    const variants = (srcSet || "").split(", ").map((candidate) => {
      const [url, descriptor] = candidate.split(" ");
      const params = new URL(url).searchParams;
      return {
        descriptor,
        width: params.get("width"),
        height: params.get("height"),
        resize: params.get("resize"),
        format: params.get("format"),
      };
    });

    expect(variants).toEqual([
      { descriptor: "360w", width: "360", height: "450", resize: "cover", format: "webp" },
      { descriptor: "560w", width: "560", height: "700", resize: "cover", format: "webp" },
      { descriptor: "720w", width: "720", height: "900", resize: "cover", format: "webp" },
      { descriptor: "960w", width: "960", height: "1200", resize: "cover", format: "webp" },
    ]);
  });

  it("keeps the existing fixed-height behavior when no target ratio is provided", () => {
    const srcSet = buildSupabaseSrcSet(publicImageUrl, [360, 720], { height: 600 });

    expect(srcSet).toContain("width=360&height=600");
    expect(srcSet).toContain("width=720&height=600");
  });

  it("falls back safely when the target ratio is invalid", () => {
    expect(resolveSupabaseHeightForWidth(720, { width: 0, height: 5 }, 600)).toBe(600);
  });
});
