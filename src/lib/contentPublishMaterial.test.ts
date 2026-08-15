import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";

const gallery = Array.from({ length: 10 }, (_, index) => ({
  image_url: index === 0 ? "/images/materials/spc-vinyl-natural-oak.webp" : `/images/projects/generated-portfolio/concept-${index}.webp`,
  image_type: index === 0 ? "cover" : "scene",
  alt_zh: `商品效果图 ${index + 1}`,
  alt_en: `Product concept ${index + 1}`,
  rights_status: index === 0 ? "owned" : "generated",
  sort_order: index * 10,
}));

const completeMaterial = {
  slug: "spc-flooring-natural-oak",
  title_zh: "自然橡木纹 SPC 锁扣地板",
  title_en: "Natural Oak SPC Click Flooring",
  excerpt_zh: "适合住宅常用空间的锁扣地板。",
  excerpt_en: "Click flooring for everyday residential spaces.",
  content_zh: "确认厚度、耐磨层和基层平整度。",
  content_en: "Confirm thickness, wear layer, and subfloor flatness.",
  category: "Flooring",
  subcategory: "SPC Vinyl",
  material_type: "SPC Vinyl",
  color: "Natural Oak",
  texture: "Wood Grain",
  suitable_spaces_zh: ["客厅"],
  suitable_spaces_en: ["Living Room"],
  pros_zh: ["容易清洁"],
  pros_en: ["Easy to clean"],
  cons_zh: ["基层需平整"],
  cons_en: ["Subfloor must be flat"],
  recommended_pairing_zh: "搭配暖白墙面。",
  recommended_pairing_en: "Pair with warm-white walls.",
  note_zh: "下单前确认损耗。",
  note_en: "Confirm wastage before ordering.",
  price_mode: "range",
  price_min: 5,
  price_max: 10,
  price_currency: "MYR",
  price_unit: "sqft",
  price_scope_zh: "材料及标准铺装预算参考",
  price_scope_en: "Budget reference for material and standard installation",
  price_note_zh: "最终价格以书面报价为准。",
  price_note_en: "Final pricing follows the written quotation.",
  image_url: "/images/materials/spc-vinyl-natural-oak.webp",
  alt_zh: "自然橡木纹 SPC 地板",
  alt_en: "Natural oak SPC flooring",
  seo_title_zh: "自然橡木纹 SPC 地板 | FLASH CAST",
  seo_title_en: "Natural Oak SPC Flooring | FLASH CAST",
  seo_description_zh: "查看规格、价格和安装注意事项。",
  seo_description_en: "Review specifications, pricing, and installation notes.",
  gallery,
};

const createReadOnlyClient = () => ({
  from(table: string) {
    const builder = {
      select() { return builder; },
      eq() { return builder; },
      maybeSingle() { return Promise.resolve({ data: null, error: table === "material_images" ? null : null }); },
      then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    return builder;
  },
});

describe("content-publish material contract", () => {
  it("returns a dry-run preview with structured price and ten gallery images", async () => {
    const result = await publishContent(
      { contentType: "material", mode: "dry-run", nextStatus: "published", record: completeMaterial },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.content_type).toBe("material");
    const preview = result.body.payload_preview as { material: Record<string, unknown>; gallery: unknown[] };
    expect(preview.material.price_mode).toBe("range");
    expect(preview.gallery).toHaveLength(10);
  });

  it("rejects duplicate images inside one published product gallery", async () => {
    const duplicateGallery = gallery.map((image, index) => index === 1 ? { ...image, image_url: gallery[0].image_url } : image);
    const result = await publishContent(
      { contentType: "material", mode: "dry-run", nextStatus: "published", record: { ...completeMaterial, gallery: duplicateGallery } },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("unique");
  });

  it("rejects published numeric ranges without a maximum price", async () => {
    const result = await publishContent(
      { contentType: "material", mode: "dry-run", nextStatus: "published", record: { ...completeMaterial, price_max: null } },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("price_max");
  });
});
