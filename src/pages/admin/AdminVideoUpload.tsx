import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import type { AdminUploadedMedia } from "@/lib/adminMedia";
import { formatBytes } from "@/lib/adminMedia";

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

const getPosterBlob = (video: HTMLVideoElement) =>
  new Promise<Blob>((resolve, reject) => {
    const width = Math.max(1, video.videoWidth || 1280);
    const height = Math.max(1, video.videoHeight || 720);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("浏览器不支持视频封面处理"));
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("视频封面生成失败"))), "image/webp", POSTER_QUALITY);
  });

async function prepareVideo(file: File): Promise<PreparedVideo> {
  const mime = file.type || "";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`视频不能超过 ${formatBytes(MAX_VIDEO_BYTES)}。更大的视频建议走服务端转码队列或视频云服务。`);
  }

  if (!ALLOWED_VIDEO_TYPES.has(mime) || !ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    throw new Error("只允许上传 MP4、WebM、MOV 视频。");
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("视频读取失败，请确认文件没有损坏。"));
      video.src = objectUrl;
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTime = duration > 1 ? Math.min(1, duration * 0.1) : 0;
    if (seekTime > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("视频封面截取失败。"));
        video.currentTime = seekTime;
      });
    }

    const posterBlob = await getPosterBlob(video);
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const upload = async (input?: File) => {
    const file = input;
    if (!file || !supabase) return;
    setUploading(true);
    setError("");
    setMessage("");

    try {
      const prepared = await prepareVideo(file);
      const folderPath = sanitizeFolder(folder);
      const stamp = Date.now();
      const safeName = sanitizeName(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const videoPath = `${folderPath}/${stamp}-${safeName}.${ext}`;
      const posterPath = `${folderPath}/posters/${stamp}-${safeName}.webp`;

      const { error: posterError } = await supabase.storage.from(POSTER_BUCKET).upload(posterPath, prepared.poster, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp",
      });
      if (posterError) throw posterError;

      const { error: videoError } = await supabase.storage.from(VIDEO_BUCKET).upload(videoPath, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (videoError) throw videoError;

      const { data: videoData } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(videoPath);
      const { data: posterData } = supabase.storage.from(POSTER_BUCKET).getPublicUrl(posterPath);
      const uploadInfo: AdminUploadedMedia = {
        url: videoData.publicUrl,
        bucket: VIDEO_BUCKET,
        path: videoPath,
        fileName: file.name,
        mimeType: file.type || "video/mp4",
        sizeBytes: file.size,
        kind: "video",
        width: prepared.width,
        height: prepared.height,
        durationSeconds: prepared.durationSeconds,
        posterUrl: posterData.publicUrl,
        posterPath,
        originalPath: videoPath,
        originalName: file.name,
        originalMimeType: file.type || undefined,
        originalSizeBytes: file.size,
        originalWidth: prepared.width,
        originalHeight: prepared.height,
      };

      setMessage("视频已上传，并已自动生成 WebP 封面。前台使用时请保持 poster 优先和延迟加载。");
      onUploaded(videoData.publicUrl, uploadInfo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "视频上传失败，请稍后再试。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => upload(event.target.files?.[0])} disabled={uploading} />
        <Button type="button" variant="outline" disabled={uploading}>
          {uploading ? "上传中..." : "上传视频"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">上传后会自动读取视频宽高、时长、大小，并截取 WebP 封面。视频本体不会被删，也不会改像素。</p>
      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default AdminVideoUpload;
