export type AdminMediaKind = "image" | "video" | "unknown";

export type AdminUploadedMedia = {
  url: string;
  bucket: string;
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: AdminMediaKind;
  width?: number;
  height?: number;
  durationSeconds?: number;
  posterUrl?: string;
  posterPath?: string;
  originalPath?: string;
  originalName?: string;
  originalMimeType?: string;
  originalSizeBytes?: number;
  originalWidth?: number;
  originalHeight?: number;
  converted?: boolean;
  resized?: boolean;
};

export type AdminMediaAssetLike = {
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  poster_url?: string | null;
  duration_seconds?: number | null;
};

export type MediaPerformanceStatus = {
  tone: "ok" | "warning" | "danger" | "info";
  label: string;
  detail: string;
};

const PUBLIC_OBJECT_MARKER = "/storage/v1/object/public/";

export function getStorageObjectFromPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const markerIndex = parsed.pathname.indexOf(PUBLIC_OBJECT_MARKER);
    if (markerIndex < 0) return null;

    const objectPart = parsed.pathname.slice(markerIndex + PUBLIC_OBJECT_MARKER.length);
    const [bucket, ...pathParts] = objectPart.split("/");
    const path = pathParts.join("/");
    if (!bucket || !path) return null;

    return {
      bucket: decodeURIComponent(bucket),
      path: decodeURIComponent(path),
    };
  } catch {
    return null;
  }
}

export function getFileNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = decodeURIComponent(parsed.pathname);
    return pathname.split("/").filter(Boolean).pop() || "media";
  } catch {
    return url.split("?")[0]?.split("/").filter(Boolean).pop() || "media";
  }
}

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

export function buildMediaAssetInsert({
  url,
  upload,
  usageType = "general",
  folder = "media",
  createdBy,
}: {
  url: string;
  upload?: AdminUploadedMedia;
  usageType?: string;
  folder?: string;
  createdBy?: string | null;
}) {
  const storageObject = getStorageObjectFromPublicUrl(upload?.url || url);
  const fileName = upload?.fileName || getFileNameFromUrl(url);

  return {
    file_url: upload?.url || url,
    file_path: upload?.path || storageObject?.path || null,
    file_name: fileName,
    mime_type: upload?.mimeType || null,
    size_bytes: upload?.sizeBytes || null,
    width: upload?.width || null,
    height: upload?.height || null,
    poster_url: upload?.posterUrl || null,
    duration_seconds: upload?.durationSeconds || null,
    original_file_path: upload?.originalPath || null,
    original_mime_type: upload?.originalMimeType || null,
    original_size_bytes: upload?.originalSizeBytes || null,
    original_width: upload?.originalWidth || null,
    original_height: upload?.originalHeight || null,
    processing_status: "ready",
    usage_type: usageType,
    folder,
    created_by: createdBy || null,
  };
}

export function getMediaPerformanceStatus(asset: AdminMediaAssetLike): MediaPerformanceStatus {
  const kind = inferMediaKind({ mimeType: asset.mime_type, url: asset.file_url });
  const size = Number(asset.size_bytes || 0);
  const width = Number(asset.width || 0);
  const height = Number(asset.height || 0);
  const mime = String(asset.mime_type || "");

  if (kind === "video") {
    if (!asset.poster_url) {
      return {
        tone: "danger",
        label: "缺少封面",
        detail: "视频没有 poster，客户端容易一上来就等视频画面。",
      };
    }
    if (size > 60 * 1024 * 1024) {
      return {
        tone: "danger",
        label: "视频过大",
        detail: "建议给前台单独生成轻量 MP4/WebM 版本。",
      };
    }
    if (size > 25 * 1024 * 1024) {
      return {
        tone: "warning",
        label: "视频偏大",
        detail: "可以上传，但前台必须 poster 优先、延迟加载。",
      };
    }
    return {
      tone: "ok",
      label: "视频可控",
      detail: "有封面，适合配合延迟加载使用。",
    };
  }

  if (kind === "image") {
    if (!size || !width || !height) {
      return {
        tone: "warning",
        label: "缺少记录",
        detail: "缺少尺寸或大小，后台无法判断这张图是否拖慢客户端。",
      };
    }
    if (mime && mime !== "image/webp") {
      return {
        tone: "warning",
        label: "格式待优化",
        detail: "建议走后台上传，让系统生成 WebP 展示版。",
      };
    }
    if (size > 3 * 1024 * 1024) {
      return {
        tone: "danger",
        label: "图片过大",
        detail: "前台不应该直接使用这个文件。",
      };
    }
    if (size > 1024 * 1024 || width > 2400 || height > 2400) {
      return {
        tone: "warning",
        label: "图片偏大",
        detail: "可以用，但列表和移动端必须加载较小展示版本。",
      };
    }
    return {
      tone: "ok",
      label: "已优化",
      detail: "尺寸和体积适合通过 SmartImage 响应式加载。",
    };
  }

  return {
    tone: "info",
    label: "未知类型",
    detail: "建议重新通过媒体库上传，让后台补齐文件信息。",
  };
}
