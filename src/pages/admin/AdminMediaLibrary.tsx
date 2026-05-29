import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminMediaAsset,
  useAdminMediaAssets,
  useCreateAdminMediaAsset,
  useDeleteAdminMediaAsset,
  useUpdateAdminMediaAsset,
} from "@/lib/adminQueries";
import SmartImage from "@/components/SmartImage";
import AdminImageUpload from "./AdminImageUpload";

const usageTypes = ["all", "hero", "project", "material", "blog", "logo", "og", "before_after", "general"] as const;

const usageTypeLabels: Record<(typeof usageTypes)[number], string> = {
  all: "全部分类",
  hero: "首屏",
  project: "案例",
  material: "材料",
  blog: "博客",
  logo: "品牌 Logo",
  og: "分享预览图",
  before_after: "改造前后",
  general: "通用",
};

const AdminMediaLibrary = () => {
  const { data: assets = [], error } = useAdminMediaAssets();
  const [usageType, setUsageType] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminMediaAsset | null>(null);
  const [message, setMessage] = useState("");
  const createMutation = useCreateAdminMediaAsset();
  const updateMutation = useUpdateAdminMediaAsset();
  const deleteMutation = useDeleteAdminMediaAsset();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesType = usageType === "all" || asset.usage_type === usageType;
      const haystack = [asset.file_name, asset.folder, asset.usage_type, asset.alt_zh, asset.alt_en].join(" ").toLowerCase();
      return matchesType && (!query || haystack.includes(query));
    });
  }, [assets, search, usageType]);

  const createAsset = async (url: string) => {
    setMessage("");
    try {
      await createMutation.mutateAsync({ url });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "创建媒体记录失败");
    }
  };

  const saveAsset = async () => {
    if (!editing) return;
    setMessage("");
    try {
      await updateMutation.mutateAsync(editing);
      setEditing(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "保存失败");
    }
  };

  const deleteAsset = async (id: string) => {
    setMessage("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "删除失败");
    }
  };

  const banner = message || (error ? (error as any).message : "");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-bold">媒体库</h1>
        <p className="mt-2 text-sm text-muted-foreground">上传图片、复制 URL，并管理 alt 文案与用途分类。</p>
        <div className="mt-5">
          <AdminImageUpload folder="media" onUploaded={(url) => void createAsset(url)} />
        </div>
        {banner && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{banner}</p>}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文件名、alt、分类..." />
          <select value={usageType} onChange={(event) => setUsageType(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            {usageTypes.map((item) => <option key={item} value={item}>{usageTypeLabels[item]}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((asset) => (
          <article key={asset.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <SmartImage
              src={asset.file_url}
              alt={asset.alt_zh || asset.alt_en || asset.file_name || "media"}
              className="h-48 w-full object-cover"
              width={640}
              height={384}
            />
            <div className="space-y-3 p-4 text-sm">
              <p className="truncate font-medium">{asset.file_name || asset.file_url}</p>
              <p className="text-xs text-muted-foreground">{usageTypeLabels[(asset.usage_type as keyof typeof usageTypeLabels) || "general"] || asset.usage_type || "通用"} · {asset.folder || "-"}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(asset.file_url)}>复制 URL</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(asset)}>编辑</Button>
                <Button size="sm" variant="outline" onClick={() => void deleteAsset(asset.id)}>删除记录</Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 font-display text-xl font-bold">编辑媒体信息</h2>
            <div className="space-y-4">
              <Input value={editing.folder || ""} onChange={(event) => setEditing({ ...editing, folder: event.target.value })} placeholder="文件夹" />
              <select value={editing.usage_type || "general"} onChange={(event) => setEditing({ ...editing, usage_type: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {usageTypes.filter((item) => item !== "all").map((item) => (
                  <option key={item} value={item}>{usageTypeLabels[item]}</option>
                ))}
              </select>
              <Textarea rows={3} value={editing.alt_zh || ""} onChange={(event) => setEditing({ ...editing, alt_zh: event.target.value })} placeholder="中文 Alt 文本" />
              <Textarea rows={3} value={editing.alt_en || ""} onChange={(event) => setEditing({ ...editing, alt_en: event.target.value })} placeholder="英文 Alt 文本" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
              <Button onClick={() => void saveAsset()}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaLibrary;
