import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminMediaAsset } from "./mediaService";
import * as legacyMetadata from "@/lib/adminMedia";
import * as ownedMetadata from "@/backend/modules/media";

const { insert, getUser, from, sequence } = vi.hoisted(() => ({
  insert: vi.fn(), getUser: vi.fn(), from: vi.fn(), sequence: [] as string[],
}));
vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getUser }, from },
}));

describe("media asset creation keeps business assembly in the service", () => {
  beforeEach(() => {
    sequence.length = 0;
    getUser.mockReset().mockImplementation(async () => { sequence.push("read-creator"); return { data: { user: { id: "test-creator" } } }; });
    from.mockReset().mockReturnValue({ insert });
    insert.mockReset().mockImplementation(async () => { sequence.push("insert-metadata"); return { error: null }; });
  });

  it("retains the old metadata exports through the pure owning-module boundary", () => {
    expect(legacyMetadata.buildMediaAssetInsert).toBe(ownedMetadata.buildMediaAssetInsert);
    expect(legacyMetadata.getFileNameFromUrl).toBe(ownedMetadata.getFileNameFromUrl);
    expect(legacyMetadata.getStorageObjectFromPublicUrl).toBe(ownedMetadata.getStorageObjectFromPublicUrl);
  });

  it("retains upload metadata, original asset details and one insert after creator lookup", async () => {
    await expect(createAdminMediaAsset({
      url: "/ignored-fallback.webp", usageType: "project", folder: "test-folder",
      upload: {
        url: "/confirmed.webp", bucket: "site-images", path: "test/confirmed.webp", fileName: "confirmed.webp", mimeType: "image/webp", sizeBytes: 1234,
        kind: "image", width: 1200, height: 800, posterUrl: "/poster.webp", durationSeconds: 12,
        originalPath: "test/original.png", originalMimeType: "image/png", originalSizeBytes: 3456, originalWidth: 2400, originalHeight: 1600,
      },
    })).resolves.toBe(true);
    expect(from).toHaveBeenCalledExactlyOnceWith("media_assets");
    expect(insert).toHaveBeenCalledExactlyOnceWith({
      file_url: "/confirmed.webp", file_path: "test/confirmed.webp", file_name: "confirmed.webp", mime_type: "image/webp", size_bytes: 1234,
      width: 1200, height: 800, poster_url: "/poster.webp", duration_seconds: 12,
      original_file_path: "test/original.png", original_mime_type: "image/png", original_size_bytes: 3456, original_width: 2400, original_height: 1600,
      processing_status: "ready", usage_type: "project", folder: "test-folder", created_by: "test-creator",
    });
    expect(sequence).toEqual(["read-creator", "insert-metadata"]);
  });

  it("keeps URL-derived decoded paths and existing defaults without upload metadata", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await createAdminMediaAsset({ url: "https://fixture.example/storage/v1/object/public/site-images/folder/test%20image.webp" });
    expect(insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      file_name: "test image.webp", file_path: "folder/test image.webp", usage_type: "general", folder: "media", created_by: null,
      mime_type: null, size_bytes: null, processing_status: "ready",
    }));
  });

  it("propagates an insert failure instead of returning a successful creation", async () => {
    const error = new Error("Metadata insert unavailable");
    insert.mockResolvedValue({ error });
    await expect(createAdminMediaAsset({ url: "/confirmed.webp" })).rejects.toBe(error);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("does not insert metadata when the existing creator lookup transport fails", async () => {
    getUser.mockRejectedValue(new Error("Creator lookup unavailable"));
    await expect(createAdminMediaAsset({ url: "/confirmed.webp" })).rejects.toThrow("Creator lookup unavailable");
    expect(from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
