import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMediaStoragePublicUrl,
  hasMediaStorageClient,
  uploadAdminMediaObject,
} from "@/backend/modules/media/service/mediaService";
import type { AdminUploadedMedia } from "@/lib/adminMedia";
import { formatBytes } from "@/lib/adminMedia";
import { adminVideoUploadText } from "@/i18n/adminVideoUploadText";
import { getAdminLang } from "@/lib/adminLocale";

interface AdminVideoUploadProps {
  folder?: string;
  onUploaded: (url: string, upload?: AdminUploadedMedia) => void;
}

type PreparedVideo = {
  width: number;
  height: number;
  durationSeconds: number;
  poster: File;
};

const VIDEO_BUCKET = "site-videos";
const POSTER_BUCKET = "site-images";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const POSTER_QUALITY = 0.82;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v"]);
type AdminVideoUploadText = Record<keyof typeof adminVideoUploadText.en, string>;

const formatText = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, String(value)), text);

const sanitizeName = (value: string, fallback = "video") =>
  value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || fallback;

const sanitizeFolder = (value: string) =>
  value
    .split("/")
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    )
    .filter(Boolean)
    .join("/") || "videos";

const getPosterBlob = (video: HTMLVideoElement, text: AdminVideoUploadText) =>
  new Promise<Blob>((resolve, reject) => {
    const width = Math.max(1, video.videoWidth || 1280);
    const height = Math.max(1, video.videoHeight || 720);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error(text.posterUnsupported));
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(text.posterFailed))), "image/webp", POSTER_QUALITY);
  });

async function prepareVideo(file: File, text: AdminVideoUploadText): Promise<PreparedVideo> {
  const mime = file.type || "";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(formatText(text.tooLarge, { max: formatBytes(MAX_VIDEO_BYTES) }));
  }

  if (!ALLOWED_VIDEO_TYPES.has(mime) || !ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    throw new Error(text.invalidType);
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error(text.readFailed));
      video.src = objectUrl;
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTime = duration > 1 ? Math.min(1, duration * 0.1) : 0;
    if (seekTime > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error(text.seekFailed));
        video.currentTime = seekTime;
      });
    }

    const posterBlob = await getPosterBlob(video, text);
    const poster = new File([posterBlob], `${sanitizeName(file.name)}-poster.webp`, { type: "image/webp" });
    return {
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
      durationSeconds: Math.round(duration * 10) / 10,
      poster,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const AdminVideoUpload = ({ folder = "videos", onUploaded }: AdminVideoUploadProps) => {
  const text = adminVideoUploadText[getAdminLang()];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const upload = async (input?: File) => {
    const file = input;
    if (!file || !hasMediaStorageClient()) return;
    setUploading(true);
    setError("");
    setMessage("");

    try {
      const prepared = await prepareVideo(file, text);
      const folderPath = sanitizeFolder(folder);
      const stamp = Date.now();
      const safeName = sanitizeName(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const videoPath = `${folderPath}/${stamp}-${safeName}.${ext}`;
      const posterPath = `${folderPath}/posters/${stamp}-${safeName}.webp`;

      await uploadAdminMediaObject(POSTER_BUCKET, posterPath, prepared.poster, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp",
      });

      await uploadAdminMediaObject(VIDEO_BUCKET, videoPath, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type || undefined,
      });

      const videoUrl = getMediaStoragePublicUrl(VIDEO_BUCKET, videoPath);
      const posterUrl = getMediaStoragePublicUrl(POSTER_BUCKET, posterPath);
      const uploadInfo: AdminUploadedMedia = {
        url: videoUrl,
        bucket: VIDEO_BUCKET,
        path: videoPath,
        fileName: file.name,
        mimeType: file.type || "video/mp4",
        sizeBytes: file.size,
        kind: "video",
        width: prepared.width,
        height: prepared.height,
        durationSeconds: prepared.durationSeconds,
        posterUrl,
        posterPath,
        originalPath: videoPath,
        originalName: file.name,
        originalMimeType: file.type || undefined,
        originalSizeBytes: file.size,
        originalWidth: prepared.width,
        originalHeight: prepared.height,
      };

      setMessage(text.uploaded);
      onUploaded(videoUrl, uploadInfo);
    } catch (e) {
      setError(e instanceof Error ? e.message : text.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div data-admin-filter-bar className="flex flex-col gap-2 sm:flex-row">
        <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => upload(event.target.files?.[0])} disabled={uploading} />
        <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={uploading}>
          {uploading ? text.uploading : text.upload}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{text.helpText}</p>
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default AdminVideoUpload;
