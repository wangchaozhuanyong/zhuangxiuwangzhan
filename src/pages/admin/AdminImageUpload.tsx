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
  },
  zh: {
    previewAlt: "已上传预览",
    upload: "上传",
    uploading: "上传中...",
    bucketTip: "使用 Supabase Storage 存储桶：",
  },
} as const;

const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const AdminImageUpload = ({ value, folder = "content", onUploaded }: AdminImageUploadProps) => {
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file?: File) => {
    if (!file || !supabase) return;
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop() || "jpg";
    const safeName = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const path = `${folder}/${Date.now()}-${safeName}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
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
