import { useDeferredValue, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminListPager from "@/components/admin/AdminListPager";
import { adminSharedText } from "@/i18n/adminSharedText";
import { getAdminLang } from "@/lib/adminLocale";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminMediaAssets } from "@/lib/adminMediaQueries";
import { formatBytes, formatDimensions, inferMediaKind, type AdminUploadedMedia } from "@/lib/adminMedia";
import { createAdminMediaAsset } from "@/backend/modules/media/service/mediaService";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";
import SmartImage from "@/components/SmartImage";
import { formatUserFacingError } from "@/lib/userFacingText";

type MediaAsset = {
  id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  folder?: string | null;
  usage_type?: string | null;
  alt_zh?: string | null;
  alt_en?: string | null;
  created_at?: string | null;
};

const usageTypes = ["all", "hero", "project", "material", "blog", "logo", "og", "before_after", "general"] as const;
type UsageType = (typeof usageTypes)[number];

export default function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  initialUsageType = "all",
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { url: string; alt_zh?: string | null; alt_en?: string | null }) => void;
  initialUsageType?: UsageType;
  title?: string;
  description?: string;
}) {
  const queryClient = useQueryClient();
  const language = getAdminLang();
  const text = adminSharedText[language];
  const [usageType, setUsageType] = useState<UsageType>(initialUsageType);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const { data, isFetching, error, refetch } = useAdminMediaAssets({ page, pageSize: 40, usageType, search: deferredSearch });
  const assets = (data?.rows ?? []) as MediaAsset[];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 40;
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    void refetch();
  }, [open, refetch]);

  useEffect(() => {
    if (error) setMessage(formatUserFacingError(error, language));
  }, [error, language]);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, usageType]);

  const createAsset = async (url: string, upload?: AdminUploadedMedia) => {
    try {
      await createAdminMediaAsset({
        url,
        upload,
        usageType: usageType === "all" ? "general" : usageType,
        folder: "media",
      });
    } catch (insertError) {
      setMessage(formatUserFacingError(insertError, language));
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["admin", "media_assets"] });
    await refetch();
  };

  const imageAssets = assets.filter((asset) => inferMediaKind({ mimeType: asset.mime_type, url: asset.file_url }) !== "video");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title || text.mediaPickerTitle}</DialogTitle>
          <DialogDescription>{description || text.mediaPickerDescription}</DialogDescription>
        </DialogHeader>

        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
            {text.supabaseNotConfigured}
          </div>
        )}

        {isSupabaseConfigured && (
          <div className="space-y-4">
            <div data-admin-filter-bar className="flex flex-col gap-2 sm:flex-row">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={text.searchMediaPlaceholder} />
              <select
                value={usageType}
                onChange={(e) => setUsageType(e.target.value as UsageType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {usageTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}
            {isFetching && <p className="text-sm text-muted-foreground">{text.mediaLoading}</p>}

            <div className="grid max-h-[48dvh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
              {imageAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="group overflow-hidden rounded-lg border border-border bg-muted text-left hover:ring-2 hover:ring-primary"
                  onClick={() => {
                    onSelect({ url: asset.file_url, alt_zh: asset.alt_zh, alt_en: asset.alt_en });
                    onOpenChange(false);
                  }}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <SmartImage src={asset.file_url} alt={asset.alt_zh || asset.alt_en || asset.file_name || "media"} width={200} height={200} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="space-y-1 p-2 text-xs text-muted-foreground">
                    <div className="truncate">{asset.file_name || asset.file_url}</div>
                    <div className="truncate">{formatDimensions(asset.width, asset.height)} · {formatBytes(asset.size_bytes)}</div>
                  </div>
                </button>
              ))}
            </div>
            <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel={text.imageUnit} onPageChange={setPage} />

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">{text.uploadNewMediaImage}</div>
              <AdminImageUpload folder="media" onUploaded={(url, upload) => void createAsset(url, upload)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{text.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
