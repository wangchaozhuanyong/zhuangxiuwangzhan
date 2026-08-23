import { describe, expect, it } from "vitest";
import { publishContent } from "../../supabase/functions/content-publish/service.ts";
import type { ContentPublishClient } from "../../supabase/functions/content-publish/types.ts";

const webpBytes = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x16, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x3f, 0x06, 0x00, 0xbf, 0x03, 0x00,
]);
const fileBase64 = Buffer.from(webpBytes).toString("base64");

const mediaRecord = {
  bucket: "site-images",
  object_path: "media/seo-generated/2026-08-22/kitchen-concept.webp",
  file_name: "kitchen-concept.webp",
  mime_type: "image/webp",
  file_base64: fileBase64,
  size_bytes: webpBytes.length,
  usage_type: "hero",
  folder: "media",
  alt_zh: "厨房装修效果图方案",
  alt_en: "Kitchen renovation rendering concept",
  claim_boundary: "Generated rendering concept; not a real completed project photo.",
};

function createMediaClient() {
  let insertedMedia: Record<string, unknown> = {};
  const storageObjects = new Map<string, Uint8Array>();
  const client = {
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, bytes: Uint8Array) {
            storageObjects.set(`${bucket}/${path}`, bytes);
            return { data: { path }, error: null };
          },
          async remove(paths: string[]) {
            for (const path of paths) storageObjects.delete(`${bucket}/${path}`);
            return { data: [], error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}` } };
          },
        };
      },
    },
    from(table: string) {
      const builder = {
        insert(payload: Record<string, unknown>) {
          if (table === "media_assets") insertedMedia = payload;
          return builder;
        },
        select() {
          return builder;
        },
        single() {
          return Promise.resolve({ data: { id: "media-1", ...insertedMedia }, error: null });
        },
        then(resolve: (value: { data: null; error: null }) => unknown) {
          return Promise.resolve({ data: null, error: null }).then(resolve);
        },
      };
      return builder;
    },
  };
  return { client: client as unknown as ContentPublishClient, storageObjects };
}

describe("content-publish media", () => {
  it("returns a safe dry-run preview without exposing base64", async () => {
    const result = await publishContent(
      { contentType: "media", mode: "dry-run", record: mediaRecord },
      {} as ContentPublishClient,
      { role: "content_editor", authMode: "cron" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.dry_run).toBe(true);
    expect(result.body.content_type).toBe("media");
    const preview = result.body.payload_preview as Record<string, unknown>;
    expect(preview.file_base64).toBeUndefined();
    expect(preview.width).toBe(1600);
    expect(preview.height).toBe(960);
  });

  it("rejects non-WebP media", async () => {
    const result = await publishContent(
      {
        contentType: "media",
        mode: "dry-run",
        record: { ...mediaRecord, mime_type: "image/png" },
      },
      {} as ContentPublishClient,
      { role: "content_editor" },
    );

    expect(result.status).toBe(400);
    expect(result.body.error).toContain("image/webp");
  });

  it("uploads through Storage, creates the media record, and returns the public URL", async () => {
    const { client, storageObjects } = createMediaClient();
    const result = await publishContent(
      {
        contentType: "media",
        mode: "publish",
        ownerApproved: true,
        explicitExecution: true,
        approvalId: "OWNER-STANDING-WEBSITE-CONTENT-2026-08-14",
        record: mediaRecord,
      },
      client,
      { role: "content_editor", authMode: "cron" },
    );

    expect(result.body.ok).toBe(true);
    expect(result.body.saved_id).toBe("media-1");
    expect(String(result.body.file_url)).toContain("/site-images/media/seo-generated/");
    expect(storageObjects.size).toBe(1);
  });
});
