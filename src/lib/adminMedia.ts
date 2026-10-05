import type { AdminMediaKind } from "@/backend/modules/media";
export { buildMediaAssetInsert, getStorageObjectFromPublicUrl, getFileNameFromUrl } from "@/backend/modules/media";
export type { AdminMediaKind, AdminUploadedMedia } from "@/backend/modules/media";
import { adminMediaPerformanceText } from "@/i18n/adminMediaLibraryText";
import { getAdminLang } from "@/lib/adminLocale";
import { resolveImageDeliveryProfile } from "@/lib/imageDeliveryPolicy";

export type AdminMediaAssetLike = {
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  poster_url?: string | null;
  duration_seconds?: number | null;
  usage_type?: string | null;
};

export type MediaPerformanceStatus = {
  tone: "ok" | "warning" | "danger" | "info";
  label: string;
  detail: string;
};

export function inferMediaKind({ mimeType, url }: { mimeType?: string | null; url?: string | null }): AdminMediaKind {
  const mime = String(mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";

  const cleanUrl = String(url || "").split("?")[0]?.toLowerCase() || "";
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(cleanUrl)) return "image";
  if (/\.(mp4|webm|mov|m4v)$/i.test(cleanUrl)) return "video";
  return "unknown";
}

export function formatBytes(value?: number | null) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function formatDimensions(width?: number | null, height?: number | null) {
  if (!width || !height) return "-";
  return `${Math.round(width)} x ${Math.round(height)}`;
}

export function getMediaPerformanceStatus(asset: AdminMediaAssetLike): MediaPerformanceStatus {
  const text = adminMediaPerformanceText[getAdminLang()];
  const kind = inferMediaKind({ mimeType: asset.mime_type, url: asset.file_url });
  const size = Number(asset.size_bytes || 0);
  const width = Number(asset.width || 0);
  const height = Number(asset.height || 0);
  const mime = String(asset.mime_type || "");

  if (kind === "video") {
    if (!asset.poster_url) {
      return {
        tone: "danger",
        label: text.missingPoster.label,
        detail: text.missingPoster.detail,
      };
    }
    if (size > 60 * 1024 * 1024) {
      return {
        tone: "danger",
        label: text.videoTooLarge.label,
        detail: text.videoTooLarge.detail,
      };
    }
    if (size > 25 * 1024 * 1024) {
      return {
        tone: "warning",
        label: text.videoLarge.label,
        detail: text.videoLarge.detail,
      };
    }
    return {
      tone: "ok",
      label: text.videoOk.label,
      detail: text.videoOk.detail,
    };
  }

  if (kind === "image") {
    const profile = resolveImageDeliveryProfile({ usageType: asset.usage_type });
    if (!size || !width || !height) {
      return {
        tone: "warning",
        label: text.missingRecord.label,
        detail: text.missingRecord.detail,
      };
    }
    if (mime && mime !== "image/webp") {
      return {
        tone: "warning",
        label: text.formatNeedsOptimization.label,
        detail: text.formatNeedsOptimization.detail,
      };
    }
    if (size > profile.maxBytes * 2) {
      return {
        tone: "danger",
        label: text.imageTooLarge.label,
        detail: text.imageTooLarge.detail,
      };
    }
    if (size > profile.maxBytes || width > profile.maxEdge || height > profile.maxEdge) {
      return {
        tone: "warning",
        label: text.imageLarge.label,
        detail: text.imageLarge.detail,
      };
    }
    return {
      tone: "ok",
      label: text.optimized.label,
      detail: text.optimized.detail,
    };
  }

  return {
    tone: "info",
    label: text.unknownType.label,
    detail: text.unknownType.detail,
  };
}
