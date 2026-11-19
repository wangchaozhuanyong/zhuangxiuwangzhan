import { describe, expect, it } from "vitest";
import { servicesData } from "@/data/services";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";

const PRIORITY_SERVICE_INTENTS = [
  { slug: "renovation", title: /^Residential Renovation\b/i },
  { slug: "kitchen", title: /^Kitchen Renovation\b/i },
  { slug: "bathroom", title: /^Bathroom Renovation\b/i },
  { slug: "office-renovation", title: /^Office Renovation\b/i },
  { slug: "shop-renovation", title: /^Shop (?:Renovation|& Retail Fit-Out)\b/i },
  { slug: "old-house", title: /^Old House Renovation\b/i },
  { slug: "builtin", title: /^(?:Custom Cabinet|Custom Built-In Furniture)\b/i },
] as const;

const PRIORITY_SERVICE_SLUGS = PRIORITY_SERVICE_INTENTS.map(({ slug }) => slug);

describe("priority service SEO fallbacks", () => {
  it("assigns a distinct commercial search intent to each priority service", () => {
    const titles = PRIORITY_SERVICE_INTENTS.map(({ slug, title }) => {
      const actualTitle = servicesData.find((service) => service.slug === slug)?.seoTitle || "";
      expect(actualTitle, slug).toMatch(title);
      return actualTitle;
    });
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
