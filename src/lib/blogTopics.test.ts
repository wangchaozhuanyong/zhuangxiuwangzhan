import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BLOG_LEGACY_REDIRECTS, BLOG_TOPIC_KEYS, resolveBlogTopic } from "@/lib/blogTopics";

const expectedTopics = {
  "budget-quotation": [
    "renovation-payment-schedule-malaysia",
    "renovation-quotation-checklist-malaysia",
    "klang-valley-renovation-cost-2026",
    "malaysia-renovation-budget-guide",
    "renovation-cost-malaysia-2025",
  ],
  "home-condo-approval": [
    "rental-unit-renovation-kl",
    "landed-house-renovation-selangor",
    "area-guide-kl-selangor-renovation",
    "old-house-renovation-hidden-costs-malaysia",
    "condo-renovation-management-approval-malaysia",
    "kl-condo-renovation-approval",
    "old-house-renovation-checklist",
    "how-to-choose-renovation-contractor-kl",
    "how-to-plan-condo-renovation-kl",
    "renovation-permit-dbkl-guide",
  ],
  "kitchen-cabinetry": [
    "custom-wardrobe-price-malaysia",
    "dry-wet-kitchen-renovation-malaysia",
    "built-in-furniture-small-condo-storage",
    "kitchen-cabinet-price-malaysia",
    "kitchen-cabinet-material-guide",
    "small-condo-storage-design-ideas",
    "built-in-cabinet-cost-malaysia",
  ],
  "bathroom-waterproofing": [
    "bathroom-leakage-renovation-malaysia",
    "bathroom-waterproofing-guide",
  ],
  "office-retail-fitout": [
    "office-reinstatement-vs-renovation",
    "shoplot-renovation-permit-malaysia",
    "shop-renovation-opening-timeline-malaysia",
    "office-fit-out-checklist-selangor",
    "shop-renovation-before-opening",
    "selangor-office-fit-out-tips",
    "office-renovation-checklist-malaysia",
  ],
  "materials-design": [
    "spc-vs-vinyl-flooring-malaysia",
    "renovation-materials-for-malaysia-climate",
    "renovation-materials-malaysia",
    "modern-warm-minimalist-home-design-malaysia",
    "artistic-wall-coating-guide-remmers",
    "spc-vinyl-vs-laminate-flooring",
    "feature-wall-ideas-2025",
  ],
} as const;

describe("blog topic taxonomy", () => {
  it("maps every existing CMS slug to exactly one of the six customer topics", () => {
    const mapped = Object.entries(expectedTopics).flatMap(([topic, slugs]) =>
      slugs.map((slug) => ({ slug, topic, actual: resolveBlogTopic("", slug) })),
    );

    expect(mapped).toHaveLength(38);
    expect(new Set(mapped.map(({ slug }) => slug)).size).toBe(38);
    expect(mapped.every(({ topic, actual }) => topic === actual)).toBe(true);
    expect(Object.keys(expectedTopics)).toEqual([...BLOG_TOPIC_KEYS]);
  });

  it("keeps new stable keys unchanged and maps legacy category values", () => {
    expect(resolveBlogTopic("budget-quotation")).toBe("budget-quotation");
    expect(resolveBlogTopic("Budget")).toBe("budget-quotation");
    expect(resolveBlogTopic("Bathroom")).toBe("bathroom-waterproofing");
    expect(resolveBlogTopic("Office")).toBe("office-retail-fitout");
  });

  it("configures exact bilingual 301 redirects for every archived duplicate", () => {
    const middleware = readFileSync(join(process.cwd(), "functions/_middleware.ts"), "utf8");

    for (const redirect of BLOG_LEGACY_REDIRECTS) {
      for (const language of ["en", "zh"]) {
        expect(middleware).toContain(`"/${language}/blog/${redirect.from}": "/${language}/blog/${redirect.to}"`);
      }
    }
  });
});
