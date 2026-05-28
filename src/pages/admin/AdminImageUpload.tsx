import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface AdminImageUploadProps {
  value?: string;
  folder?: string;
  onUploaded: (url: string) => void;
}

const BUCKET = "site-images";

const copy = {
  en: {
    previewAlt: "Uploaded preview",
    upload: "Upload",
    uploading: "Uploading...",
    bucketTip: "Uses Supabase Storage bucket:",
    compressing: "Optimizing image...",
  },
  zh: {
    previewAlt: "已上传预览",
    upload: "上传",
    uploading: "上传中...",
    bucketTip: "使用 Supabase Storage 存储桶：",
    compressing: "正在优化图片...",
  },
} as const;

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const supportsWebp = () => {
  try {
    const canvas = document.createElement("canvas");
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
};

const loadImageBitmap = async (file: File) => {
  if ("createImageBitmap" in window) return await createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    ctx.drawImage(img, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
};

const compressImageIfNeeded = async (file: File) => {
  // Keep small images untouched to avoid quality regressions.
  const BIG_FILE_BYTES = 1_500_000;
  if (file.size < BIG_FILE_BYTES) return { file, ext: file.name.split(".").pop() || "jpg" };

  const MAX_WIDTH = 1920;
  const MAX_HEIGHT = 1920;
  const QUALITY = 0.82;

  const bitmapOrCanvas = await loadImageBitmap(file);
  const sourceWidth = "width" in bitmapOrCanvas ? bitmapOrCanvas.width : (bitmapOrCanvas as HTMLCanvasElement).width;
  const sourceHeight = "height" in bitmapOrCanvas ? bitmapOrCanvas.height : (bitmapOrCanvas as HTMLCanvasElement).height;

  const scale = Math.min(1, MAX_WIDTH / sourceWidth, MAX_HEIGHT / sourceHeight);
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { file, ext: file.name.split(".").pop() || "jpg" };
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // @ts-expect-error drawImage accepts ImageBitmap/Canvas
  ctx.drawImage(bitmapOrCanvas as any, 0, 0, targetWidth, targetHeight);

  const mime = supportsWebp() ? "image/webp" : "image/jpeg";
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mime, QUALITY));
  if (!blob) return { file, ext: file.name.split(".").pop() || "jpg" };

  const ext = mime === "image/webp" ? "webp" : "jpg";
  const optimized = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mime });
  return { file: optimized, ext };
};

const AdminImageUpload = ({ value, folder = "content", onUploaded }: AdminImageUploadProps) => {
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file?: File) => {
    if (!file || !supabase) return;
    setUploading(true);
    setError("");

    let processed = file;
    let ext = file.name.split(".").pop() || "jpg";
    try {
      setError(t.compressing);
      const result = await compressImageIfNeeded(file);
      processed = result.file;
      ext = result.ext || ext;
      setError("");
    } catch {
      setError("");
    }
    const safeName = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const path = `${folder}/${Date.now()}-${safeName}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, processed, {
      cacheControl: "31536000",
      upsert: false,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt={t.previewAlt} className="h-36 w-full object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} disabled={uploading} />
        <Button type="button" variant="outline" disabled={uploading}>
          {uploading ? t.uploading : t.upload}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        {t.bucketTip} <code>{BUCKET}</code>
      </p>
    </div>
  );
};

export default AdminImageUpload;
