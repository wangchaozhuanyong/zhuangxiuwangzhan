import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminActionButton } from "@/components/admin/AdminPermission";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import AdminStickyActionBar from "@/components/admin/AdminStickyActionBar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import ImageField from "@/components/admin/ImageField";
import AdminMaterialImages from "@/pages/admin/AdminMaterialImages";
import { adminMaterialEditorText } from "@/i18n/adminMaterialEditorText";
import { invalidateAdminContentDetail, invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminMaterialDetail } from "@/lib/adminBusinessContentQueries";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { isNewAdminRouteRecord } from "@/lib/adminRouteParams";
import { autoEnglishDescription, englishMissingHint, hasAnyMissingEnglish } from "@/lib/adminTranslation";
import { formatUserFacingError } from "@/lib/userFacingText";
import {
  checkAdminMaterialSlugUnique,
  generateAdminMaterialEnglish,
  hasMaterialBackendConfig,
  normalizeMaterialSlug,
  saveAdminMaterial,
} from "@/backend/modules/materials/service/materialService";

type MaterialRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;

  title_zh: string;
  excerpt_zh: string;
  content_zh: string;

  category: string;
  subcategory: string;
  material_type: string;
  color: string;
  texture: string;
  reference_price: string;
  price_mode: "range" | "from" | "specification" | "size" | "scope" | "none";
  price_min: string | number;
  price_max: string | number;
  price_currency: string;
  price_unit: "sqft" | "foot_run" | "unit" | "set" | "panel" | "scope" | "none";
  price_scope_zh: string;
  price_scope_en: string;
  price_note_zh: string;
  price_note_en: string;

  suitable_spaces_zh: string[];
  pros_zh: string[];
  cons_zh: string[];
  recommended_pairing_zh: string; // TEXT
  note_zh: string; // TEXT

  image_url: string;
  alt_zh: string;

  seo_title_zh: string;
  seo_description_zh: string;

  title_en: string;
  excerpt_en: string;
  content_en: string;
  suitable_spaces_en: string[];
  pros_en: string[];
  cons_en: string[];
  recommended_pairing_en: string; // TEXT
  note_en: string; // TEXT
  alt_en: string;
  seo_title_en: string;
  seo_description_en: string;
};

const empty: MaterialRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  category: "",
  subcategory: "",
  material_type: "",
  color: "",
  texture: "",
  reference_price: "",
  price_mode: "none",
  price_min: "",
  price_max: "",
  price_currency: "MYR",
  price_unit: "none",
  price_scope_zh: "",
  price_scope_en: "",
  price_note_zh: "",
  price_note_en: "",
  suitable_spaces_zh: [],
  pros_zh: [],
  cons_zh: [],
  recommended_pairing_zh: "",
  note_zh: "",
  image_url: "",
  alt_zh: "",
  seo_title_zh: "",
  seo_description_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  suitable_spaces_en: [],
  pros_en: [],
  cons_en: [],
  recommended_pairing_en: "",
  note_en: "",
  alt_en: "",
  seo_title_en: "",
  seo_description_en: "",
};

const materialEnglishFields = [
  "title_en",
  "excerpt_en",
  "content_en",
  "suitable_spaces_en",
  "pros_en",
  "cons_en",
  "recommended_pairing_en",
  "note_en",
  "seo_title_en",
  "seo_description_en",
];

type AdminMaterialEditorTextKey = keyof typeof adminMaterialEditorText;

const parseLines = (value: string) => value.split("\n").map((s) => s.trim()).filter(Boolean);
const formatLines = (value?: string[] | null) => (value || []).join("\n");
const toPublishStatus = (value: string): MaterialRecord["status"] =>
  value === "published" || value === "archived" ? value : "draft";
const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
const toText = (value: unknown): string => (typeof value === "string" ? value : "");
const toPriceInput = (value: unknown): string | number => typeof value === "number" || typeof value === "string" ? value : "";
const toPriceMode = (value: unknown): MaterialRecord["price_mode"] =>
  value === "range" || value === "from" || value === "specification" || value === "size" || value === "scope" ? value : "none";
const toPriceUnit = (value: unknown): MaterialRecord["price_unit"] =>
  value === "sqft" || value === "foot_run" || value === "unit" || value === "set" || value === "panel" || value === "scope" ? value : "none";

export default function AdminMaterialEditor() {
  const language = getAdminLang();
  const A = useCallback((key: AdminMaterialEditorTextKey): string => adminMaterialEditorText[key][language], [language]);
  const formatA = useCallback(
    (key: AdminMaterialEditorTextKey, values: Record<string, string>): string =>
      Object.entries(values).reduce<string>((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key)),
    [A],
  );
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isNew = isNewAdminRouteRecord(id);
  const [showEnglish, setShowEnglish] = useState(true);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  const { data: loaded, isLoading, isError, error: loadError } = useAdminMaterialDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<MaterialRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    const loadedRecordData = loaded as Partial<MaterialRecord>;
    return {
      ...empty,
      ...loadedRecordData,
      suitable_spaces_zh: toStringArray(loadedRecordData.suitable_spaces_zh),
      suitable_spaces_en: toStringArray(loadedRecordData.suitable_spaces_en),
      pros_zh: toStringArray(loadedRecordData.pros_zh),
      pros_en: toStringArray(loadedRecordData.pros_en),
      cons_zh: toStringArray(loadedRecordData.cons_zh),
      cons_en: toStringArray(loadedRecordData.cons_en),
      recommended_pairing_zh: toText(loadedRecordData.recommended_pairing_zh),
      recommended_pairing_en: toText(loadedRecordData.recommended_pairing_en),
      note_zh: toText(loadedRecordData.note_zh),
      note_en: toText(loadedRecordData.note_en),
      price_mode: toPriceMode(loadedRecordData.price_mode),
      price_min: toPriceInput(loadedRecordData.price_min),
      price_max: toPriceInput(loadedRecordData.price_max),
      price_currency: toText(loadedRecordData.price_currency) || "MYR",
      price_unit: toPriceUnit(loadedRecordData.price_unit),
      price_scope_zh: toText(loadedRecordData.price_scope_zh),
      price_scope_en: toText(loadedRecordData.price_scope_en),
      price_note_zh: toText(loadedRecordData.price_note_zh),
      price_note_en: toText(loadedRecordData.price_note_en),
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote, dirty } = useAdminFormState<MaterialRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
  const englishMissing = hasAnyMissingEnglish(record as unknown as Record<string, unknown>, materialEnglishFields);
  useUnsavedChangesWarning(dirty && !saveBusy);

  useEffect(() => {
    if (!isError || !loadError) return;
    const message = formatUserFacingError(loadError, language);
    toast({ title: A("loadFailed"), description: message, variant: "destructive" });
  }, [A, isError, language, loadError]);

  const checkSlugUnique = useCallback(
    async (slug: string) => {
      if (!hasMaterialBackendConfig()) return true;
      const value = normalizeMaterialSlug(slug);
      if (!value) return false;
      setSlugChecking(true);
      setSlugError("");
      try {
        const isUnique = await checkAdminMaterialSlugUnique(value, record.id);
        if (!isUnique) {
          setSlugError(A("slugTaken"));
          return false;
        }
        return true;
      } catch (error) {
        setSlugError(formatUserFacingError(error, language));
        return false;
      } finally {
        setSlugChecking(false);
      }
    },
    [A, language, record.id],
  );

  const previewUrl = useMemo(() => {
    const lang = "zh";
    const slug = record.slug ? normalizeMaterialSlug(record.slug) : "";
    if (!slug) return "";
    return `/${lang}/materials/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: MaterialRecord["status"], generateEnglish?: boolean, forceEnglish?: boolean) => {
    if (!hasMaterialBackendConfig()) return;
    const slug = normalizeMaterialSlug(record.slug || record.title_zh);
    if (!slug) {
      toast({ title: A("slugRequired"), variant: "destructive" });
      return;
    }
    const ok = await checkSlugUnique(slug);
    if (!ok) {
      toast({ title: A("slugUnavailable"), description: slugError || A("slugFixThenSave"), variant: "destructive" });
      return;
    }

    setSaveBusy(true);
    let savedResult: Awaited<ReturnType<typeof saveAdminMaterial>>;
    try {
      savedResult = await saveAdminMaterial({
        record,
        nextStatus,
        queryClient,
      });
    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
      setSaveBusy(false);
      return;
    }

    const { saved, savedId } = savedResult;
    applyRemote({ ...record, ...saved, id: savedId, slug: savedResult.slug, status: savedResult.status });
    toast({ title: A("saved") });
    await invalidateAfterAdminContentSave(queryClient);
    setSaveBusy(false);

    if (isNew) navigate(`/admin/materials/${savedId}`, { replace: true });

    if (generateEnglish) {
      try {
        await generateAdminMaterialEnglish(savedId, Boolean(forceEnglish));
        toast({ title: A("savedGenerateSuccess") });
        void invalidateAdminContentDetail(queryClient, "materials", savedId);
      } catch (translationError) {
        const description = formatUserFacingError(translationError, language);
        toast({ title: A("savedGenerateFailed"), description, variant: "destructive" });
      }
    }
  };

  const forceRegenerateEnglish = async () => {
    const confirmed = await adminConfirm({
      title: A("confirmForceTitle"),
      description: A("confirmForceDescription"),
      confirmLabel: A("confirmForceLabel"),
    });
    if (confirmed) {
      await save(undefined, true, true);
    }
  };

  if (!hasMaterialBackendConfig()) {
    return <AdminEmptyState title={A("supabaseMissingTitle")} description={A("supabaseMissingDescription")} />;
  }

  return (
    <>
    <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/materials">{A("backToList")}</Link>
            </Button>
            {record.status && <span className="text-xs text-muted-foreground">{formatA("statusPrefix", { status: adminStatusLabel("default", record.status) })}</span>}
            {slugChecking && <span className="text-xs text-muted-foreground">{A("slugChecking")}</span>}
            {slugError && <span className="text-xs text-destructive">{slugError}</span>}
          </>
        }
        right={
          <>
            {previewUrl && (
              <Button asChild variant="outline">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  {A("preview")}
                </a>
              </Button>
            )}
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={() => void save("draft")} disabled={saveBusy || isLoading}>
              {A("saveDraft")}
            </AdminActionButton>
            <AdminActionButton action="content.publish" type="button" onClick={() => void save("published")} disabled={saveBusy || isLoading}>
              {A("publish")}
            </AdminActionButton>
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={() => void save(undefined, true)} disabled={saveBusy || isLoading || !record.id}>
              {A("saveAndGenerateEnglish")}
            </AdminActionButton>
            <AdminActionButton
              action="content.write"
              type="button"
              variant="outline"
              onClick={() => void forceRegenerateEnglish()}
              disabled={saveBusy || isLoading || !record.id}
            >
              {A("forceRegenerateEnglish")}
            </AdminActionButton>
          </>
        }
      />

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void save();
        }}
        className="space-y-6"
      >
        <AdminPageHeader
          title={isNew ? A("newTitle") : A("editTitle")}
          description={A("pageDescription")}
          helpText={A("pageHelpText")}
          actions={
            <Button type="button" variant="outline" onClick={() => setShowEnglish((v) => !v)}>
              {showEnglish ? A("hideEnglish") : A("showEnglish")}
            </Button>
          }
        />

        {englishMissing && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {englishMissingHint}
          </div>
        )}

        <AdminFormSection title={A("publishSectionTitle")} description={A("publishSectionDescription")} helpText={A("publishSectionHelp")}>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{A("status")}</label>
              <select
                value={record.status}
                onChange={(e) => setRecord((r) => ({ ...r, status: toPublishStatus(e.target.value) }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {publishStatusOptions().map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("sortOrder")}</label>
              <Input type="number" value={record.sort_order} onChange={(e) => setRecord((r) => ({ ...r, sort_order: Number(e.target.value || 0) }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("basicZhTitle")} description={A("basicZhDescription")} helpText={A("basicZhHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("materialName")}</label>
              <Input value={record.title_zh} onChange={(e) => setRecord((r) => ({ ...r, title_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="mb-1 block text-sm font-medium">{A("slug")}</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const next = normalizeMaterialSlug(record.slug || record.title_zh);
                      setRecord((r) => ({ ...r, slug: next }));
                      void checkSlugUnique(next);
                    }}
                  >{A("autoGenerate")}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void checkSlugUnique(record.slug)}>{A("checkDuplicate")}</Button>
                </div>
              </div>
              <Input
                value={record.slug}
                onChange={(e) => {
                  const next = e.target.value;
                  setRecord((r) => ({ ...r, slug: next }));
                  setSlugError("");
                }}
                onBlur={() => void checkSlugUnique(record.slug)}
                placeholder={A("slugPlaceholder")}
              />
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">{formatA("frontendPath", { path: previewUrl })}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("excerptZh")}</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("contentZh")}</label>
              <Textarea rows={10} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("classificationTitle")} description={A("classificationDescription")} helpText={A("classificationHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{A("category")}</label>
              <Input value={record.category} onChange={(e) => setRecord((r) => ({ ...r, category: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("subcategory")}</label>
              <Input value={record.subcategory} onChange={(e) => setRecord((r) => ({ ...r, subcategory: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("materialType")}</label>
              <Input value={record.material_type} onChange={(e) => setRecord((r) => ({ ...r, material_type: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("color")}</label>
              <Input value={record.color} onChange={(e) => setRecord((r) => ({ ...r, color: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("texture")}</label>
              <Input value={record.texture} onChange={(e) => setRecord((r) => ({ ...r, texture: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("priceTitle")} description={A("priceDescription")} helpText={A("priceHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{A("priceMode")}</label>
              <select
                value={record.price_mode}
                onChange={(e) => setRecord((r) => ({ ...r, price_mode: toPriceMode(e.target.value) }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="range">{A("priceModeRange")}</option>
                <option value="from">{A("priceModeFrom")}</option>
                <option value="specification">{A("priceModeSpecification")}</option>
                <option value="size">{A("priceModeSize")}</option>
                <option value="scope">{A("priceModeScope")}</option>
                <option value="none">{A("priceModeNone")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("priceUnit")}</label>
              <select
                value={record.price_unit}
                onChange={(e) => setRecord((r) => ({ ...r, price_unit: toPriceUnit(e.target.value) }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="sqft">{A("priceUnitSqft")}</option>
                <option value="foot_run">{A("priceUnitFootRun")}</option>
                <option value="unit">{A("priceUnitUnit")}</option>
                <option value="set">{A("priceUnitSet")}</option>
                <option value="panel">{A("priceUnitPanel")}</option>
                <option value="scope">{A("priceUnitScope")}</option>
                <option value="none">{A("priceUnitNone")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("priceMin")}</label>
              <Input type="number" min="0" step="0.01" value={record.price_min} onChange={(e) => setRecord((r) => ({ ...r, price_min: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("priceMax")}</label>
              <Input type="number" min="0" step="0.01" value={record.price_max} onChange={(e) => setRecord((r) => ({ ...r, price_max: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("priceCurrency")}</label>
              <Input value={record.price_currency} maxLength={3} onChange={(e) => setRecord((r) => ({ ...r, price_currency: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("legacyReferencePrice")}</label>
              <Input value={record.reference_price} onChange={(e) => setRecord((r) => ({ ...r, reference_price: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("priceScopeZh")}</label>
              <Textarea rows={2} value={record.price_scope_zh} onChange={(e) => setRecord((r) => ({ ...r, price_scope_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("priceNoteZh")}</label>
              <Textarea rows={2} value={record.price_note_zh} onChange={(e) => setRecord((r) => ({ ...r, price_note_zh: e.target.value }))} />
            </div>
            {showEnglish ? (
              <>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("priceScopeEn")}</label>
                  <Textarea rows={2} value={record.price_scope_en} onChange={(e) => setRecord((r) => ({ ...r, price_scope_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("priceNoteEn")}</label>
                  <Textarea rows={2} value={record.price_note_en} onChange={(e) => setRecord((r) => ({ ...r, price_note_en: e.target.value }))} />
                </div>
              </>
            ) : null}
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("imageTitle")} description={A("imageDescription")} helpText={A("imageHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label={A("imageLabel")}
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`materials/${record.id || "draft"}`}
                usageType="material"
                altValue={record.alt_zh}
                onAltChange={(alt) => setRecord((r) => ({ ...r, alt_zh: alt }))}
              />
            </div>
            {showEnglish && (
              <div>
                <label className="mb-1 block text-sm font-medium">{A("englishImageAlt")}</label>
                <Input value={record.alt_en} onChange={(e) => setRecord((r) => ({ ...r, alt_en: e.target.value }))} />
              </div>
            )}
          </div>
        </AdminFormSection>

        <AdminMaterialImages materialId={record.id} />

        <AdminFormSection title={A("usageZhTitle")} description={A("usageZhDescription")} helpText={A("usageZhHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{A("suitableSpacesZh")}</label>
              <Textarea rows={6} value={formatLines(record.suitable_spaces_zh)} onChange={(e) => setRecord((r) => ({ ...r, suitable_spaces_zh: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("prosZh")}</label>
              <Textarea rows={6} value={formatLines(record.pros_zh)} onChange={(e) => setRecord((r) => ({ ...r, pros_zh: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("consZh")}</label>
              <Textarea rows={6} value={formatLines(record.cons_zh)} onChange={(e) => setRecord((r) => ({ ...r, cons_zh: parseLines(e.target.value) }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("recommendedPairing")}</label>
              <Textarea rows={4} value={record.recommended_pairing_zh} onChange={(e) => setRecord((r) => ({ ...r, recommended_pairing_zh: e.target.value }))} />
              <p className="mt-1 text-xs text-muted-foreground">{A("paragraphFieldHint")}</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("note")}</label>
              <Textarea rows={3} value={record.note_zh} onChange={(e) => setRecord((r) => ({ ...r, note_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("seoZhTitle")} description={A("seoZhDescription")} helpText={A("seoZhHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("seoTitleZh")}</label>
              <Input value={record.seo_title_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_title_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("seoDescriptionZh")}</label>
              <Textarea rows={3} value={record.seo_description_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_description_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        {showEnglish && (
          <>
            <AdminFormSection title={A("autoEnglishTitle")} description={autoEnglishDescription} helpText={A("autoEnglishHelp")} collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("englishTitle")}</label>
                  <Input value={record.title_en} onChange={(e) => setRecord((r) => ({ ...r, title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("englishExcerpt")}</label>
                  <Textarea rows={3} value={record.excerpt_en} onChange={(e) => setRecord((r) => ({ ...r, excerpt_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("englishDetails")}</label>
                  <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

        <AdminFormSection title={A("autoEnglishUsageTitle")} description={autoEnglishDescription} helpText={A("autoEnglishUsageHelp")} collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{A("suitableSpacesEn")}</label>
                  <Textarea rows={6} value={formatLines(record.suitable_spaces_en)} onChange={(e) => setRecord((r) => ({ ...r, suitable_spaces_en: parseLines(e.target.value) }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{A("prosEn")}</label>
                  <Textarea rows={6} value={formatLines(record.pros_en)} onChange={(e) => setRecord((r) => ({ ...r, pros_en: parseLines(e.target.value) }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{A("consEn")}</label>
                  <Textarea rows={6} value={formatLines(record.cons_en)} onChange={(e) => setRecord((r) => ({ ...r, cons_en: parseLines(e.target.value) }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("recommendedPairingEn")}</label>
                  <Textarea rows={4} value={record.recommended_pairing_en} onChange={(e) => setRecord((r) => ({ ...r, recommended_pairing_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("noteEn")}</label>
                  <Textarea rows={3} value={record.note_en} onChange={(e) => setRecord((r) => ({ ...r, note_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title={A("englishSeoTitle")} description={autoEnglishDescription} helpText={A("englishSeoHelp")} collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("seoTitleEn")}</label>
                  <Input value={record.seo_title_en} onChange={(e) => setRecord((r) => ({ ...r, seo_title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("seoDescriptionEn")}</label>
                  <Textarea rows={3} value={record.seo_description_en} onChange={(e) => setRecord((r) => ({ ...r, seo_description_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>
          </>
        )}

        <div className="pb-10" />
      </form>
    </>
  );
}
