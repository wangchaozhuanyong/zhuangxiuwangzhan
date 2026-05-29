import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAdminMediaAssets } from "@/lib/adminQueries";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";
import SmartImage from "@/components/SmartImage";

type MediaAsset = {
  id: string;
  file_url: string;
  file_name?: string | null;
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
  title = "选择图片",
  description = "从媒体库选择图片，或直接上传后选择。",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { url: string; alt_zh?: string | null; alt_en?: string | null }) => void;
  initialUsageType?: UsageType;
  title?: string;
  description?: string;
}) {
  const queryClient = useQueryClient();
  const { data: assets = [], isFetching, error, refetch } = useAdminMediaAssets();
  const [usageType, setUsageType] = useState<UsageType>(initialUsageType);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    void refetch();
  }, [open, refetch]);

  useEffect(() => {
    if (error) setMessage(error instanceof Error ? error.message : String(error));
  }, [error]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (assets as MediaAsset[]).filter((asset) => {
      const matchesType = usageType === "all" || asset.usage_type === usageType;
      const haystack = [asset.file_name, asset.folder, asset.usage_type, asset.alt_zh, asset.alt_en, asset.file_url].join(" ").toLowerCase();
      return matchesType && (!q || haystack.includes(q));
    });
  }, [assets, usageType, search]);

  const createAsset = async (url: string) => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const fileName = url.split("/").pop() || "image";
    const { error: insertError } = await supabase.from("media_assets").insert({
      file_url: url,
      file_name: fileName,
      usage_type: usageType === "all" ? "general" : usageType,
      folder: "media",
      created_by: userData.user?.id || null,
    });
    if (insertError) {
      setMessage(insertError.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["admin", "media_assets"] });
    await refetch();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
            Supabase 未配置，无法使用媒体库。
          </div>
        )}

        {isSupabaseConfigured && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索文件名、文件夹、用途..." />
              <select
                value={usageType}
                onChange={(e) => setUsageType(e.target.value as UsageType)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {usageTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}
            {isFetching && <p className="text-sm text-muted-foreground">加载中...</p>}

            <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((asset) => (
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
                  <div className="p-2 text-xs text-muted-foreground truncate">{asset.file_name || asset.file_url}</div>
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">上传新图片到媒体库</div>
              <AdminImageUpload folder="media" onUploaded={(url) => void createAsset(url)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
