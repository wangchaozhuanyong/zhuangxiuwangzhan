import { useDeferredValue, useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AdminMediaAsset,
  useAdminMediaAssets,
  useCreateAdminMediaAsset,
  useDeleteAdminMediaAsset,
  useUpdateAdminMediaAsset,
} from "@/lib/adminMediaQueries";
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
import { adminMediaLibraryText, adminMediaUsageTypeLabels } from "@/i18n/adminMediaLibraryText";
import { getAdminLang } from "@/lib/adminLocale";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { formatUserFacingError } from "@/lib/userFacingText";

const usageTypes = ["all", "hero", "project", "material", "blog", "logo", "icon", "og", "before_after", "video", "general"] as const;
type UsageType = (typeof usageTypes)[number];

const statusClassName: Record<ReturnType<typeof getMediaPerformanceStatus>["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

type AdminMediaLibraryTextKey = keyof typeof adminMediaLibraryText;

const AdminMediaLibrary = () => {
  const language = getAdminLang();
  const A = (key: AdminMediaLibraryTextKey) => adminMediaLibraryText[key][language];
  const formatA = (key: AdminMediaLibraryTextKey, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));
  const usageLabel = (item: UsageType) => adminMediaUsageTypeLabels[item][language];
  const resolveUsageLabel = (value?: string | null) =>
    usageTypes.includes(value as UsageType) ? usageLabel(value as UsageType) : value || A("generic");
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
      toast({ title: A("created") });
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
      toast({ title: A("saved") });
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  };

  const deleteAsset = async () => {
    if (!assetToDelete) return;
    setMessage("");
    try {
      await deleteMutation.mutateAsync(assetToDelete.id);
      toast({ title: A("deleted"), description: A("deleteToastDescription") });
      setAssetToDelete(null);
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  };

  const copyAssetUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: A("copied") });
    } catch {
      setMessage(A("copyFailed"));
    }
  };

  const banner = message || (error ? formatUserFacingError(error, language) : "");
  const initialLoading = isFetching && !data;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={A("title")}
        description={A("description")}
        helpText={A("helpText")}
      />

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{A("uploadInfo")}</div>
        <div className="mt-5">
          <AdminImageUpload folder="media" onUploaded={(url, upload) => void createAsset(url, upload)} />
        </div>
        <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-2 text-sm font-medium">{A("uploadVideo")}</div>
          <AdminVideoUpload folder="videos" onUploaded={(url, upload) => void createAsset(url, upload)} />
        </div>
        {banner && (
          <AdminAlert tone={error ? "error" : "info"} className="mt-4">
            {banner}
          </AdminAlert>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div data-admin-filter-bar className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={A("searchPlaceholder")}
            aria-label={A("searchLabel")}
          />
          <select
            value={usageType}
            onChange={(event) => setUsageType(event.target.value as UsageType)}
            aria-label={A("categoryLabel")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {usageTypes.map((item) => <option key={item} value={item}>{usageLabel(item)}</option>)}
          </select>
        </div>
      </div>

      {initialLoading ? (
        <AdminLoadingState />
      ) : (
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
                  <p className="break-all font-medium sm:truncate">{asset.file_name || asset.file_url}</p>
                  <p className="text-xs text-muted-foreground">{resolveUsageLabel(asset.usage_type)} · {asset.folder || "-"}</p>
                  <p className="text-xs text-muted-foreground">{asset.mime_type || A("unknownFormat")} · {formatDimensions(asset.width, asset.height)} · {formatBytes(asset.size_bytes)}</p>
                  {asset.original_file_path && <p className="text-xs text-muted-foreground">{formatA("originalKept", { size: formatBytes(asset.original_size_bytes) })}</p>}
                </div>
                <div className={`rounded-md border px-3 py-2 text-xs ${statusClassName[status.tone]}`}>
                  <div className="font-medium">{status.label}</div>
                  <div>{status.detail}</div>
                </div>
                <div data-admin-card-actions className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void copyAssetUrl(asset.file_url)}>{A("copyLink")}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(asset)}>{A("edit")}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setAssetToDelete(asset)}>{A("deleteRecord")}</Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      )}
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel={A("itemLabel")} onPageChange={setPage} />

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{A("editDialogTitle")}</DialogTitle>
            <DialogDescription>{A("editDialogDescription")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label htmlFor="admin-media-folder" className="mb-1.5 block text-sm font-medium">{A("folderLabel")}</label>
                <Input
                  id="admin-media-folder"
                  value={editing.folder || ""}
                  onChange={(event) => setEditing({ ...editing, folder: event.target.value })}
                  placeholder={A("folderPlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="admin-media-usage-type" className="mb-1.5 block text-sm font-medium">{A("usageTypeLabel")}</label>
                <select
                  id="admin-media-usage-type"
                  value={editing.usage_type || "general"}
                  onChange={(event) => setEditing({ ...editing, usage_type: event.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {usageTypes.filter((item) => item !== "all").map((item) => (
                    <option key={item} value={item}>{usageLabel(item)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="admin-media-alt-zh" className="mb-1.5 block text-sm font-medium">{A("altZhLabel")}</label>
                <Textarea
                  id="admin-media-alt-zh"
                  rows={3}
                  value={editing.alt_zh || ""}
                  onChange={(event) => setEditing({ ...editing, alt_zh: event.target.value })}
                  placeholder={A("altZhPlaceholder")}
                />
              </div>
              <div>
                <label htmlFor="admin-media-alt-en" className="mb-1.5 block text-sm font-medium">{A("altEnLabel")}</label>
                <Textarea
                  id="admin-media-alt-en"
                  rows={3}
                  value={editing.alt_en || ""}
                  onChange={(event) => setEditing({ ...editing, alt_en: event.target.value })}
                  placeholder={A("altEnPlaceholder")}
                />
              </div>
            </div>
          )}
          <DialogFooter data-admin-mobile-actions>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>{A("cancel")}</Button>
            <Button type="button" onClick={() => void saveAsset()} disabled={updateMutation.isPending || !editing} aria-busy={updateMutation.isPending}>
              {updateMutation.isPending ? A("saving") : A("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminConfirmDialog
        open={Boolean(assetToDelete)}
        onOpenChange={(open) => {
          if (!open) setAssetToDelete(null);
        }}
        title={A("confirmDeleteTitle")}
        description={A("confirmDeleteDescription")}
        confirmLabel={A("confirmDeleteLabel")}
        loading={deleteMutation.isPending}
        onConfirm={deleteAsset}
      />
    </div>
  );
};

export default AdminMediaLibrary;
