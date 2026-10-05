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
