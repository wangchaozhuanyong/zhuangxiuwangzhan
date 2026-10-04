import { describe, it, expect } from "vitest";
import { isOptionalHomeSectionEnabled } from "@/lib/homeOptionalSections";
import { mapRemoteHomeContentBundle } from "@/lib/homeContentApi";

describe("optional homepage modules", () => {
  it("requires explicit activation; old published records remain hidden", () => {
    for (const section_key of ["brand_partners", "testimonials"] as const) {
      expect(isOptionalHomeSectionEnabled(section_key, null)).toBe(false);
      expect(isOptionalHomeSectionEnabled(section_key, { section_key, status: "published" })).toBe(false);
      expect(isOptionalHomeSectionEnabled(section_key, { section_key, status: "draft", items_zh: [{ enabled: true }] })).toBe(false);
      expect(isOptionalHomeSectionEnabled(section_key, { section_key, status: "published", items_zh: [{ enabled: true }] })).toBe(true);
    }
  });
  it("maps network and HTML-preloaded settings to the same display state", () => {
    const brand = { section_key: "brand_partners", status: "published", items_zh: [{ enabled: true }] };
    const testimonial = { ...brand, section_key: "testimonials" };
    const preloaded = mapRemoteHomeContentBundle({ home_sections: [brand, testimonial] }, "zh");
    const network = mapRemoteHomeContentBundle({}, "zh", brand, testimonial);
    expect(preloaded.brandPartnersEnabled).toBe(network.brandPartnersEnabled);
    expect(preloaded.testimonialsEnabled).toBe(network.testimonialsEnabled);
    expect(network.testimonialsEnabled).toBe(true);
    expect(mapRemoteHomeContentBundle({}, "en").testimonialsEnabled).toBe(false);
  });
});
