import { describe, expect, it } from "vitest";
import { servicesData } from "@/data/services";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";

const PRIORITY_SERVICE_SLUGS = ["renovation", "kitchen", "bathroom", "office-renovation", "shop-renovation", "old-house", "builtin"] as const;

describe("priority service SEO fallbacks", () => {
  it("assigns a distinct commercial search intent to each priority service", () => {
    const services = PRIORITY_SERVICE_SLUGS.map((slug) => servicesData.find((service) => service.slug === slug));
    expect(services.every(Boolean)).toBe(true);

    const titles = services.map((service) => service?.seoTitle || "");
    expect(titles).toEqual([
      "Residential Renovation Kuala Lumpur | FLASH CAST",
      "Kitchen Renovation Kuala Lumpur | FLASH CAST",
      "Bathroom Renovation Kuala Lumpur | FLASH CAST",
      "Office Renovation Contractor KL | FLASH CAST",
      "Shop Renovation Kuala Lumpur | FLASH CAST",
      "Old House Renovation Kuala Lumpur | FLASH CAST",
      "Custom Cabinet Kuala Lumpur | FLASH CAST",
    ]);
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles.every((title) => title.length >= 40 && title.length <= 60)).toBe(true);
  });

  it.each(PRIORITY_SERVICE_SLUGS)("provides complete bilingual fallback content for %s", (slug) => {
    const service = servicesData.find((item) => item.slug === slug);
    expect(service?.titleZh).toBeTruthy();
    expect(service?.summaryZh).toBeTruthy();
    expect(service?.descriptionZh).toBeTruthy();
    expect(service?.seoTitleZh).toBeTruthy();
    expect(service?.seoDescriptionZh).toBeTruthy();
    expect(service?.suitableForZh?.length).toBe(service?.suitableFor.length);
    expect(service?.commonProjectsZh?.length).toBe(service?.commonProjects.length);
    expect(service?.processStepsZh?.length).toBe(service?.processSteps.length);
    expect(service?.itemsZh?.length).toBe(service?.items.length);
    expect(service?.faqsZh?.length).toBe(service?.faqs.length);
  });

  it("keeps the dedicated old-house route aligned with its assigned search intent", () => {
    expect(oldHouseRenovationPageText.en.metaTitle).toBe("Old House Renovation Kuala Lumpur | FLASH CAST");
    expect(oldHouseRenovationPageText.zh.metaTitle).toBe("吉隆坡旧屋翻新 | 排屋与有地住宅 | FLASH CAST");
    expect(oldHouseRenovationPageText.en.title).toContain("Old House Renovation");
    expect(oldHouseRenovationPageText.zh.title).toContain("旧屋翻新");
  });
});
