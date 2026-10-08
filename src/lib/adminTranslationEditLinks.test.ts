import { describe, expect, it } from "vitest";
import { buildTranslationRecordEditHref } from "./adminTranslationEditLinks";
import { getAdminRouteDefinition } from "@/routes/adminRouteDefinitions";

describe("translation editor links", () => {
  it.each([
    ["services", undefined, "/admin/services/fixture"],
    ["testimonials", undefined, "/admin/content/testimonials/fixture"],
    ["faqs", undefined, "/admin/faqs?record=fixture"],
    ["home_sections", { section_key: "why_choose_us" }, "/admin/home?section=why"],
    ["about_sections", { section_key: "intro" }, "/admin/about?section=intro"],
    ["cta_blocks", { block_key: "about_final" }, "/admin/about?section=cta"],
    ["site_pages", { page_key: "promotions" }, "/admin/promotions"],
    ["site_pages", { page_key: "privacy" }, "/admin/pages?record=fixture"],
    ["cms_pages", undefined, "/admin/cms?page=fixture"],
    ["cms_sections", { page_id: "parent" }, "/admin/cms?page=parent&section=fixture"],
    ["project_images", { project_id: "parent" }, "/admin/projects/parent"],
  ] as const)("routes %s to a real editor", (table, record, expected) => {
    const href = buildTranslationRecordEditHref(table, "fixture", record);
    expect(href).toBe(expected);
    expect(getAdminRouteDefinition(href!.split("?")[0])).toBeDefined();
  });
  it.each(["cms_content_entries", "unknown", "project_images", "cta_blocks", "home_sections"])("does not invent an editor for %s without a supported target", table => {
    expect(buildTranslationRecordEditHref(table, "fixture")).toBeNull();
  });
});
