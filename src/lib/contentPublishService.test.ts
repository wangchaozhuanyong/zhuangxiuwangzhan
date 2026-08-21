import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";

const publishedServiceRecord = {
  slug: "office-renovation",
  title_zh: "办公室装修",
  title_en: "Office Renovation",
  excerpt_zh: "办公室规划与施工。",
  excerpt_en: "Office planning and fit-out.",
  content_zh: "<p>按现场条件规划。</p>",
  content_en: "<p>Plan around the site conditions.</p>",
  image_url: "/images/services/office-renovation.webp",
  alt_zh: "办公室装修项目",
  alt_en: "Office renovation project",
  suitable_for_zh: ["办公室"],
  suitable_for_en: ["Office"],
  common_projects_zh: ["空间规划"],
  common_projects_en: ["Space planning"],
  scope_items_zh: ["隔间"],
  scope_items_en: ["Partitions"],
  process_steps_zh: [{ title: "现场评估", desc: "确认范围。" }],
  process_steps_en: [{ title: "Site review", desc: "Confirm the scope." }],
  faqs_zh: [{ q: "可以分阶段施工吗？", a: "可按现场条件讨论。" }],
  faqs_en: [{ q: "Can work be phased?", a: "Phasing can be discussed after a site review." }],
  seo_title_zh: "办公室装修 | FLASH CAST",
  seo_title_en: "Office Renovation | FLASH CAST",
  seo_description_zh: "办公室装修规划与施工服务。",
  seo_description_en: "Office renovation planning and fit-out services.",
};

const createReadOnlyClient = () => ({
  from() {
    const builder = {
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      maybeSingle() {
        return Promise.resolve({ data: null, error: null });
      },
    };
    return builder;
  },
});

describe("content-publish service", () => {
  it("rejects incomplete published services before writing", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: { slug: "shop-renovation", title_en: "Shop Renovation" },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("Published service requires bilingual content");
    expect(result.body.error).toContain("title_zh");
    expect(result.body.error).toContain("image_url");
    expect(result.body.error).toContain("faqs_zh");
  });

  it("returns a dry-run preview for a complete published service", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: publishedServiceRecord,
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.dry_run).toBe(true);
    expect(result.body.content_type).toBe("service");
    expect((result.body.payload_preview as Record<string, unknown>).status).toBe("published");
  });

  it("blocks non-WebP images from being published", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: { ...publishedServiceRecord, image_url: "https://images.example.com/office-renovation.jpg" },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("must use a WebP image");
  });

  it("accepts Supabase render URLs that explicitly deliver WebP", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "published",
        record: {
          ...publishedServiceRecord,
          image_url: "https://example.supabase.co/storage/v1/render/image/public/site-images/office.jpg?width=1200&format=webp",
        },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
  });

  it("keeps non-WebP images editable in drafts", async () => {
    const result = await publishContent(
      {
        contentType: "service",
        mode: "dry-run",
        nextStatus: "draft",
        record: { slug: "office-draft", image_url: "/images/services/office-draft.jpg" },
      },
      createReadOnlyClient() as unknown as ContentPublishClient,
      { role: "content_editor", authMode: "admin" },
    );

    expect(result.body.ok).toBe(true);
    expect((result.body.payload_preview as Record<string, unknown>).status).toBe("draft");
  });
});
