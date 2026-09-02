import { describe, expect, it } from "vitest";
import { locationsData } from "@/data/locations";
import { servicesData } from "@/data/services";
import { locationPageText } from "@/i18n/locationPageText";

describe("Kuala Lumpur location SEO fallbacks", () => {
  const kl = locationsData["kuala-lumpur"];
  const residential = servicesData.find((service) => service.slug === "renovation");

  it("assigns a distinct local commercial intent that avoids cannibalizing Home and Service pages", () => {
    expect(kl).toBeDefined();

    // Must have the dedicated local service title
    expect(kl.metaTitle).toBe("Renovation Services in Kuala Lumpur | FLASH CAST");

    // Title length constraint
    expect(kl.metaTitle.length).toBeGreaterThanOrEqual(40);
    expect(kl.metaTitle.length).toBeLessThanOrEqual(60);

    // Must NOT cannibalize other primary pages
    expect(kl.metaTitle).not.toContain("Interior Design KL");
    expect(kl.metaTitle).not.toBe("Renovation Company Kuala Lumpur | FLASH CAST"); // Home
    expect(kl.metaTitle).not.toBe("Renovation Services Kuala Lumpur | FLASH CAST"); // Services Hub
    expect(kl.metaTitle).not.toBe(residential?.seoTitle); // Residential Service
  });

  it("provides complete bilingual fallback content for Kuala Lumpur", () => {
    expect(kl.nameZh).toBe("吉隆坡");
    expect(kl.metaTitleZh).toBe("吉隆坡装修服务 | 住宅与商业空间 | FLASH CAST");
    expect(kl.descriptionZh).toBeTruthy();
    expect(kl.descriptionZh).toContain("吉隆坡");
    expect(kl.introZh).toBeTruthy();
    expect(kl.introZh).toContain("吉隆坡");

    expect(kl.propertyTypesZh).toBeDefined();
    expect(kl.propertyTypesZh?.length).toBe(kl.propertyTypes.length);

    expect(kl.commonNeedsZh).toBeDefined();
    expect(kl.commonNeedsZh?.length).toBe(kl.commonNeeds.length);

    expect(kl.constructionNotesZh).toBeTruthy();
    expect(kl.constructionNotesZh).toContain("DBKL");

    expect(kl.faqsZh).toBeDefined();
    expect(kl.faqsZh?.length).toBe(kl.faqs.length);
    kl.faqs.forEach((faq, index) => {
      expect(faq.q).toBeTruthy();
      expect(faq.a).toBeTruthy();
      const faqZh = kl.faqsZh?.[index];
      expect(faqZh?.q).toBeTruthy();
      expect(faqZh?.a).toBeTruthy();
    });
  });

  it("links project cards to specific project detail destinations", () => {
    expect(kl.projects.length).toBeGreaterThan(0);
    kl.projects.forEach((project) => {
      const target = project.href || (project.slug ? `/projects/${project.slug}` : "");
      expect(target).toMatch(/^\/projects\/[a-z0-9-]+$/);
    });
  });

  it("provides resource labels in locationPageText for both languages", () => {
    expect(locationPageText.en.resourceTitle("Kuala Lumpur")).toContain("Kuala Lumpur");
    expect(locationPageText.zh.resourceTitle("吉隆坡")).toContain("吉隆坡");
    expect(locationPageText.en.resourceDescription).toBeTruthy();
    expect(locationPageText.zh.resourceDescription).toBeTruthy();
    expect(locationPageText.en.resourceAction).toBeTruthy();
    expect(locationPageText.zh.resourceAction).toBeTruthy();
  });
});
