import { useDeferredValue, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListPager from "@/components/admin/AdminListPager";
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
import {
  formatBytes,
  formatDimensions,
  getMediaPerformanceStatus,
  inferMediaKind,
  type AdminUploadedMedia,
} from "@/lib/adminMedia";
import SmartImage from "@/components/SmartImage";
import AdminImageUpload from "./AdminImageUpload";
import AdminVideoUpload from "./AdminVideoUpload";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { formatAdminMutationError } from "@/lib/adminMutation";

const usageTypes = ["all", "hero", "project", "material", "blog", "logo", "icon", "og", "before_after", "video", "general"] as const;
type UsageType = (typeof usageTypes)[number];

const usageTypeLabels: Record<UsageType, string> = {
  all: "全部分类",
  hero: "首屏",
  project: "案例",
  material: "材料",
  blog: "博客",
  logo: "品牌图标",
  icon: "网站图标",
  og: "分享预览图",
  before_after: "改造前后",
  video: "视频",
  general: "通用",
};

const statusClassName: Record<ReturnType<typeof getMediaPerformanceStatus>["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

const AdminMediaLibrary = () => {
  const [usageType, setUsageType] = useState<UsageType>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const { data, error, isFetching } = useAdminMediaAssets({ page, usageType, search: deferredSearch });
  const assets = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const [editing, setEditing] = useState<AdminMediaAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<AdminMediaAsset | null>(null);
  const [message, setMessage] = useState("");
  const createMutation = useCreateAdminMediaAsset();
  const updateMutation = useUpdateAdminMediaAsset();
  const deleteMutation = useDeleteAdminMediaAsset();

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, usageType]);

  const createAsset = async (url: string, upload?: AdminUploadedMedia) => {
    setMessage("");
    try {
      await createMutation.mutateAsync({
        url,
        upload,
        usageType: usageType === "all" ? (upload?.kind === "video" ? "video" : "general") : usageType,
        folder: upload?.kind === "video" ? "videos" : "media",
      });
      toast({ title: "媒体记录已创建" });
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  };

  const saveAsset = async () => {
    if (!editing) return;
    setMessage("");
    try {
      await updateMutation.mutateAsync(editing);
      setEditing(null);
      toast({ title: "媒体信息已保存" });
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  };

  const deleteAsset = async () => {
    if (!assetToDelete) return;
    setMessage("");
    try {
      await deleteMutation.mutateAsync(assetToDelete.id);
      toast({ title: "媒体记录已删除", description: "这里只删除后台媒体记录，不会自动删除已经上传的真实文件。" });
      setAssetToDelete(null);
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  };

  const copyAssetUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "链接已复制" });
    } catch {
      setMessage("复制失败，请手动复制图片地址。");
    }
  };

  const banner = message || (error ? (error as any).message : "");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="媒体库"
        description="集中管理上传图片、视频、用途分类和说明文字。"
        helpText="这里上传的图片会自动生成前台展示版本，并记录尺寸、大小和格式，避免客户端直接加载过大的原始素材。"
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          图片上传后会自动生成 WebP 展示图，原图会尽量保存在私有原图桶里；前台页面通过 SmartImage 按屏幕加载合适尺寸。
        </div>
        <div className="mt-5">
          <AdminImageUpload folder="media" onUploaded={(url, upload) => void createAsset(url, upload)} />
        </div>
        <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-2 text-sm font-medium">上传视频</div>
          <AdminVideoUpload folder="videos" onUploaded={(url, upload) => void createAsset(url, upload)} />
        </div>
        {banner && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{banner}</p>}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文件名、图片说明、分类..." />
          <select value={usageType} onChange={(event) => setUsageType(event.target.value as UsageType)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            {usageTypes.map((item) => <option key={item} value={item}>{usageTypeLabels[item]}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => {
          const kind = inferMediaKind({ mimeType: asset.mime_type, url: asset.file_url });
          const status = getMediaPerformanceStatus(asset);

          return (
            <article key={asset.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {kind === "video" ? (
                <video
                  src={asset.file_url}
                  poster={asset.poster_url || undefined}
                  className="h-48 w-full bg-black object-cover"
                  preload="metadata"
                  controls
                />
              ) : (
                <SmartImage
                  src={asset.file_url}
                  alt={asset.alt_zh || asset.alt_en || asset.file_name || "media"}
                  className="h-48 w-full object-cover"
                  width={640}
                  height={384}
                />
              )}
              <div className="space-y-3 p-4 text-sm">
                <div className="space-y-1">
                  <p className="truncate font-medium">{asset.file_name || asset.file_url}</p>
                  <p className="text-xs text-muted-foreground">{usageTypeLabels[(asset.usage_type as UsageType) || "general"] || asset.usage_type || "通用"} · {asset.folder || "-"}</p>
                  <p className="text-xs text-muted-foreground">{asset.mime_type || "未知格式"} · {formatDimensions(asset.width, asset.height)} · {formatBytes(asset.size_bytes)}</p>
                  {asset.original_file_path && <p className="text-xs text-muted-foreground">原图已保留：{formatBytes(asset.original_size_bytes)}</p>}
                </div>
                <div className={`rounded-md border px-3 py-2 text-xs ${statusClassName[status.tone]}`}>
                  <div className="font-medium">{status.label}</div>
                  <div>{status.detail}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void copyAssetUrl(asset.file_url)}>复制链接</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(asset)}>编辑</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setAssetToDelete(asset)}>删除记录</Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel="个媒体" onPageChange={setPage} />

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
              <Textarea rows={3} value={editing.alt_zh || ""} onChange={(event) => setEditing({ ...editing, alt_zh: event.target.value })} placeholder="中文图片说明" />
              <Textarea rows={3} value={editing.alt_en || ""} onChange={(event) => setEditing({ ...editing, alt_en: event.target.value })} placeholder="英文图片说明" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>取消</Button>
              <Button type="button" onClick={() => void saveAsset()} disabled={updateMutation.isPending} aria-busy={updateMutation.isPending}>
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <AdminConfirmDialog
        open={Boolean(assetToDelete)}
        onOpenChange={(open) => {
          if (!open) setAssetToDelete(null);
        }}
        title="确认删除媒体记录？"
        description="这一步只删除后台媒体库里的记录，不会自动删除已经上传到存储桶的真实文件。删除前请确认前台页面没有继续依赖这条媒体记录。"
        confirmLabel="删除记录"
        loading={deleteMutation.isPending}
        onConfirm={deleteAsset}
      />
    </div>
  );
};

export default AdminMediaLibrary;
