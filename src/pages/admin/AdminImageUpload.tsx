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

async function prepareUploadFile(file: File): Promise<PreparedUpload> {
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
    frameClassName: "flex min-h-32 items-center justify-center bg-muted/35 p-5",
    imageClassName: "h-16 w-16 rounded-lg object-contain",
    width: 96,
    height: 96,
    resize: "contain",
    sizes: "96px",
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
      const prepared = await prepareUploadFile(file);
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
