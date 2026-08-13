import { describe, expect, it } from "vitest";
import { isPublishedHomeSectionEnabled } from "@/lib/homeContentApi";

describe("homepage section visibility", () => {
  it("keeps a section disabled when its setting is missing or not published", () => {
    expect(isPublishedHomeSectionEnabled("brand_partners", null)).toBe(false);
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "brand_partners", status: "draft" })).toBe(false);
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "brand_partners", status: "archived" })).toBe(false);
  });

  it("enables only the matching published section", () => {
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "brand_partners", status: "published" })).toBe(true);
    expect(isPublishedHomeSectionEnabled("brand_partners", { section_key: "stats", status: "published" })).toBe(false);
  });
});
