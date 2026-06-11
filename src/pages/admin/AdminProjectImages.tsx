import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminProjectImages } from "@/lib/adminBusinessContentQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminImageUpload from "./AdminImageUpload";
import SmartImage from "@/components/SmartImage";
import type { Language } from "@/i18n/routes";
import { adminProjectImagesText, adminProjectImageTypeLabels } from "@/i18n/adminProjectImagesText";
import { getAdminLang } from "@/lib/adminLocale";
import { formatAdminMutationError } from "@/lib/adminMutation";
import {
  addAdminProjectImage,
  deleteAdminProjectImage,
  setAdminProjectImageAsCover,
  updateAdminProjectImage,
} from "@/backend/modules/projects/service/projectService";

interface AdminProjectImagesProps {
  projectId?: string;
}

const emptyImage = {
  image_url: "",
  image_type: "gallery",
  alt_zh: "",
  alt_en: "",
  sort_order: 0 as string | number,
};

type AdminProjectImageDraft = typeof emptyImage;
type AdminProjectImageRow = AdminProjectImageDraft & {
  id: string;
};

const copy = adminProjectImagesText;

const formatImageType = (value: string, language: Language) =>
  adminProjectImageTypeLabels[value as keyof typeof adminProjectImageTypeLabels]?.[language] || value;

const AdminProjectImages = ({ projectId }: AdminProjectImagesProps) => {
  const queryClient = useQueryClient();
  const lang = getAdminLang();
  const t = copy[lang];
  const { data: images = [], refetch } = useAdminProjectImages(projectId);
  const [draft, setDraft] = useState<AdminProjectImageDraft>(emptyImage);
  const [status, setStatus] = useState("");
  const [adding, setAdding] = useState(false);
  const [coverBusyId, setCoverBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshProjectCaches = useCallback(() => {
    void invalidateAfterAdminContentSave(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["admin", "project_images", projectId] });
  }, [queryClient, projectId]);

  const addImage = async () => {
    if (adding) return;
    if (!projectId || !draft.image_url) {
      setStatus(t.saveProjectFirst);
      return;
    }

    setAdding(true);
    setStatus("");
    try {
      await addAdminProjectImage(projectId, draft);
      setDraft(emptyImage);
      setStatus(t.added);
      refreshProjectCaches();
      await refetch();
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setAdding(false);
    }
  };

  const updateImage = async (image: AdminProjectImageRow, patch: Record<string, unknown>) => {
    try {
      await updateAdminProjectImage(image.id, patch);
      refreshProjectCaches();
      await refetch();
      return true;
    } catch (error) {
      setStatus(formatAdminMutationError(error));
      return false;
    }
  };

  const setAsCover = async (image: AdminProjectImageRow) => {
    if (!projectId || coverBusyId) return;
    setCoverBusyId(image.id);
    setStatus("");
    try {
      await setAdminProjectImageAsCover(projectId, image.id);
      refreshProjectCaches();
      await refetch();
      setStatus(t.coverSet);
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setCoverBusyId(null);
    }
  };

  const deleteImage = async (id: string) => {
    if (deletingId) return;
    const confirmed = await adminConfirm({
      title: t.confirmDeleteTitle,
      description: t.confirmDelete,
      confirmLabel: t.confirmDeleteLabel,
    });
    if (!confirmed) return;
    setDeletingId(id);
    setStatus("");
    try {
      await deleteAdminProjectImage(id);
      refreshProjectCaches();
      await refetch();
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setDeletingId(null);
    }
  };

  if (!projectId) {
    return (
      <div className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
        {t.saveFirst}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold">{t.title}</h3>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>
      <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">{t.coverRuleTitle}</p>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>{t.coverRulePrimary}</li>
          <li>{t.coverRuleFallback}</li>
        </ul>
      </div>
      {status && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{status}</div>}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <AdminImageUpload folder={`projects/${projectId}`} value={draft.image_url} recordAsset assetUsageType="project" onUploaded={(url) => setDraft({ ...draft, image_url: url })} />
        <div className="space-y-3">
          <Input placeholder={t.imageUrl} value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} />
          <Select value={draft.image_type} onValueChange={(value) => setDraft({ ...draft, image_type: value })}>
            <SelectTrigger><SelectValue placeholder={t.imageType} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">{t.cover}</SelectItem>
              <SelectItem value="gallery">{t.gallery}</SelectItem>
              <SelectItem value="before">{t.before}</SelectItem>
              <SelectItem value="after">{t.after}</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder={t.altZh} value={draft.alt_zh} onChange={(event) => setDraft({ ...draft, alt_zh: event.target.value })} />
          <Input placeholder={t.altEn} value={draft.alt_en} onChange={(event) => setDraft({ ...draft, alt_en: event.target.value })} />
          <Input type="number" placeholder={t.sortOrder} value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: event.target.value })} />
          <Button type="button" className="w-full sm:w-auto" onClick={addImage} disabled={adding} aria-busy={adding}>
            {adding ? t.addBusy : t.addImage}
          </Button>
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {images.length === 0 ? (
          <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">{t.empty}</div>
        ) : images.map((image) => (
          <article key={image.id} className="rounded-lg border border-border p-3">
            <div className="flex min-w-0 gap-3">
              <SmartImage src={image.image_url} alt={image.alt_en || image.alt_zh || t.defaultAlt} width={144} height={96} className="h-20 w-28 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{formatImageType(image.image_type, lang as Language)}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{image.alt_zh || image.alt_en || "-"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.sort}</span>
                  <Input className="h-9 w-20" type="number" value={image.sort_order || 0} onChange={(event) => void updateImage(image, { sort_order: Number(event.target.value || 0) })} />
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void setAsCover(image)}
                disabled={image.image_type === "cover" || coverBusyId === image.id}
                aria-busy={coverBusyId === image.id}
              >
                {coverBusyId === image.id ? t.coverBusy : t.setCover}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void deleteImage(image.id)}
                disabled={deletingId === image.id}
                aria-busy={deletingId === image.id}
              >
                {deletingId === image.id ? t.deleteBusy : t.delete}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.preview}</TableHead>
              <TableHead>{t.type}</TableHead>
              <TableHead>{t.alt}</TableHead>
              <TableHead>{t.sort}</TableHead>
              <TableHead>{t.action}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {images.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  {t.empty}
                </TableCell>
              </TableRow>
            ) : images.map((image) => (
              <TableRow key={image.id}>
                <TableCell><SmartImage src={image.image_url} alt={image.alt_en || image.alt_zh || t.defaultAlt} width={96} height={64} className="h-16 w-24 rounded object-cover" /></TableCell>
                <TableCell>{formatImageType(image.image_type, lang as Language)}</TableCell>
                <TableCell className="max-w-xs text-xs text-muted-foreground">{image.alt_zh}<br />{image.alt_en}</TableCell>
                <TableCell>
                  <Input className="w-20" type="number" value={image.sort_order || 0} onChange={(event) => void updateImage(image, { sort_order: Number(event.target.value || 0) })} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void setAsCover(image)}
                      disabled={image.image_type === "cover" || coverBusyId === image.id}
                      aria-busy={coverBusyId === image.id}
                    >
                      {coverBusyId === image.id ? t.coverBusy : t.setCover}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void deleteImage(image.id)}
                    disabled={deletingId === image.id}
                    aria-busy={deletingId === image.id}
                  >
                    {deletingId === image.id ? t.deleteBusy : t.delete}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProjectImages;
