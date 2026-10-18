import { describe, expect, it } from "vitest";
import { hasMalayContent, localizedContentValue } from "./localizedContent";
import { languageSelectorText, languageOptions } from "./languageSelectorText";
import { mapPublishedService, mapPublishedBlogPost, mapPublishedProjectDetail } from "@/lib/contentApi";
import { mapSitePageRows } from "@/lib/homeContentApi";

describe("Malay public content", () => {
  const record = { id: "service", slug: "renovation", title_en: "Renovation", title_zh: "装修", title_ms: "Pengubahsuaian", content_en: "English body", content_ms: "Kandungan Bahasa Melayu", seo_title_ms: "Pengubahsuaian KL", seo_description_ms: "Perkhidmatan pengubahsuaian di Kuala Lumpur." };

  it("reads Malay fields first, including structured content, and keeps English as the old-record fallback", () => {
    expect(localizedContentValue(record, "title", "ms", "")).toBe("Pengubahsuaian");
    expect(localizedContentValue({ title_ms: "  ", title_en: "Existing title" }, "title", "ms", "")).toBe("Existing title");
    expect(localizedContentValue({ faqs_en: [{ q: "Question", a: "Answer" }] }, "faqs", "ms", [])).toEqual([{ q: "Question", a: "Answer" }]);
    expect(record.title_en).toBe("Renovation");
    expect(localizedContentValue(record, "title", "zh", "")).toBe("装修");
  });

  it("keeps service, article, project and CMS reads aligned with the chosen language", () => {
    const service = mapPublishedService(record, "ms");
    expect(service).toMatchObject({ title: record.title_ms, description: record.content_ms, translationComplete: true });
    expect(mapPublishedBlogPost(record, "ms")).toMatchObject({ title: record.title_ms, content: record.content_ms });
    expect(mapPublishedProjectDetail(record, "ms")).toMatchObject({ title: record.title_ms, description: record.content_ms });
    expect(mapSitePageRows({ site_pages: [{ ...record, page_key: "services", path: "/services" }] }, "ms")).toMatchObject({ title: record.title_ms, content: record.content_ms });
  });

  it("does not treat an English fallback or an incomplete translated body as a complete Malay page", () => {
    expect(hasMalayContent(record)).toBe(true);
    expect(hasMalayContent({ ...record, content_ms: null })).toBe(false);
    expect(hasMalayContent({ ...record, faqs_en: [{ q: "Question" }], faqs_ms: [] })).toBe(false);
    expect(mapPublishedService({ ...record, content_ms: null }, "ms")).toMatchObject({ description: record.content_en, translationComplete: false });
  });

  it("provides all three native names and complete picker copy", () => {
    expect(languageOptions.map(({ code }) => code)).toEqual(["zh", "en", "ms"]);
    for (const language of ["zh", "en", "ms"] as const) {
      expect(Object.keys(languageSelectorText[language]).sort()).toEqual(Object.keys(languageSelectorText.en).sort());
      expect(Object.values(languageSelectorText[language].names).every((name) => name.trim())).toBe(true);
    }
  });
});
