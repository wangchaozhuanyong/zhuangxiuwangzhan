import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";

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
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [usageType, setUsageType] = useState<UsageType>(initialUsageType);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(200);
    setLoading(false);
    if (error) setMessage(error.message);
    setAssets((data || []) as any);
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadAssets();
  }, [open, loadAssets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesType = usageType === "all" || asset.usage_type === usageType;
      const haystack = [asset.file_name, asset.folder, asset.usage_type, asset.alt_zh, asset.alt_en, asset.file_url].join(" ").toLowerCase();
      return matchesType && (!q || haystack.includes(q));
    });
  }, [assets, usageType, search]);

  const createAsset = async (url: string) => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const fileName = url.split("/").pop() || "image";
    const { error } = await supabase.from("media_assets").insert({
      file_url: url,
      file_name: fileName,
      usage_type: usageType === "all" ? "general" : usageType,
      folder: "media",
      created_by: userData.user?.id || null,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadAssets();
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

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索文件名、alt、分类..." />
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

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-medium">上传新图片</div>
            <Button variant="outline" size="sm" onClick={loadAssets} disabled={!isSupabaseConfigured || loading}>
              {loading ? "刷新中..." : "刷新"}
            </Button>
          </div>
          <AdminImageUpload folder="media" onUploaded={(url) => void createAsset(url)} />
          {message && <div className="mt-3 rounded-lg bg-muted p-3 text-sm">{message}</div>}
        </div>

        <div className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <button
              type="button"
              key={asset.id}
              className="group overflow-hidden rounded-xl border border-border bg-card text-left hover:border-accent"
              onClick={() => {
                onSelect({ url: asset.file_url, alt_zh: asset.alt_zh, alt_en: asset.alt_en });
                onOpenChange(false);
              }}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={asset.file_url} alt={asset.alt_zh || asset.alt_en || asset.file_name || "media"} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <div className="p-3">
                <div className="truncate text-xs font-medium">{asset.file_name || asset.file_url}</div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">{asset.usage_type || "general"} · {asset.folder || "-"}</div>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

