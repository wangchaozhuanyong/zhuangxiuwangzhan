import { describe, expect, it } from "vitest";

import { pageHeroImages, resolvePageHeroImage } from "./pageHeroImages";

describe("resolvePageHeroImage", () => {
  it("keeps the managed responsive set when the CMS stores its desktop source", () => {
    const resolved = resolvePageHeroImage(pageHeroImages.services.desktop, pageHeroImages.services);

    expect(resolved).toMatchObject({
      desktop: pageHeroImages.services.desktop,
      tablet: pageHeroImages.services.tablet,
      mobile: pageHeroImages.services.mobile,
      claimLevel: "rendering_concept",
    });
  });

  it("uses one source without a concept claim for a custom CMS image", () => {
    const customImage = "/images/uploads/verified-real-project.webp";
    const resolved = resolvePageHeroImage(customImage, pageHeroImages.services);

    expect(resolved).toMatchObject({
      desktop: customImage,
      tablet: customImage,
      mobile: customImage,
      claimLevel: undefined,
    });
  });
});
