import { uploadMediaObject, removeMediaObject, insertContentRecord, insertAdminAuditLog } from "./repository.ts";
import type { ContentPublishRequest, ContentPublishClient, ContentPublishResult, ContentRow, PublishContext } from "./types.ts";
import { cleanText, errorResult } from "./publishValues.ts";

const MEDIA_BUCKET = "site-images";
const MEDIA_PREFIX = "media/seo-generated/";
const MEDIA_MIME_TYPE = "image/webp";
const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

type CleanedMediaPayload = {
  bucket: string;
  objectPath: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  width: number | null;
  height: number | null;
  usageType: string;
  folder: string;
  altZh: string;
  altEn: string;
  claimBoundary: string;
};

function decodeMediaBase64(value: unknown): Uint8Array {
  const raw = cleanText(value, 7 * 1024 * 1024) || "";
  const encoded = raw.replace(/^data:image\/webp;base64,/i, "");
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error("media.file_base64 must contain valid base64 WebP data.");
  }
  try {
    return Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  } catch {
    throw new Error("media.file_base64 could not be decoded.");
  }
}

function isWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

function webpDimensions(bytes: Uint8Array): { width: number | null; height: number | null } {
  if (!isWebp(bytes) || bytes.length < 30) return { width: null, height: null };
  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === "VP8X") {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }
  if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return { width: width || null, height: height || null };
  }
  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
    const height = 1 + ((bytes[22] & 0xc0) >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
    return { width, height };
  }
  return { width: null, height: null };
}

function cleanMediaPayload(record: Record<string, unknown>): CleanedMediaPayload {
  const bucket = cleanText(record.bucket, 80) || MEDIA_BUCKET;
  const objectPath = (cleanText(record.object_path, 320) || "").replace(/^\/+/, "");
  const fileName = cleanText(record.file_name, 180) || "";
  const mimeType = (cleanText(record.mime_type, 80) || "").toLowerCase();
  const usageType = cleanText(record.usage_type, 80) || "general";
  const folder = cleanText(record.folder, 120) || "media";
  const altZh = cleanText(record.alt_zh, 500);
  const altEn = cleanText(record.alt_en, 500);
  const claimBoundary = cleanText(record.claim_boundary, 800);

  if (bucket !== MEDIA_BUCKET) throw new Error(`media.bucket must be ${MEDIA_BUCKET}.`);
  if (!objectPath.startsWith(MEDIA_PREFIX) || objectPath.includes("..") || objectPath.includes("\\")) {
    throw new Error(`media.object_path must stay under ${MEDIA_PREFIX}.`);
  }
  if (!/^media\/seo-generated\/\d{4}-\d{2}-\d{2}\/[a-z0-9][a-z0-9._-]*\.webp$/.test(objectPath)) {
    throw new Error("media.object_path must use a dated, lowercase-safe .webp path.");
  }
  if (!fileName || fileName !== objectPath.split("/").at(-1)) {
    throw new Error("media.file_name must match the object_path filename.");
  }
  if (mimeType !== MEDIA_MIME_TYPE) throw new Error(`media.mime_type must be ${MEDIA_MIME_TYPE}.`);
  if (!altZh || !altEn) throw new Error("media.alt_zh and media.alt_en are required.");

  const bytes = decodeMediaBase64(record.file_base64);
  if (!bytes.length || bytes.length > MEDIA_MAX_BYTES) throw new Error("Decoded media must be between 1 byte and 5 MiB.");
  if (!isWebp(bytes)) throw new Error("Decoded media is not a valid WebP file.");
  const declaredSize = Number(record.size_bytes || 0);
  if (declaredSize && declaredSize !== bytes.length) throw new Error("media.size_bytes does not match the decoded file size.");

  const dimensions = webpDimensions(bytes);
  return {
    bucket,
    objectPath,
    fileName,
    mimeType,
    bytes,
    width: dimensions.width,
    height: dimensions.height,
    usageType,
    folder,
    altZh,
    altEn,
    claimBoundary,
  };
}

export async function publishMediaContent(
  input: ContentPublishRequest,
  client: ContentPublishClient,
  context: PublishContext,
  mode: "dry-run" | "publish",
): Promise<ContentPublishResult> {
  let cleaned: CleanedMediaPayload;
  try {
    cleaned = cleanMediaPayload(input.record || {});
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : "Invalid media payload");
  }
  if (mode === "publish" && !cleanText(input.approvalId, 180)) {
    return errorResult("Media publishing requires a non-empty approvalId.", 403);
  }

  const preview = {
    bucket: cleaned.bucket,
    object_path: cleaned.objectPath,
    file_name: cleaned.fileName,
    mime_type: cleaned.mimeType,
    size_bytes: cleaned.bytes.length,
    width: cleaned.width,
    height: cleaned.height,
    usage_type: cleaned.usageType,
    folder: cleaned.folder,
    alt_zh: cleaned.altZh,
    alt_en: cleaned.altEn,
    claim_boundary: cleaned.claimBoundary,
  };
  const commonBody = {
    ok: true,
    dry_run: mode === "dry-run",
    content_type: "media",
    action: "upload",
    status: "published",
    object_path: cleaned.objectPath,
    warnings: [],
    next_steps: [
      "Use the returned public WebP URL in the bilingual CMS payload.",
      "Verify the public image, alt text, page rendering, and execution receipt after content publishing.",
    ],
    auth_mode: context.authMode || "admin",
  };
  if (mode === "dry-run") return { body: { ...commonBody, payload_preview: preview } };

  let fileUrl = "";
  let saved: ContentRow | null = null;
  try {
    fileUrl = await uploadMediaObject(client, {
      bucket: cleaned.bucket,
      objectPath: cleaned.objectPath,
      bytes: cleaned.bytes,
      mimeType: cleaned.mimeType,
    });
    saved = await insertContentRecord(client, "media_assets", {
      file_url: fileUrl,
      file_path: cleaned.objectPath,
      file_name: cleaned.fileName,
      mime_type: cleaned.mimeType,
      size_bytes: cleaned.bytes.length,
      width: cleaned.width,
      height: cleaned.height,
      usage_type: cleaned.usageType,
      folder: cleaned.folder,
      alt_zh: cleaned.altZh,
      alt_en: cleaned.altEn,
      processing_status: "ready",
      processing_notes: cleaned.claimBoundary ? [cleaned.claimBoundary] : [],
      created_by: context.adminUserId || null,
    });
  } catch (error) {
    if (fileUrl) {
      try {
        await removeMediaObject(client, cleaned.bucket, cleaned.objectPath);
      } catch {
        return errorResult("Media record creation failed and uploaded-object rollback also failed.", 500);
      }
    }
    return errorResult(error instanceof Error ? error.message : "Media upload failed", 500);
  }

  const warnings: string[] = [];
  try {
    await insertAdminAuditLog(client, {
      adminUserId: context.adminUserId || null,
      action: "upload",
      tableName: "media_assets",
      recordId: String(saved?.id || ""),
      oldValue: null,
      newValue: saved,
    });
  } catch (error) {
    warnings.push(`Audit warning: ${error instanceof Error ? error.message : "Audit log failed"}`);
  }

  return {
    body: {
      ...commonBody,
      saved_id: saved?.id || null,
      file_url: fileUrl,
      size_bytes: cleaned.bytes.length,
      warnings,
    },
  };
}
