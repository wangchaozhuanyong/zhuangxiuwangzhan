import { describe, expect, it } from "vitest";
import { projectDetailPageText } from "@/i18n/projectDetailPageText";
import { projectsPageText } from "@/i18n/projectsPageText";

describe("public project copy", () => {
  it("does not require a project location in English detail copy", () => {
    const copy = projectDetailPageText.en;
    const output = [
      copy.metaDescription("Commercial"),
      copy.metaKeywords("Commercial", "Hair Salon Fit-Out"),
      copy.summary("Hair Salon Fit-Out", "Commercial", ["Reception", "Styling mirrors"]),
      copy.resultIntro("Commercial", 2, 3),
      copy.testimonialBy,
    ].join(" ");

    expect(output).not.toMatch(/Sri Petaling|Kuala Lumpur|Selangor/i);
  });

  it("does not require a project location in Chinese detail copy", () => {
    const copy = projectDetailPageText.zh;
    const output = [
      copy.metaDescription("商业装修"),
      copy.metaKeywords("商业装修", "理发店装修"),
      copy.summary("理发店装修", "商业装修", ["接待区", "造型镜面"]),
      copy.resultIntro("商业装修", 2, 3),
      copy.testimonialBy,
    ].join(" ");

    expect(output).not.toMatch(/斯里八打灵|吉隆坡|雪兰莪/);
  });

  it("keeps project listing metadata focused on space and work type", () => {
    expect(projectsPageText.en.metaTitle).toBe("Renovation & Fit-Out Projects | FLASH CAST");
    expect(projectsPageText.zh.title).toBe("装修与空间改造案例");
    expect(`${projectsPageText.en.metaDescription} ${projectsPageText.zh.metaDescription}`).not.toMatch(
      /Kuala Lumpur|Selangor|吉隆坡|雪兰莪/i,
    );
  });
});
