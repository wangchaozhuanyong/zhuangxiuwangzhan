import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload from "./AdminImageUpload";
import AdminLayout from "./AdminLayout";
import { AdminFilters, AdminPageShell } from "./AdminPageShell";

const usageTypes = ["all", "hero", "project", "material", "blog", "logo", "og", "before_after", "general"];

const AdminMediaLibrary = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [usageType, setUsageType] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [message, setMessage] = useState("");

  const loadAssets = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from("media_assets").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) setMessage(error.message);
    else setAssets(data || []);
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesType = usageType === "all" || asset.usage_type === usageType;
      const haystack = [asset.file_name, asset.folder, asset.usage_type, asset.alt_zh, asset.alt_en].join(" ").toLowerCase();
      return matchesType && (!query || haystack.includes(query));
    });
  }, [assets, search, usageType]);

  const createAsset = async (url: string) => {
    const { data: userData } = await supabase!.auth.getUser();
    const fileName = url.split("/").pop() || "image";
    const { error } = await supabase!.from("media_assets").insert({
      file_url: url,
      file_name: fileName,
      usage_type: "general",
      folder: "media",
      created_by: userData.user?.id || null,
    });
    if (error) setMessage(error.message);
    else await loadAssets();
  };

  const saveAsset = async () => {
    if (!editing) return;
    const { error } = await supabase!.from("media_assets").update({
      alt_zh: editing.alt_zh || null,
      alt_en: editing.alt_en || null,
      usage_type: editing.usage_type || null,
      folder: editing.folder || null,
    }).eq("id", editing.id);
    if (error) setMessage(error.message);
    else {
      setEditing(null);
      await loadAssets();
    }
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase!.from("media_assets").delete().eq("id", id);
    if (error) setMessage(error.message);
    else await loadAssets();
  };

  return (
    <AdminLayout>
      <AdminPageShell
        title="媒体库 / Media Library"
        description="上传图片、复制 URL，并管理 alt 文案与用途分类。"
        actions={<AdminImageUpload folder="media" onUploaded={(url) => void createAsset(url)} />}
      >
        <div className="space-y-4">
          <AdminFilters>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文件名、alt、分类..." />
            <select value={usageType} onChange={(event) => setUsageType(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              {usageTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </AdminFilters>

          {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((asset) => (
              <article key={asset.id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
                <img src={asset.file_url} alt={asset.alt_zh || asset.alt_en || asset.file_name || "media"} className="h-48 w-full object-cover" />
                <div className="space-y-3 p-4 text-sm">
                  <p className="truncate font-medium">{asset.file_name || asset.file_url}</p>
                  <p className="truncate text-xs text-muted-foreground">{asset.usage_type || "general"} · {asset.folder || "-"}</p>
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
                  <Input value={editing.folder || ""} onChange={(event) => setEditing({ ...editing, folder: event.target.value })} placeholder="Folder" />
                  <select value={editing.usage_type || "general"} onChange={(event) => setEditing({ ...editing, usage_type: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {usageTypes.filter((item) => item !== "all").map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <Textarea rows={3} value={editing.alt_zh || ""} onChange={(event) => setEditing({ ...editing, alt_zh: event.target.value })} placeholder="中文 alt" />
                  <Textarea rows={3} value={editing.alt_en || ""} onChange={(event) => setEditing({ ...editing, alt_en: event.target.value })} placeholder="English alt" />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
                  <Button onClick={() => void saveAsset()}>保存</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export default AdminMediaLibrary;
