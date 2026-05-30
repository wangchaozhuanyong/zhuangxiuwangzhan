import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SmartImage from "@/components/SmartImage";
import { supabase } from "@/lib/supabase";
import { getAdminLang } from "@/lib/adminLocale";

interface AdminImageUploadProps {
  value?: string;
  folder?: string;
  onUploaded: (url: string) => void;
}

const BUCKET = "site-images";
const MAX_EDGE = 2400;
const WEBP_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

const copy = {
  en: {
    previewAlt: "Uploaded preview",
    upload: "Upload",
    uploading: "Uploading...",
    bucketTip: "Uses Supabase Storage bucket:",
  },
  zh: {
    previewAlt: "已上传预览",
    upload: "上传",
    uploading: "上传中...",
    bucketTip: "使用 Supabase Storage 存储桶：",
  },
} as const;

async function prepareUploadFile(file: File): Promise<{ file: File; width?: number; height?: number; converted: boolean }> {
  const mime = file.type || "";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("图片不能超过 5MB，请先压缩后再上传。");
  }

  if (!ALLOWED_IMAGE_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("只允许上传 JPG、PNG、WebP 或 GIF 图片。");
  }

  if (mime === "image/gif") {
    return { file, converted: false };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.max(1, Math.round(bitmap.width * scale));
  const targetH = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持画布");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP 编码失败"))),
      "image/webp",
      WEBP_QUALITY,
    );
  });

  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const out = new File([blob], `${safeBase || "image"}.webp`, { type: "image/webp" });
  return { file: out, width: targetW, height: targetH, converted: true };
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

const AdminImageUpload = ({ value, folder = "content", onUploaded }: AdminImageUploadProps) => {
  const lang = getAdminLang();
  const t = copy[lang];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (input?: File) => {
    const file = input;
    if (!file || !supabase) return;
    setUploading(true);
    setError("");

    try {
      const prepared = await prepareUploadFile(file);
      const safeName = prepared.file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const ext = prepared.converted ? "webp" : prepared.file.name.split(".").pop() || "jpg";
      const path = `${sanitizeFolder(folder)}/${Date.now()}-${safeName || "image"}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, prepared.file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: prepared.converted ? "image/webp" : prepared.file.type || undefined,
      });

      if (uploadError) {
        setError(uploadError.message || "上传失败，请稍后再试。");
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败，请稍后再试。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <SmartImage src={value} alt={t.previewAlt} className="h-36 w-full object-cover" width={640} height={360} />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => upload(event.target.files?.[0])} disabled={uploading} />
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
