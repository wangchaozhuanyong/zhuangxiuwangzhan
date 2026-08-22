export const BLOG_TOPIC_KEYS = [
  "budget-quotation",
  "home-condo-approval",
  "kitchen-cabinetry",
  "bathroom-waterproofing",
  "office-retail-fitout",
  "materials-design",
] as const;

export type BlogTopicKey = (typeof BLOG_TOPIC_KEYS)[number];

export const BLOG_TOPIC_SERVICE_PATHS: Record<BlogTopicKey, string> = {
  "budget-quotation": "/services/renovation",
  "home-condo-approval": "/services/approval",
  "kitchen-cabinetry": "/services/kitchen",
  "bathroom-waterproofing": "/services/bathroom",
  "office-retail-fitout": "/services/office-renovation",
  "materials-design": "/materials",
};

const BLOG_SLUG_TOPICS: Record<string, BlogTopicKey> = {
  "rental-unit-renovation-kl": "home-condo-approval",
  "renovation-payment-schedule-malaysia": "budget-quotation",
  "spc-vs-vinyl-flooring-malaysia": "materials-design",
  "custom-wardrobe-price-malaysia": "kitchen-cabinetry",
  "office-reinstatement-vs-renovation": "office-retail-fitout",
  "shoplot-renovation-permit-malaysia": "office-retail-fitout",
  "landed-house-renovation-selangor": "home-condo-approval",
  "dry-wet-kitchen-renovation-malaysia": "kitchen-cabinetry",
  "area-guide-kl-selangor-renovation": "home-condo-approval",
  "renovation-quotation-checklist-malaysia": "budget-quotation",
  "built-in-furniture-small-condo-storage": "kitchen-cabinetry",
  "renovation-materials-for-malaysia-climate": "materials-design",
  "old-house-renovation-hidden-costs-malaysia": "home-condo-approval",
  "shop-renovation-opening-timeline-malaysia": "office-retail-fitout",
  "office-fit-out-checklist-selangor": "office-retail-fitout",
  "bathroom-leakage-renovation-malaysia": "bathroom-waterproofing",
  "kitchen-cabinet-price-malaysia": "kitchen-cabinetry",
  "condo-renovation-management-approval-malaysia": "home-condo-approval",
  "klang-valley-renovation-cost-2026": "budget-quotation",
  "renovation-materials-malaysia": "materials-design",
  "shop-renovation-before-opening": "office-retail-fitout",
  "selangor-office-fit-out-tips": "office-retail-fitout",
  "kl-condo-renovation-approval": "home-condo-approval",
  "bathroom-waterproofing-guide": "bathroom-waterproofing",
  "old-house-renovation-checklist": "home-condo-approval",
  "kitchen-cabinet-material-guide": "kitchen-cabinetry",
  "malaysia-renovation-budget-guide": "budget-quotation",
  "modern-warm-minimalist-home-design-malaysia": "materials-design",
  "small-condo-storage-design-ideas": "kitchen-cabinetry",
  "artistic-wall-coating-guide-remmers": "materials-design",
  "built-in-cabinet-cost-malaysia": "kitchen-cabinetry",
  "how-to-choose-renovation-contractor-kl": "home-condo-approval",
  "renovation-cost-malaysia-2025": "budget-quotation",
  "how-to-plan-condo-renovation-kl": "home-condo-approval",
  "renovation-permit-dbkl-guide": "home-condo-approval",
  "spc-vinyl-vs-laminate-flooring": "materials-design",
  "office-renovation-checklist-malaysia": "office-retail-fitout",
  "feature-wall-ideas-2025": "materials-design",
  "restaurant-fit-out-planning-checklist-malaysia": "office-retail-fitout",
  "kitchen-renovation-quotation-checklist-malaysia": "kitchen-cabinetry",
  "bathroom-renovation-quotation-checklist-malaysia": "bathroom-waterproofing",
  "bathroom-waterproofing-drainage-planning-malaysia": "bathroom-waterproofing",
  "office-fit-out-me-it-planning-checklist-malaysia": "office-retail-fitout",
  "renovation-handover-defect-checklist-malaysia": "home-condo-approval",
};

const LEGACY_CATEGORY_TOPICS: Record<string, BlogTopicKey> = {
  budget: "budget-quotation",
  rental: "home-condo-approval",
  residential: "home-condo-approval",
  condo: "home-condo-approval",
  "old house": "home-condo-approval",
  "local seo": "home-condo-approval",
  kitchen: "kitchen-cabinetry",
  "built-in": "kitchen-cabinetry",
  bathroom: "bathroom-waterproofing",
  office: "office-retail-fitout",
  retail: "office-retail-fitout",
  materials: "materials-design",
  inspiration: "materials-design",
};

const normalize = (value: string) => value.trim().toLowerCase();

export const isBlogTopicKey = (value: string): value is BlogTopicKey =>
  BLOG_TOPIC_KEYS.includes(normalize(value) as BlogTopicKey);

export const resolveBlogTopic = (category: string, slug = ""): BlogTopicKey => {
  const normalizedCategory = normalize(category);
  if (isBlogTopicKey(normalizedCategory)) return normalizedCategory;
  return BLOG_SLUG_TOPICS[slug] || LEGACY_CATEGORY_TOPICS[normalizedCategory] || "home-condo-approval";
};

export const BLOG_LEGACY_REDIRECTS = [
  { from: "renovation-cost-malaysia-2025", to: "malaysia-renovation-budget-guide" },
  { from: "renovation-materials-for-malaysia-climate", to: "renovation-materials-malaysia" },
  { from: "spc-vs-vinyl-flooring-malaysia", to: "spc-vinyl-vs-laminate-flooring" },
  { from: "office-fit-out-checklist-selangor", to: "office-renovation-checklist-malaysia" },
  { from: "shop-renovation-opening-timeline-malaysia", to: "shop-renovation-before-opening" },
  { from: "kl-condo-renovation-approval", to: "condo-renovation-management-approval-malaysia" },
] as const;
