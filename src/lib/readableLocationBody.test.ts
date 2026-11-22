import { describe, expect, it } from "vitest";
import { buildReadablePublicBody } from "../../functions/readablePublicBody";

// A minimal published service_areas row, shaped like the CMS record the
// middleware receives. Kept inline so this suite has no dependency on the
// frozen publisher fixtures.
const locationRow = (overrides: Record<string, unknown> = {}) => ({
  status: "published",
  slug: "cheras",
  title_en: "Cheras Renovation Contractor",
  title_zh: "蕉赖装修公司",
  content_en:
    "<p>Cheras runs along the south-east edge of Kuala Lumpur and mixes two kinds of housing.</p>" +
    "<p><strong>What tends to come up in Cheras</strong></p>" +
    "<p>Older terraces need wiring, plumbing and waterproofing reviewed before anything cosmetic.</p>",
  content_zh:
    "<p>蕉赖位于吉隆坡东南侧，住宅类型分成很不一样的两类。</p>" +
    "<p><strong>蕉赖常见的问题</strong></p>" +
    "<p>老排屋通常要先查线路、水管与防水。</p>",
  excerpt_en: "Renovation services across Cheras.",
  ...overrides,
});

describe("location page readable body", () => {
  it("renders a published region page body into the no-JS shell", () => {
    const html = buildReadablePublicBody("/en/locations/cheras", locationRow());
    expect(html).toContain("data-flashcast-readable-body");
    expect(html).toContain("Cheras runs along the south-east edge of Kuala Lumpur");
    expect(html).toContain("<strong>What tends to come up in Cheras</strong>");
  });

  it("renders the Chinese body for the zh route", () => {
    const html = buildReadablePublicBody("/zh/locations/cheras", locationRow());
    expect(html).toContain("蕉赖位于吉隆坡东南侧");
    expect(html).toContain("<strong>蕉赖常见的问题</strong>");
  });

  it("does not render an unpublished region page", () => {
    expect(buildReadablePublicBody("/en/locations/cheras", locationRow({ status: "draft" }))).toBe("");
  });

  it("does not render when the row slug does not match the path", () => {
    expect(buildReadablePublicBody("/en/locations/cheras", locationRow({ slug: "klang" }))).toBe("");
  });

  it("does not treat the locations list route as a region detail page", () => {
    expect(buildReadablePublicBody("/en/locations", locationRow({ slug: "locations" }))).toBe("");
  });

  it("does not render a region page whose published body is empty", () => {
    expect(buildReadablePublicBody("/en/locations/cheras", locationRow({ content_en: "" }))).toBe("");
  });

  it("keeps service paths outside the reviewed whitelist unrendered", () => {
    const row = locationRow({ slug: "tiling", title_en: "Tiling Works" });
    expect(buildReadablePublicBody("/en/services/tiling", row)).toBe("");
  });

  it("still renders a whitelisted service path", () => {
    const row = locationRow({
      slug: "kitchen",
      title_en: "Kitchen Renovation",
      content_en: "<p>Kitchen body text.</p>",
      content_zh: "<p>厨房正文。</p>",
    });
    expect(buildReadablePublicBody("/en/services/kitchen", row)).toContain("Kitchen body text");
  });

  describe("B3 digital lock Malay location combo pages", () => {
    const lockAreas = [
      { slug: "petaling-jaya", expectedHeading: "Pemasangan Kunci Digital di Petaling Jaya" },
      { slug: "cheras", expectedHeading: "Pemasangan Kunci Digital di Cheras" },
      { slug: "subang-jaya", expectedHeading: "Pemasangan Kunci Digital di Subang Jaya" },
      { slug: "mont-kiara", expectedHeading: "Pemasangan Kunci Digital di Mont Kiara" },
      { slug: "bangsar", expectedHeading: "Pemasangan Kunci Digital di Bangsar" },
      { slug: "puchong", expectedHeading: "Pemasangan Kunci Digital di Puchong" },
      { slug: "selangor", expectedHeading: "Pemasangan Kunci Digital di Selangor" },
      { slug: "shah-alam", expectedHeading: "Pemasangan Kunci Digital di Shah Alam" },
      { slug: "kajang", expectedHeading: "Pemasangan Kunci Digital di Kajang" },
    ];

    it.each(lockAreas)("renders Malay readable body for /ms/locations/$slug/digital-lock", ({ slug, expectedHeading }) => {
      const html = buildReadablePublicBody(`/ms/locations/${slug}/digital-lock`, undefined);
      expect(html).toContain("data-flashcast-readable-body");
      expect(html).toContain(expectedHeading);
      expect(html).toContain("Kunci digital");
      expect(html).toContain("Lihat bilik pameran kunci digital ANZHE");
    });
  });
});
