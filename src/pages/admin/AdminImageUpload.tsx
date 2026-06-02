import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SmartImage from "@/components/SmartImage";
import { supabase } from "@/lib/supabase";
import { getAdminLang } from "@/lib/adminLocale";
import type { AdminUploadedMedia } from "@/lib/adminMedia";
import { useCreateAdminMediaAsset } from "@/lib/adminQueries";
import { cn } from "@/lib/utils";

export type AdminImagePreviewVariant = "cover" | "logo" | "icon" | "og";

interface AdminImageUploadProps {
  value?: string;
  folder?: string;
  previewVariant?: AdminImagePreviewVariant;
  recordAsset?: boolean;
  assetUsageType?: string;
  onUploaded: (url: string, upload?: AdminUploadedMedia) => void;
}

type PreparedUpload = {
  file: File;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  converted: boolean;
  resized: boolean;
};

const BUCKET = "site-images";
const ORIGINAL_BUCKET = "site-media-originals";
const MAX_EDGE = 2400;
const ICON_OUTPUT_SIZE = 512;
const ICON_MARK_SIZE = 468;
const ICON_MARK_COLOR = { r: 199, g: 166, b: 103 };
const WEBP_QUALITY = 0.82;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const copy = {
  en: {
    previewAlt: "Uploaded preview",
    upload: "Upload",
    uploading: "Uploading...",
    bucketTip: "Public display bucket:",
    automationTip: "Automatically keeps image metadata and generates a WebP display file for the client.",
    optimized: "Optimized display image is ready.",
    originalSaved: "Original file was kept in the private originals bucket.",
    originalSkipped: "Original bucket is not ready yet; the public optimized image was still uploaded.",
  },
  zh: {
    previewAlt: "已上传预览",
    upload: "上传",
    uploading: "上传中...",
    bucketTip: "前台展示桶：",
    automationTip: "上传后会自动记录尺寸、大小和格式，并生成前台用的 WebP 展示图。",
    optimized: "前台展示图已自动处理完成。",
    originalSaved: "原始文件已保存在私有原图桶。",
    originalSkipped: "原图桶暂未准备好，本次已先上传前台优化图。",
  },
} as const;

const sanitizeName = (value: string, fallback = "image") =>
  value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || fallback;

type PixelBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  mode: "alpha" | "non-white";
};

const getFaviconBounds = (imageData: ImageData): PixelBounds | null => {
  const { data, width, height } = imageData;
  let alphaVisible = 0;
  let transparent = 0;
  let alphaBounds: PixelBounds | null = null;
  let nonWhiteBounds: PixelBounds | null = null;

  const include = (bounds: PixelBounds | null, x: number, y: number, mode: PixelBounds["mode"]) => {
    if (!bounds) return { minX: x, minY: y, maxX: x, maxY: y, mode };
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
    return bounds;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index] ?? 0;
      const g = data[index + 1] ?? 0;
      const b = data[index + 2] ?? 0;
      const a = data[index + 3] ?? 0;
      if (a <= 8) {
        transparent += 1;
        continue;
      }

      alphaVisible += 1;
      alphaBounds = include(alphaBounds, x, y, "alpha");
      const nearWhite = r > 245 && g > 245 && b > 245;
      if (!nearWhite) nonWhiteBounds = include(nonWhiteBounds, x, y, "non-white");
    }
  }

  if (!alphaVisible) return null;
  const transparentRatio = transparent / (width * height);
  return transparentRatio > 0.05 ? alphaBounds : nonWhiteBounds || alphaBounds;
};

const prepareIconUploadFile = async (file: File, bitmap: ImageBitmap): Promise<PreparedUpload> => {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = bitmap.width;
  sourceCanvas.height = bitmap.height;
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) throw new Error("浏览器不支持图片处理画布");
  sourceCtx.drawImage(bitmap, 0, 0);

  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const bounds = getFaviconBounds(sourceData) || {
    minX: 0,
    minY: 0,
    maxX: sourceCanvas.width - 1,
    maxY: sourceCanvas.height - 1,
    mode: "alpha" as const,
  };
  const sourceW = Math.max(1, bounds.maxX - bounds.minX + 1);
  const sourceH = Math.max(1, bounds.maxY - bounds.minY + 1);
  const scale = Math.min(ICON_MARK_SIZE / sourceW, ICON_MARK_SIZE / sourceH);
  const targetW = Math.max(1, Math.round(sourceW * scale));
  const targetH = Math.max(1, Math.round(sourceH * scale));

  const markCanvas = document.createElement("canvas");
  markCanvas.width = targetW;
  markCanvas.height = targetH;
  const markCtx = markCanvas.getContext("2d");
  if (!markCtx) throw new Error("浏览器不支持图片处理画布");
  markCtx.drawImage(sourceCanvas, bounds.minX, bounds.minY, sourceW, sourceH, 0, 0, targetW, targetH);

  const markData = markCtx.getImageData(0, 0, targetW, targetH);
  for (let index = 0; index < markData.data.length; index += 4) {
    const r = markData.data[index] ?? 0;
    const g = markData.data[index + 1] ?? 0;
    const b = markData.data[index + 2] ?? 0;
    const nearWhite = r > 245 && g > 245 && b > 245;
    if (bounds.mode === "non-white" && nearWhite) {
      markData.data[index + 3] = 0;
      continue;
    }
    markData.data[index] = ICON_MARK_COLOR.r;
    markData.data[index + 1] = ICON_MARK_COLOR.g;
    markData.data[index + 2] = ICON_MARK_COLOR.b;
  }
  markCtx.putImageData(markData, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = ICON_OUTPUT_SIZE;
  canvas.height = ICON_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持图片处理画布");
  ctx.drawImage(markCanvas, Math.round((ICON_OUTPUT_SIZE - targetW) / 2), Math.round((ICON_OUTPUT_SIZE - targetH) / 2));

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP 编码失败"))),
      "image/webp",
      WEBP_QUALITY,
    );
  });

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("自动处理后的展示图仍超过 5MB。请换一张更合理的素材，或后续交给服务端处理队列。");
  }

  const out = new File([blob], `${sanitizeName(file.name, "favicon")}.webp`, { type: "image/webp" });
  return {
    file: out,
    width: ICON_OUTPUT_SIZE,
    height: ICON_OUTPUT_SIZE,
    originalWidth: bitmap.width,
    originalHeight: bitmap.height,
    converted: true,
    resized: true,
  };
};

async function prepareUploadFile(file: File, variant: AdminImagePreviewVariant = "cover"): Promise<PreparedUpload> {
  const mime = file.type || "";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("原图不能超过 20MB。后台会自动处理展示图，但太大的原图会让浏览器处理不稳定。");
  }

  if (!ALLOWED_IMAGE_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("只允许上传 JPG、PNG、WebP 图片。GIF 动图暂时不进公共媒体库，避免体积过大影响客户端。");
  }

  const bitmap = await createImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  if (variant === "icon") {
    try {
      return await prepareIconUploadFile(file, bitmap);
    } finally {
      bitmap.close?.();
    }
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(originalWidth, originalHeight));
  const targetW = Math.max(1, Math.round(originalWidth * scale));
  const targetH = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持图片处理画布");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP 编码失败"))),
      "image/webp",
      WEBP_QUALITY,
    );
  });

  bitmap.close?.();

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("自动处理后的展示图仍超过 5MB。请换一张更合理的素材，或后续交给服务端处理队列。");
  }

  const out = new File([blob], `${sanitizeName(file.name)}.webp`, { type: "image/webp" });
  return {
    file: out,
    width: targetW,
    height: targetH,
    originalWidth,
    originalHeight,
    converted: true,
    resized: targetW !== originalWidth || targetH !== originalHeight,
  };
}

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
    .join("/") || "content";

export const getAdminImagePreviewVariant = (key: string): AdminImagePreviewVariant => {
  const normalized = key.toLowerCase();
  if (normalized.includes("favicon") || normalized.includes("icon")) return "icon";
  if (normalized.includes("og_image") || normalized.includes("share")) return "og";
  if (normalized.includes("logo")) return "logo";
  return "cover";
};

const previewConfig: Record<
  AdminImagePreviewVariant,
  {
    frameClassName: string;
    imageClassName: string;
    width: number;
    height: number;
    resize: "contain" | "cover";
    sizes: string;
  }
> = {
  cover: {
    frameClassName: "h-36 overflow-hidden bg-muted",
    imageClassName: "h-full w-full object-cover",
    width: 640,
    height: 360,
    resize: "cover",
    sizes: "(max-width: 768px) 100vw, 640px",
  },
  logo: {
    frameClassName: "flex min-h-32 items-center justify-center bg-muted/35 p-6",
    imageClassName: "h-auto max-h-20 max-w-full object-contain",
    width: 420,
    height: 160,
    resize: "contain",
    sizes: "(max-width: 768px) 80vw, 420px",
  },
  icon: {
    frameClassName: "flex min-h-36 items-center justify-center bg-muted/35 p-5",
    imageClassName: "h-24 w-24 rounded-xl object-contain",
    width: 160,
    height: 160,
    resize: "contain",
    sizes: "160px",
  },
  og: {
    frameClassName: "aspect-[1200/630] overflow-hidden bg-muted/35 p-2",
    imageClassName: "h-full w-full object-contain",
    width: 1200,
    height: 630,
    resize: "contain",
    sizes: "(max-width: 768px) 100vw, 1200px",
  },
};

async function tryUploadOriginalCopy({ file, folderPath, stamp }: { file: File; folderPath: string; stamp: number }) {
  if (!supabase) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "image";
  const originalPath = `${folderPath}/original/${stamp}-${sanitizeName(file.name)}.${ext}`;
  const { error } = await supabase.storage.from(ORIGINAL_BUCKET).upload(originalPath, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });

  return error ? null : originalPath;
}

const AdminImageUpload = ({ value, folder = "content", previewVariant = "cover", recordAsset = false, assetUsageType = "general", onUploaded }: AdminImageUploadProps) => {
  const lang = getAdminLang();
  const t = copy[lang];
  const createMediaAsset = useCreateAdminMediaAsset();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const preview = previewConfig[previewVariant];

  const upload = async (input?: File) => {
    const file = input;
    if (!file || !supabase) return;
    setUploading(true);
    setError("");
    setNotes([]);

    try {
      const prepared = await prepareUploadFile(file, previewVariant);
      const folderPath = sanitizeFolder(folder);
      const stamp = Date.now();
      const originalPath = await tryUploadOriginalCopy({ file, folderPath, stamp });
      const safeName = sanitizeName(prepared.file.name);
      const path = `${folderPath}/${stamp}-${safeName}.webp`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, prepared.file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp",
      });

      if (uploadError) {
        setError(uploadError.message || "上传失败，请稍后再试。");
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const uploadInfo: AdminUploadedMedia = {
        url: data.publicUrl,
        bucket: BUCKET,
        path,
        fileName: prepared.file.name,
        mimeType: "image/webp",
        sizeBytes: prepared.file.size,
        kind: "image",
        width: prepared.width,
        height: prepared.height,
        originalPath: originalPath || undefined,
        originalName: file.name,
        originalMimeType: file.type || undefined,
        originalSizeBytes: file.size,
        originalWidth: prepared.originalWidth,
        originalHeight: prepared.originalHeight,
        converted: prepared.converted,
        resized: prepared.resized,
      };

      onUploaded(data.publicUrl, uploadInfo);
      const nextNotes: string[] = [t.optimized, originalPath ? t.originalSaved : t.originalSkipped];
      if (recordAsset) {
        try {
          await createMediaAsset.mutateAsync({
            url: data.publicUrl,
            upload: uploadInfo,
            usageType: assetUsageType,
            folder,
          });
        } catch (assetError) {
          nextNotes.push(assetError instanceof Error ? `媒体库记录创建失败：${assetError.message}` : "媒体库记录创建失败。");
        }
      }
      setNotes(nextNotes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败，请稍后再试。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className={cn("rounded-lg border border-border", preview.frameClassName)}>
          <SmartImage
            src={value}
            alt={t.previewAlt}
            className={preview.imageClassName}
            width={preview.width}
            height={preview.height}
            resize={preview.resize}
            sizes={preview.sizes}
          />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => upload(event.target.files?.[0])} disabled={uploading} />
        <Button type="button" variant="outline" disabled={uploading}>
          {uploading ? t.uploading : t.upload}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {notes.length > 0 && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t.automationTip}</p>
      <p className="text-xs text-muted-foreground">
        {t.bucketTip} <code>{BUCKET}</code>
      </p>
    </div>
  );
};

export default AdminImageUpload;
