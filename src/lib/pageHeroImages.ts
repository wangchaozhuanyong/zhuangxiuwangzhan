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
    mobile: desktop === fallback.desktop ? fallback.mobile : undefined,
  };
};
