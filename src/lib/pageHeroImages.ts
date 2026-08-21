type PageHeroImage = {
  desktop: string;
  mobile: string;
  legacy?: readonly string[];
};

export const pageHeroImages = {
  about: {
    desktop: "/images/heroes/v2/hero-about-premium.webp",
    mobile: "/images/heroes/v2/hero-about-premium-mobile.webp",
    legacy: ["/images/heroes/hero-about.webp"],
  },
  services: {
    desktop: "/images/heroes/v2/hero-services-premium.webp",
    mobile: "/images/heroes/v2/hero-services-premium-mobile.webp",
    legacy: ["/images/heroes/hero-services.webp"],
  },
  projects: {
    desktop: "/images/heroes/v2/hero-projects-premium.webp",
    mobile: "/images/heroes/v2/hero-projects-premium-mobile.webp",
    legacy: ["/images/heroes/hero-projects.webp"],
  },
  materials: {
    desktop: "/images/heroes/v2/hero-materials-premium.webp",
    mobile: "/images/heroes/v2/hero-materials-premium-mobile.webp",
    legacy: ["/images/heroes/hero-materials.webp"],
  },
  products: {
    desktop: "/images/heroes/v2/hero-materials-premium.webp",
    mobile: "/images/heroes/v2/hero-materials-premium-mobile.webp",
    legacy: ["/images/materials/kitchen-acrylic-cabinets.webp"],
  },
  promotions: {
    desktop: "/images/heroes/v2/hero-quote-premium.webp",
    mobile: "/images/heroes/v2/hero-quote-premium-mobile.webp",
    legacy: ["/images/materials/kitchen-solid-wood-cabinets.webp"],
  },
  locations: {
    desktop: "/images/projects/commercial-renovation.webp",
    mobile: "/images/heroes/v2/hero-services-premium-mobile.webp",
  },
  process: {
    desktop: "/images/heroes/v2/hero-process-premium.webp",
    mobile: "/images/heroes/v2/hero-process-premium-mobile.webp",
    legacy: ["/images/heroes/hero-process.webp"],
  },
  faq: {
    desktop: "/images/heroes/v2/hero-faq-premium.webp",
    mobile: "/images/heroes/v2/hero-faq-premium-mobile.webp",
    legacy: ["/images/heroes/hero-faq.webp"],
  },
  contact: {
    desktop: "/images/heroes/v2/hero-contact-premium.webp",
    mobile: "/images/heroes/v2/hero-contact-premium-mobile.webp",
    legacy: ["/images/heroes/hero-contact.webp"],
  },
  quote: {
    desktop: "/images/heroes/v2/hero-quote-premium.webp",
    mobile: "/images/heroes/v2/hero-quote-premium-mobile.webp",
    legacy: ["/images/heroes/hero-quote.webp"],
  },
  blog: {
    desktop: "/images/heroes/v2/hero-blog-premium.webp",
    mobile: "/images/heroes/v2/hero-blog-premium-mobile.webp",
    legacy: ["/images/heroes/hero-materials.webp"],
  },
  oldHouse: {
    desktop: "/images/heroes/v2/hero-old-house-premium.webp",
    mobile: "/images/heroes/v2/hero-old-house-premium-mobile.webp",
    legacy: ["/src/assets/old-house-hero.webp"],
  },
} as const satisfies Record<string, PageHeroImage>;

export const resolvePageHeroImage = (publishedImage: string | null | undefined, fallback: PageHeroImage) => {
  const image = publishedImage?.trim();
  const shouldUseFallback = !image || fallback.legacy?.includes(image);
  const desktop = shouldUseFallback ? fallback.desktop : image;

  return {
    desktop,
    // The CMS currently stores one wide hero only. Keep that editorial image on
    // desktop, while the route-level portrait art direction protects mobile
    // sharpness and composition until a dedicated CMS mobile field exists.
    mobile: fallback.mobile,
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
