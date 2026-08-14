import { describe, expect, it } from "vitest";
import { buildAdminServicePayload, getAdminServicePublishIssues } from "@/backend/modules/services/service/serviceService";

const completeRecord = {
  slug: "shop-renovation",
  status: "published" as const,
  title_zh: "店铺装修",
  title_en: "Shop Renovation",
  excerpt_zh: "店铺装修规划。",
  excerpt_en: "Shop renovation planning.",
  content_zh: "<p>中文内容</p>",
  content_en: "<p>English content</p>",
  image_url: "/images/services/shoplot-renovation.webp",
  alt_zh: "店铺装修",
  alt_en: "Shop renovation",
  suitable_for_zh: ["店铺"],
  suitable_for_en: ["Shop"],
  common_projects_zh: ["零售空间"],
  common_projects_en: ["Retail space"],
  scope_items_zh: ["展示区"],
  scope_items_en: ["Display area"],
  process_steps_zh: [{ title: "沟通", desc: "确认需求" }],
  process_steps_en: [{ title: "Review", desc: "Confirm needs" }],
  faqs_zh: [{ q: "如何开始？", a: "先提交资料。" }],
  faqs_en: [{ q: "How do we start?", a: "Send the project details." }],
  seo_title_zh: "店铺装修 | FLASH CAST",
  seo_title_en: "Shop Renovation | FLASH CAST",
  seo_description_zh: "店铺装修规划与施工。",
  seo_description_en: "Shop renovation planning and fit-out.",
};

describe("admin service publish validation", () => {
  it("reports missing bilingual and structured content", () => {
    const { payload } = buildAdminServicePayload(
      {
        ...completeRecord,
        title_zh: "",
        process_steps_zh: [{ title: "沟通", desc: "" }],
        faqs_en: [],
      },
      "published",
    );

    expect(getAdminServicePublishIssues(payload)).toEqual(expect.arrayContaining(["title_zh", "process_steps_zh", "faqs_en"]));
  });

  it("accepts a complete published service payload", () => {
    const { payload } = buildAdminServicePayload(completeRecord, "published");
    expect(getAdminServicePublishIssues(payload)).toEqual([]);
  });
});
