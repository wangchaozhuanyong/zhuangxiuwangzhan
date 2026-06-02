import { describe, expect, it } from "vitest";
import {
  buildCmsLocalizedPath,
  cmsPathHasLanguagePrefix,
  createCmsPageDraft,
  isCmsPathHandledByStaticRoute,
  isValidCmsPageKey,
  normalizeCmsPageKey,
  normalizeCmsPagePath,
  shouldAutoSelectFirstCmsPage,
} from "@/lib/adminCmsBuilderModel";

describe("adminCmsBuilderModel", () => {
  it("normalizes CMS page keys and paths", () => {
    expect(normalizeCmsPageKey(" Promo Page ")).toBe("promo-page");
    expect(normalizeCmsPagePath("promo-page/")).toBe("/promo-page");
    expect(normalizeCmsPagePath("/promo-page/")).toBe("/promo-page");
    expect(normalizeCmsPagePath("/")).toBe("/");
  });

  it("builds localized public paths for CMS pages", () => {
    expect(buildCmsLocalizedPath("/promo-page", "zh")).toBe("/zh/promo-page");
    expect(buildCmsLocalizedPath("promo-page", "en")).toBe("/en/promo-page");
    expect(buildCmsLocalizedPath("/", "zh")).toBe("/zh");
  });

  it("detects invalid page keys and language-prefixed admin paths", () => {
    expect(isValidCmsPageKey("promo_page-2026")).toBe(true);
    expect(isValidCmsPageKey("Promo Page")).toBe(false);
    expect(cmsPathHasLanguagePrefix("/zh/promo-page")).toBe(true);
    expect(cmsPathHasLanguagePrefix("/promo-page")).toBe(false);
  });

  it("marks fixed public routes as unsuitable for new free-form CMS pages", () => {
    expect(isCmsPathHandledByStaticRoute("/services")).toBe(true);
    expect(isCmsPathHandledByStaticRoute("/services/custom")).toBe(true);
    expect(isCmsPathHandledByStaticRoute("/promo-page")).toBe(false);
  });

  it("creates a usable draft page instead of a blank unsaved form", () => {
    expect(createCmsPageDraft(2, 1717000123456)).toMatchObject({
      page_key: "custom_page_123456",
      path: "/custom-page-123456",
      status: "draft",
      sort_order: 30,
    });
  });

  it("does not auto-select the first page while a new draft is dirty", () => {
    expect(shouldAutoSelectFirstCmsPage(null, false, "home-id")).toBe(true);
    expect(shouldAutoSelectFirstCmsPage(null, true, "home-id")).toBe(false);
    expect(shouldAutoSelectFirstCmsPage("selected-id", false, "home-id")).toBe(false);
  });
});
