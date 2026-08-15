import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminFormSection from "@/components/admin/AdminFormSection";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import SmartImage from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminMaterialEditorText } from "@/i18n/adminMaterialEditorText";
import { invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminMaterialImages } from "@/lib/adminBusinessContentQueries";
import { getAdminLang } from "@/lib/adminLocale";
import { formatAdminMutationError } from "@/lib/adminMutation";
import AdminImageUpload from "@/pages/admin/AdminImageUpload";
import {
  addAdminMaterialImage,
  archiveAdminMaterialImage,
  updateAdminMaterialImage,
  type AdminMaterialImageDraft,
  type MaterialImageRights,
  type MaterialImageType,
} from "@/backend/modules/materials/service/materialService";

type AdminMaterialImagesProps = {
  materialId?: string;
};

type MaterialImageRow = Required<Pick<AdminMaterialImageDraft, "image_url">> & AdminMaterialImageDraft & {
  id: string;
};

const emptyImage: AdminMaterialImageDraft = {
  image_url: "",
  image_type: "scene",
  alt_zh: "",
  alt_en: "",
  source_url: "",
  rights_status: "owned",
  sort_order: 0,
};

const imageTypes: MaterialImageType[] = ["cover", "scene", "detail", "installation", "specification"];
const rightsOptions: MaterialImageRights[] = ["owned", "generated", "licensed", "supplier_approved"];

const AdminMaterialImages = ({ materialId }: AdminMaterialImagesProps) => {
  const lang = getAdminLang();
  const t = (key: keyof typeof adminMaterialEditorText) => adminMaterialEditorText[key][lang];
  const queryClient = useQueryClient();
  const { data: rawImages = [], refetch } = useAdminMaterialImages(materialId);
  const images = rawImages as MaterialImageRow[];
  const [draft, setDraft] = useState<AdminMaterialImageDraft>(emptyImage);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "material_images", materialId] });
    await invalidateAfterAdminContentSave(queryClient);
    await refetch();
  };

  const addImage = async () => {
    if (!materialId || !draft.image_url || busy) {
      if (!materialId) setStatus(t("gallerySaveFirst"));
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await addAdminMaterialImage(materialId, draft);
      setDraft(emptyImage);
      setStatus(t("galleryAdded"));
      await refresh();
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setBusy(false);
    }
  };

  const saveImage = async (imageId: string, patch: Record<string, unknown>) => {
    setBusy(true);
    setStatus("");
    try {
      await updateAdminMaterialImage(imageId, patch);
      setStatus(t("gallerySaved"));
      await refresh();
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setBusy(false);
    }
  };

  const archiveImage = async (imageId: string) => {
    const confirmed = await adminConfirm({
      title: t("galleryDeleteTitle"),
      description: t("galleryDeleteDescription"),
      confirmLabel: t("galleryDelete"),
    });
    if (!confirmed) return;
    setBusy(true);
    setStatus("");
    try {
      await archiveAdminMaterialImage(imageId);
      await refresh();
    } catch (error) {
      setStatus(formatAdminMutationError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminFormSection title={t("galleryTitle")} description={t("galleryDescription")} helpText={t("galleryHelp")}>
      {!materialId ? <p className="text-sm text-muted-foreground">{t("gallerySaveFirst")}</p> : (
        <>
          {status ? <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm">{status}</div> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <AdminImageUpload
              folder={`materials/${materialId}/gallery`}
              value={draft.image_url}
              recordAsset
              assetUsageType="material"
              onUploaded={(url) => setDraft((current) => ({ ...current, image_url: url }))}
            />
            <div className="space-y-3">
              <Input placeholder={t("galleryImageUrl")} value={draft.image_url} onChange={(event) => setDraft((current) => ({ ...current, image_url: event.target.value }))} />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={draft.image_type || "scene"} onChange={(event) => setDraft((current) => ({ ...current, image_type: event.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {imageTypes.map((value) => <option key={value} value={value}>{t(`galleryType_${value}` as keyof typeof adminMaterialEditorText)}</option>)}
                </select>
                <select value={draft.rights_status || "owned"} onChange={(event) => setDraft((current) => ({ ...current, rights_status: event.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {rightsOptions.map((value) => <option key={value} value={value}>{t(`galleryRights_${value}` as keyof typeof adminMaterialEditorText)}</option>)}
                </select>
              </div>
              <Input placeholder={t("galleryAltZh")} value={draft.alt_zh || ""} onChange={(event) => setDraft((current) => ({ ...current, alt_zh: event.target.value }))} />
              <Input placeholder={t("galleryAltEn")} value={draft.alt_en || ""} onChange={(event) => setDraft((current) => ({ ...current, alt_en: event.target.value }))} />
              <Input placeholder={t("gallerySourceUrl")} value={draft.source_url || ""} onChange={(event) => setDraft((current) => ({ ...current, source_url: event.target.value }))} />
              <Input type="number" placeholder={t("gallerySortOrder")} value={draft.sort_order ?? 0} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} />
              <Button type="button" onClick={() => void addImage()} disabled={busy || !draft.image_url} aria-busy={busy}>{t("galleryAdd")}</Button>
            </div>
          </div>

          <div className="mt-6 divide-y divide-border border-y border-border">
            {images.length ? images.map((image) => (
              <MaterialImageEditor
                key={image.id}
                image={image}
                busy={busy}
                t={t}
                onSave={saveImage}
                onArchive={archiveImage}
              />
            )) : <p className="py-6 text-center text-sm text-muted-foreground">{t("galleryEmpty")}</p>}
          </div>
        </>
      )}
    </AdminFormSection>
  );
};

type MaterialImageEditorProps = {
  image: MaterialImageRow;
  busy: boolean;
  t: (key: keyof typeof adminMaterialEditorText) => string;
  onSave: (imageId: string, patch: Record<string, unknown>) => Promise<void>;
  onArchive: (imageId: string) => Promise<void>;
};

const MaterialImageEditor = ({ image, busy, t, onSave, onArchive }: MaterialImageEditorProps) => {
  const [draft, setDraft] = useState(image);
  useEffect(() => setDraft(image), [image]);

  return (
    <div className="grid gap-4 py-4 lg:grid-cols-[8rem_minmax(0,1fr)_auto] lg:items-start">
      <SmartImage src={image.image_url} alt={image.alt_zh || image.alt_en || ""} width={256} height={256} className="aspect-square w-32 object-cover" />
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={draft.image_type || "scene"} onChange={(event) => setDraft((current) => ({ ...current, image_type: event.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          {imageTypes.map((value) => <option key={value} value={value}>{t(`galleryType_${value}` as keyof typeof adminMaterialEditorText)}</option>)}
        </select>
        <select value={draft.rights_status || "owned"} onChange={(event) => setDraft((current) => ({ ...current, rights_status: event.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          {rightsOptions.map((value) => <option key={value} value={value}>{t(`galleryRights_${value}` as keyof typeof adminMaterialEditorText)}</option>)}
        </select>
        <Input placeholder={t("galleryAltZh")} value={draft.alt_zh || ""} onChange={(event) => setDraft((current) => ({ ...current, alt_zh: event.target.value }))} />
        <Input placeholder={t("galleryAltEn")} value={draft.alt_en || ""} onChange={(event) => setDraft((current) => ({ ...current, alt_en: event.target.value }))} />
        <Input className="sm:col-span-2" placeholder={t("gallerySourceUrl")} value={draft.source_url || ""} onChange={(event) => setDraft((current) => ({ ...current, source_url: event.target.value }))} />
        <Input type="number" placeholder={t("gallerySortOrder")} value={draft.sort_order ?? 0} onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))} />
      </div>
      <div className="flex gap-2 lg:flex-col">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onSave(image.id, {
          image_url: draft.image_url,
          image_type: draft.image_type || "scene",
          alt_zh: draft.alt_zh || "",
          alt_en: draft.alt_en || "",
          source_url: draft.source_url || null,
          rights_status: draft.rights_status || "owned",
          sort_order: Number(draft.sort_order || 0),
        })}>
          <Save className="h-4 w-4" /> {t("gallerySave")}
        </Button>
        <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void onArchive(image.id)}>
          <Trash2 className="h-4 w-4" /> {t("galleryDelete")}
        </Button>
      </div>
    </div>
  );
};

export default AdminMaterialImages;
