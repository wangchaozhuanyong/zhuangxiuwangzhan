import { ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import MediaPicker from "@/components/admin/MediaPicker";
import SmartImage from "@/components/SmartImage";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";
import { useCreateAdminMediaAsset } from "@/lib/adminQueries";
import type { AdminUploadedMedia } from "@/lib/adminMedia";

export default function ImageField({
  label,
  value,
  onChange,
  folder,
  usageType,
  altValue,
  onAltChange,
  helpText,
  className,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;
  usageType?: "hero" | "project" | "material" | "blog" | "logo" | "og" | "before_after" | "general";
  altValue?: string;
  onAltChange?: (alt: string) => void;
  helpText?: ReactNode;
  className?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("");
  const createMediaAsset = useCreateAdminMediaAsset();
  const previewAlt = useMemo(() => (altValue ? altValue : label), [altValue, label]);

  const handleUploaded = async (url: string, upload?: AdminUploadedMedia) => {
    onChange(url);
    setMediaMessage("");
    try {
      await createMediaAsset.mutateAsync({
        url,
        upload,
        usageType: usageType || "general",
        folder,
      });
    } catch (e) {
      setMediaMessage(e instanceof Error ? `图片已上传，但媒体库记录创建失败：${e.message}` : "图片已上传，但媒体库记录创建失败。");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-sm font-medium">{label}</label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            从媒体库选择
          </Button>
        </div>
      </div>

      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="粘贴图片链接，或从媒体库选择 / 上传" />

      {value && (
        <div className="overflow-hidden rounded-lg border border-border bg-muted">
          <SmartImage src={value} alt={previewAlt} className="h-40 w-full object-cover" width={640} height={320} />
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="mb-2 text-xs font-medium text-muted-foreground">上传新图片</div>
        <AdminImageUpload value={value} folder={folder} onUploaded={(url, upload) => void handleUploaded(url, upload)} />
      </div>
      {mediaMessage && <p className="text-xs text-amber-700">{mediaMessage}</p>}

      {typeof altValue === "string" && onAltChange && (
        <div>
          <label className="mb-1 block text-sm font-medium">图片说明</label>
          <Input value={altValue} onChange={(e) => onAltChange(e.target.value)} placeholder="建议：描述图片内容与场景" />
        </div>
      )}

      {helpText && <div className="text-xs text-muted-foreground">{helpText}</div>}

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialUsageType={usageType || "all"}
        onSelect={({ url, alt_zh }) => {
          onChange(url);
          if (typeof altValue === "string" && onAltChange && !altValue && alt_zh) onAltChange(String(alt_zh));
        }}
      />
    </div>
  );
}
