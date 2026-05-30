import { describe, expect, it } from "vitest";
import { optimizeContentImageSrc, toLocalStaticImageSrc } from "@/lib/imageUrl";

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
});
