type PageHeroImage = {
  desktop: string;
  mobile: string;
  tablet?: string;
  desktopWidth?: number;
  tabletWidth?: number;
  mobileWidth?: number;
  imagePosition?: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  claimLevel?: "rendering_concept";
  legacy?: readonly string[];
};

export const pageHeroImages = {
  about: {
    desktop: "/images/heroes/v5/hero-about-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-about-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-about-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "54% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-about.webp", "/images/heroes/v2/hero-about-premium.webp", "/images/heroes/v3/hero-about-v3-desktop.webp"],
  },
  services: {
    desktop: "/images/heroes/v5/hero-services-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-services-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-services-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "58% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-services.webp", "/images/heroes/v2/hero-services-premium.webp", "/images/heroes/v3/hero-services-v3-desktop.webp"],
  },
  projects: {
    desktop: "/images/heroes/v5/hero-projects-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-projects-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-projects-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "55% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-projects.webp", "/images/heroes/v2/hero-projects-premium.webp", "/images/heroes/v3/hero-projects-v3-desktop.webp"],
  },
  materials: {
    desktop: "/images/heroes/v5/hero-materials-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-materials-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-materials-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "52% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-materials.webp", "/images/heroes/v2/hero-materials-premium.webp", "/images/heroes/v3/hero-materials-v3-desktop.webp"],
  },
  products: {
    desktop: "/images/heroes/v5/hero-products-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-products-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-products-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "58% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: [
      "/images/materials/kitchen-acrylic-cabinets.webp",
      "/images/heroes/v2/hero-materials-premium.webp",
      "/images/heroes/v3/hero-products-v3-desktop.webp",
    ],
  },
  promotions: {
    desktop: "/images/heroes/v5/hero-promotions-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-promotions-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-promotions-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "55% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/materials/kitchen-solid-wood-cabinets.webp", "/images/heroes/v2/hero-quote-premium.webp"],
  },
  locations: {
    desktop: "/images/heroes/v5/hero-locations-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-locations-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-locations-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "50% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/projects/commercial-renovation.webp", "/images/heroes/v2/hero-projects-premium.webp", "/images/heroes/v3/hero-locations-v3-desktop.webp"],
  },
  process: {
    desktop: "/images/heroes/v5/hero-process-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-process-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-process-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "50% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-process.webp", "/images/heroes/v2/hero-process-premium.webp", "/images/heroes/v3/hero-process-v3-desktop.webp"],
  },
  faq: {
    desktop: "/images/heroes/v5/hero-faq-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-faq-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-faq-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "50% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-faq.webp", "/images/heroes/v2/hero-faq-premium.webp", "/images/heroes/v3/hero-faq-v3-desktop.webp"],
  },
  contact: {
    desktop: "/images/heroes/v5/hero-contact-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-contact-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-contact-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "60% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-contact.webp", "/images/heroes/v2/hero-contact-premium.webp", "/images/heroes/v3/hero-contact-v3-desktop.webp"],
  },
  quote: {
    desktop: "/images/heroes/v5/hero-quote-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-quote-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-quote-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "52% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-quote.webp", "/images/heroes/v2/hero-quote-premium.webp", "/images/heroes/v3/hero-quote-v3-desktop.webp"],
  },
  blog: {
    desktop: "/images/heroes/v5/hero-blog-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-blog-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-blog-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "50% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/images/heroes/hero-materials.webp", "/images/heroes/v2/hero-blog-premium.webp", "/images/heroes/v3/hero-blog-v3-desktop.webp"],
  },
  oldHouse: {
    desktop: "/images/heroes/v5/hero-old-house-v5-desktop.webp",
    desktopWidth: 1536,
    tablet: "/images/heroes/v5/hero-old-house-v5-tablet.webp",
    tabletWidth: 1024,
    mobile: "/images/heroes/v5/hero-old-house-v5-mobile.webp",
    mobileWidth: 1024,
    imagePosition: { desktop: "55% center", tablet: "center", mobile: "center" },
    claimLevel: "rendering_concept",
    legacy: ["/src/assets/old-house-hero.webp", "/images/heroes/v2/hero-old-house-premium.webp"],
  },
} as const satisfies Record<string, PageHeroImage>;

export const resolvePageHeroImage = (publishedImage: string | null | undefined, fallback: PageHeroImage) => {
  const image = publishedImage?.trim();
  const shouldUseFallback = !image || image === fallback.desktop || fallback.legacy?.includes(image);
  const desktop = shouldUseFallback ? fallback.desktop : image;

  return {
    desktop,
    // A CMS-provided hero has no verified tablet/mobile pair yet, so keep one
    // evidence level across breakpoints. Known legacy defaults are replaced by
    // the complete v3 art-directed set below.
    tablet: shouldUseFallback ? fallback.tablet : desktop,
    mobile: shouldUseFallback ? fallback.mobile : desktop,
    desktopWidth: shouldUseFallback ? fallback.desktopWidth : undefined,
    tabletWidth: shouldUseFallback ? fallback.tabletWidth : undefined,
    mobileWidth: shouldUseFallback ? fallback.mobileWidth : undefined,
    imagePosition: shouldUseFallback ? fallback.imagePosition : undefined,
    claimLevel: shouldUseFallback ? fallback.claimLevel : undefined,
  };
};

const resizeUnsplashHero = (source: string, width: number, height: number) => {
  try {
    const url = new URL(source);
    if (url.hostname !== "images.unsplash.com") return source;

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("crop", "entropy");
    url.searchParams.set("q", "86");
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    return url.toString();
  } catch {
    return source;
  }
};

/**
 * Article images arrive from the CMS as one source. Unsplash URLs commonly
 * carry an old 800px query, so create explicit desktop and portrait requests
 * instead of stretching that thumbnail across a full-bleed hero.
 */
export const resolveEditorialHeroImage = (publishedImage: string | null | undefined, fallback: PageHeroImage) => {
  const image = publishedImage?.trim();
  if (!image) return { desktop: fallback.desktop, mobile: fallback.mobile };

  const desktop = resizeUnsplashHero(image, 1800, 1100);
  const mobile = resizeUnsplashHero(image, 900, 1200);

  return {
    desktop,
    // Local/CMS assets do not expose a portrait derivative. Use the approved
    // editorial portrait instead of enlarging a landscape thumbnail on phones.
    mobile: mobile === image ? fallback.mobile : mobile,
  };
};
