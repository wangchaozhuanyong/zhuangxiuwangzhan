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

  it.each(["about", "process", "faq", "contact", "quote", "blog", "locations"] as const)(
    "keeps the %s v3 desktop, tablet, and mobile concept set",
    (page) => {
      const expected = pageHeroImages[page];
      const resolved = resolvePageHeroImage(expected.desktop, expected);

      expect(resolved).toMatchObject({
        desktop: expected.desktop,
        desktopWidth: expected.desktopWidth,
        tablet: expected.tablet,
        tabletWidth: expected.tabletWidth,
        mobile: expected.mobile,
        mobileWidth: expected.mobileWidth,
        claimLevel: "rendering_concept",
      });
    },
  );

  it.each(["about", "process", "faq", "contact", "quote", "blog", "locations"] as const)(
    "maps a legacy %s CMS source to its managed responsive v3 set",
    (page) => {
      const expected = pageHeroImages[page];
      const resolved = resolvePageHeroImage(expected.legacy[0], expected);

      expect(resolved).toMatchObject({
        desktop: expected.desktop,
        tablet: expected.tablet,
        mobile: expected.mobile,
        claimLevel: "rendering_concept",
      });
    },
  );
});
