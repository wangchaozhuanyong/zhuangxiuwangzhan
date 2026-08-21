export type PublicNavGroupKey = "spaces" | "services" | "studio" | "contact";

export type PublicNavIconKey =
  | "home"
  | "projects"
  | "beforeAfter"
  | "services"
  | "oldHouse"
  | "materials"
  | "products"
  | "promotions"
  | "about"
  | "process"
  | "blog"
  | "faq"
  | "locations"
  | "contact"
  | "quote";

export type PublicNavItem = {
  labelKey: string;
  path: string;
  icon: PublicNavIconKey;
  previewImage: string;
};

export type PublicNavGroup = {
  key: PublicNavGroupKey;
  items: readonly PublicNavItem[];
};

const previewImages = {
  spaces: "/images/heroes/v2/hero-projects-premium.webp",
  services: "/images/heroes/v2/hero-services-premium.webp",
  studio: "/images/heroes/v2/hero-about-premium.webp",
  contact: "/images/heroes/v2/hero-contact-premium.webp",
} as const;

export const publicNavigationGroups: readonly PublicNavGroup[] = [
  {
    key: "spaces",
    items: [
      { labelKey: "nav.home", path: "/", icon: "home", previewImage: "/images/heroes/hero-luxury-living.webp" },
      { labelKey: "nav.projects", path: "/projects", icon: "projects", previewImage: previewImages.spaces },
      { labelKey: "nav.beforeAfter", path: "/before-after", icon: "beforeAfter", previewImage: "/images/before-after/after-living.webp" },
    ],
  },
  {
    key: "services",
    items: [
      { labelKey: "nav.services", path: "/services", icon: "services", previewImage: previewImages.services },
      { labelKey: "nav.oldHouse", path: "/services/old-house", icon: "oldHouse", previewImage: "/images/heroes/v2/hero-old-house-premium.webp" },
      { labelKey: "nav.materials", path: "/materials", icon: "materials", previewImage: "/images/heroes/v2/hero-materials-premium.webp" },
      { labelKey: "nav.products", path: "/products", icon: "products", previewImage: "/images/services/builtin-solutions.webp" },
      { labelKey: "nav.promotions", path: "/promotions", icon: "promotions", previewImage: previewImages.contact },
    ],
  },
  {
    key: "studio",
    items: [
      { labelKey: "nav.about", path: "/about", icon: "about", previewImage: previewImages.studio },
      { labelKey: "nav.process", path: "/process", icon: "process", previewImage: "/images/heroes/v2/hero-process-premium.webp" },
      { labelKey: "nav.blog", path: "/blog", icon: "blog", previewImage: "/images/heroes/v2/hero-blog-premium.webp" },
      { labelKey: "nav.faq", path: "/faq", icon: "faq", previewImage: "/images/heroes/v2/hero-faq-premium.webp" },
    ],
  },
  {
    key: "contact",
    items: [
      { labelKey: "nav.locations", path: "/locations", icon: "locations", previewImage: previewImages.contact },
      { labelKey: "nav.contact", path: "/contact", icon: "contact", previewImage: previewImages.contact },
      { labelKey: "nav.quote", path: "/quote", icon: "quote", previewImage: "/images/heroes/v2/hero-quote-premium.webp" },
    ],
  },
] as const;

export const publicNavigationItems: PublicNavItem[] = publicNavigationGroups.flatMap((group) => [...group.items]);

export const primaryPublicNavigationItems = publicNavigationItems.filter((item) =>
  ["/", "/projects", "/services", "/materials"].includes(item.path),
);

export const findPublicNavigationItem = (path: string) =>
  publicNavigationItems.find((item) => item.path === path);
