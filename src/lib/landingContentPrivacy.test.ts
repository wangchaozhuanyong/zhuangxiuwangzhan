import { describe, expect, it } from "vitest";
import {
  anonymizeLandingProjectCards,
  getLandingProjectPrivacyIssues,
  isPrivacyProtectedLanding,
} from "@/lib/landingContentPrivacy";

const unsafeOfficeProjects = [
  { title: "ACME Sdn Bhd Corporate Office", location: "KL Sentral", image: "/office-1.webp" },
  { title: "Named Coworking Company", location: "Petaling Jaya", image: "/office-2.webp" },
];

describe("landing content privacy", () => {
  it("anonymizes office case titles and reduces locations to broad regions", () => {
    expect(anonymizeLandingProjectCards("office-renovation", "zh", unsafeOfficeProjects)).toEqual([
      { title: "办公空间布局规划参考", location: "吉隆坡", image: "/office-1.webp" },
      { title: "办公空间改造与协作区参考", location: "雪兰莪", image: "/office-2.webp" },
    ]);
  });

  it("reports non-approved titles and precise locations for protected landing pages", () => {
    expect(getLandingProjectPrivacyIssues("office-renovation", unsafeOfficeProjects)).toEqual([
      "related_projects[0].title",
      "related_projects[0].location",
      "related_projects[1].title",
      "related_projects[1].location",
    ]);
  });

  it("accepts approved anonymous card vocabulary", () => {
    expect(
      getLandingProjectPrivacyIssues("office-renovation", [
        { title: "Office Space Planning Reference", location: "Kuala Lumpur", image: "/office-1.webp" },
        { title: "Office Refurbishment Reference", location: "Selangor", image: "/office-2.webp" },
      ]),
    ).toEqual([]);
  });

  it("limits the hard privacy guard to the office landing page", () => {
    expect(isPrivacyProtectedLanding("office-renovation")).toBe(true);
    expect(isPrivacyProtectedLanding("shop-renovation")).toBe(false);
  });
});
