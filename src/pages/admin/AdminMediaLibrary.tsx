import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useAdminListingState } from "@/hooks/useAdminListingState";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useRef, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminActionMenu from "@/components/admin/AdminActionMenu";
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
import { useAdminLang } from "@/lib/adminLocale";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { formatUserFacingError } from "@/lib/userFacingText";

const usageTypes = ["all", "hero", "project", "material", "blog", "logo", "icon", "og", "before_after", "video", "general"] as const;
type UsageType = (typeof usageTypes)[number];

const statusClassName: Record<ReturnType<typeof getMediaPerformanceStatus>["tone"], string> = {
  ok: "admin-tone-success",
  warning: "admin-tone-warning",
  danger: "admin-tone-error",
  info: "admin-tone-neutral",
};

type AdminMediaLibraryTextKey = keyof typeof adminMediaLibraryText;

const AdminMediaLibrary = () => {
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  const language = useAdminLang();
  const A = (key: AdminMediaLibraryTextKey) => adminMediaLibraryText[key][language];
  const formatA = (key: AdminMediaLibraryTextKey, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));
  const usageLabel = (item: UsageType) => adminMediaUsageTypeLabels[item][language];
  const resolveUsageLabel = (value?: string | null) =>
    usageTypes.includes(value as UsageType) ? usageLabel(value as UsageType) : value || A("generic");
  const list = useAdminListingState();
  const { search, setSearch, deferredSearch, page, setPage } = list;
  const usageType = list.filter("usage") as UsageType;
  const setUsageType = (value: UsageType) => list.setFilter("usage", value);

  const { data, error, isLoading, isFetching, isPlaceholderData } = useAdminMediaAssets({ page, usageType, search: deferredSearch });
  const assets = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const [editing, setEditing] = useState<AdminMediaAsset | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  useUnsavedChangesWarning(!!editing || isSubmitting);
  const [assetToDelete, setAssetToDelete] = useState<AdminMediaAsset | null>(null);
  const deleteFocusReturn = useRef<HTMLElement | null>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("");
  const createMutation = useCreateAdminMediaAsset();
  const updateMutation = useUpdateAdminMediaAsset();
  const deleteMutation = useDeleteAdminMediaAsset();


  const createAsset = protectSubmission("createAsset", async (url: string, upload?: AdminUploadedMedia) => {
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
  });

  const saveAsset = protectSubmission("saveAsset", async () => {
    if (!editing) return;
    setMessage("");
    try {
      await updateMutation.mutateAsync(editing);
      setEditing((current) => JSON.stringify(current) === JSON.stringify(editing) ? null : current);
      toast({ title: A("saved") });
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  });

  const deleteAsset = protectSubmission("deleteAsset", async () => {
    if (!assetToDelete) return;
    setMessage("");
    try {
      await deleteMutation.mutateAsync(assetToDelete.id);
      toast({ title: A("deleted"), description: A("deleteToastDescription") });
      setAssetToDelete(null);
    } catch (e) {
      setMessage(formatAdminMutationError(e));
    }
  });

  const copyAssetUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: A("copied") });
    } catch {
      setMessage(A("copyFailed"));
    }
  };

  const banner = message || (error ? formatUserFacingError(error, language) : "");
  const initialLoading = isLoading;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={A("title")}
        description={A("description")}
        helpText={A("helpText")}
        actions={<Button ref={uploadButton} type="button" variant="outline" aria-expanded={uploadOpen} aria-controls="admin-media-upload" onClick={() => setUploadOpen((open) => !open)}>{A("uploadMedia")}</Button>}
      />

      <div id="admin-media-upload" hidden={!uploadOpen} className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <p className="mb-3 text-sm text-muted-foreground">{A("uploadInfo")}</p>
        <details className="rounded-lg border border-border px-3">
          <summary className="cursor-pointer py-3 text-sm font-medium">{A("uploadImage")}</summary>
          <div className="pb-3">
            <AdminImageUpload
              folder="media"
              assetUsageType={usageType === "all" ? "general" : usageType}
              onUploaded={(url, upload) => void createAsset(url, upload)}
            />
          </div>
        </details>
        <details className="mt-3 rounded-lg border border-border px-3">
          <summary className="cursor-pointer py-3 text-sm font-medium">{A("uploadVideo")}</summary>
          <div className="pb-3"><AdminVideoUpload folder="videos" onUploaded={(url, upload) => void createAsset(url, upload)} /></div>
        </details>
      </div>
      {banner && <AdminAlert tone={error ? "error" : "info"}>{banner}</AdminAlert>}

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
      ) : !error && assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">{A("empty")}</div>
      ) : (
      <div ref={(node) => node?.toggleAttribute("inert", isPlaceholderData)} aria-busy={isPlaceholderData} className="grid grid-cols-1 items-start gap-3 min-[360px]:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => {
          const kind = inferMediaKind({ mimeType: asset.mime_type, url: asset.file_url });
          const status = getMediaPerformanceStatus(asset);

          return (
            <article key={asset.id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[4/3] overflow-hidden">
              {kind === "video" ? (
                <video
                  src={asset.file_url}
                  poster={asset.poster_url || undefined}
                  className="h-full w-full bg-black object-cover"
                  preload="metadata"
                  controls
                />
              ) : (
                <SmartImage
                  src={asset.file_url}
                  alt={asset.alt_zh || asset.alt_en || asset.file_name || A("title")}
                  className="h-full w-full object-cover"
                  width={640}
                  height={480}
                  sizes="(min-width: 1280px) 25vw, 50vw"
                />
              )}
              </div>
              <div className="min-w-0 space-y-2 p-2.5 text-sm sm:p-4">
                <div className="space-y-1">
                  <p className="truncate font-medium" title={asset.file_name || asset.file_url}>{asset.file_name || asset.file_url}</p>
                  <p className="truncate text-xs text-muted-foreground">{resolveUsageLabel(asset.usage_type)}</p>
                </div>
                <div className={`rounded-md border px-2 py-1.5 text-xs ${statusClassName[status.tone]}`}>
                  <div className="truncate font-medium" title={status.label}>{status.label}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="min-h-11 min-w-0 flex-1 px-2" onClick={() => setEditing(asset)}>{A("details")}</Button>
                  <AdminActionMenu compact>
                    <Button type="button" variant="outline" onClick={() => void copyAssetUrl(asset.file_url)}>{A("copyLink")}</Button>
                    <Button type="button" variant="outline" onClick={(event) => {
                      const triggerId = event.currentTarget.closest<HTMLElement>("[data-admin-confirm-focus-return]")?.dataset.adminConfirmFocusReturn;
                      deleteFocusReturn.current = triggerId ? document.getElementById(triggerId) : event.currentTarget;
                      setAssetToDelete(asset);
                    }}>{A("deleteRecord")}</Button>
                  </AdminActionMenu>
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
        <DialogContent className="flex max-w-xl flex-col overflow-hidden [&>button]:h-11 [&>button]:w-11" closeLabel={A("close")}>
          <DialogHeader className="shrink-0 text-left">
            <DialogTitle>{A("editDialogTitle")}</DialogTitle>
            <DialogDescription>{A("editDialogDescription")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="break-all font-medium text-foreground">{editing.file_name || editing.file_url}</p>
                <p className="break-words">{editing.mime_type || A("unknownFormat")} · {formatDimensions(editing.width, editing.height)} · {formatBytes(editing.size_bytes)}</p>
                {editing.original_file_path && <p>{formatA("originalKept", { size: formatBytes(editing.original_size_bytes) })}</p>}
                <p>{getMediaPerformanceStatus(editing).label} · {getMediaPerformanceStatus(editing).detail}</p>
              </div>
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
          <DialogFooter data-admin-mobile-actions className="shrink-0 border-t border-border pt-3 [&_button]:min-h-11">
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
        onCloseAutoFocus={(event) => {
          // The menu item has unmounted; a deleted card may also be gone.
          const target = deleteFocusReturn.current?.isConnected ? deleteFocusReturn.current : uploadButton.current;
          deleteFocusReturn.current = null;
          if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
          event.preventDefault();
          target.focus({ preventScroll: true });
        }}
      />
    </div>
  );
};

export default AdminMediaLibrary;
