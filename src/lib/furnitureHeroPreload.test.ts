import { describe, expect, it } from "vitest";
import { getDynamicImagePreloads } from "../../functions/publicImagePreloads";
import { buildLocalResponsiveSrcSet, resolveLocalCoverSizes } from "./localResponsiveImage";

const route = { isHomePage: false, projectDetailSlug: null, topLevelPublicPageKey: null };
const hero = "/images/heroes/v20261007/furniture-showcase-wide.webp";

describe("furniture listing LCP discovery", () => {
  it.each(["/en/furniture", "/zh/furniture", "/en/furniture/living/sofa", "/zh/furniture/bedroom"])("preloads only the current responsive hero for %s", (key) => {
    const preloads = getDynamicImagePreloads(key, null, null, null, route);
    expect(preloads).toHaveLength(1);
    expect(preloads[0]).toMatchObject({
      href: "/images/_responsive/heroes/w560/v20261007/furniture-showcase-wide.webp",
      srcSet: buildLocalResponsiveSrcSet(hero, [560, 720, 960, 1200, 1600], 2160),
      sizes: resolveLocalCoverSizes(hero, "(min-width: 1536px) 1440px, (min-width: 1024px) 94vw, 100vw", { width: 3, height: 1 }),
      fetchPriority: "high",
    });
  });

  it.each(["/en/furniture/product/example", "/en/furniture/unknown", "/en/quote", "/zh/locations/bangsar"])("does not add a furniture image request to %s", (key) => {
    expect(getDynamicImagePreloads(key, null, null, null, route)).toEqual([]);
  });
});
