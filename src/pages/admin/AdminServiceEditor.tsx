import { navigateAfterSave } from "@/lib/navigationProtection";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
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
import { adminMobileEditorText } from "@/i18n/adminMobileEditorText";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminContentPreflight from "@/components/admin/AdminContentPreflight";
import AdminServiceNativeSnapshot from "@/components/admin/AdminServiceNativeSnapshot";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import ImageField from "@/components/admin/ImageField";
import { FaqListEditor, ProcessStepsEditor, TextListEditor } from "@/components/admin/StructuredArrayEditors";
import { adminServiceEditorText } from "@/i18n/adminServiceEditorText";
import { invalidateAdminContentDetail, invalidateAdminResource } from "@/lib/adminInvalidate";
import { useAdminServiceDetail } from "@/lib/adminBusinessContentQueries";
import { adminStatusLabel, publishStatusOptions, useAdminLang } from "@/lib/adminLocale";
import { getAdminFieldHelp } from "@/lib/adminHelpText";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { isNewAdminRouteRecord } from "@/lib/adminRouteParams";
import { autoEnglishDescription, englishMissingHint, hasAnyMissingEnglish } from "@/lib/adminTranslation";
import { interactionText } from "@/i18n/interactionText";
import { formatUserFacingError } from "@/lib/userFacingText";
import {
  checkAdminServiceSlugUnique,
  generateAdminServiceEnglish,
  hasServiceBackendConfig,
  normalizeServiceSlug,
  previewAdminService,
  publishAdminService,
  saveAdminService,
} from "@/backend/modules/services/service/serviceService";

type ProcessStepRecord = {
  title?: string;
  desc?: string;
  [key: string]: unknown;
};

type FaqRecord = {
  q?: string;
  a?: string;
  [key: string]: unknown;
};

type ServiceRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  version?: number | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
  title_zh: string;
  excerpt_zh: string;
  content_zh: string;
  image_url: string;
  alt_zh: string;
  suitable_for_zh: string[];
  common_projects_zh: string[];
  scope_items_zh: string[];
  process_steps_zh: ProcessStepRecord[];
  faqs_zh: FaqRecord[];
  seo_title_zh: string;
  seo_description_zh: string;
  title_en: string;
  excerpt_en: string;
  content_en: string;
  alt_en: string;
  suitable_for_en: string[];
  common_projects_en: string[];
  scope_items_en: string[];
  process_steps_en: ProcessStepRecord[];
  faqs_en: FaqRecord[];
  seo_title_en: string;
  seo_description_en: string;
};

const empty: ServiceRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  image_url: "",
  alt_zh: "",
  suitable_for_zh: [],
  common_projects_zh: [],
  scope_items_zh: [],
  process_steps_zh: [],
  faqs_zh: [],
  seo_title_zh: "",
  seo_description_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  alt_en: "",
  suitable_for_en: [],
  common_projects_en: [],
  scope_items_en: [],
  process_steps_en: [],
  faqs_en: [],
  seo_title_en: "",
  seo_description_en: "",
};

const serviceEnglishFields = [
  "title_en",
  "excerpt_en",
  "content_en",
  "suitable_for_en",
  "common_projects_en",
  "scope_items_en",
  "process_steps_en",
  "faqs_en",
  "seo_title_en",
  "seo_description_en",
];

type AdminServiceEditorTextKey = keyof typeof adminServiceEditorText;
const toPublishStatus = (value: string): ServiceRecord["status"] =>
  value === "published" || value === "archived" ? value : "draft";
const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
const toRecordArray = <T extends Record<string, unknown>>(value: unknown): T[] =>
  Array.isArray(value)
    ? value.filter((item): item is T => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];

export default function AdminServiceEditor() {
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  const language = useAdminLang();
  const mobileText = adminMobileEditorText[language];
  const A = useCallback((key: AdminServiceEditorTextKey): string => adminServiceEditorText[key][language], [language]);
  const formatA = useCallback(
    (key: AdminServiceEditorTextKey, values: Record<string, string>): string =>
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

  const { data: loaded, isLoading, isInitialError: isError, error: loadError, refetch: refetchLoaded } = useAdminServiceDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<ServiceRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    const loadedRecordData = loaded as Partial<ServiceRecord>;
    return {
      ...empty,
      ...loadedRecordData,
      suitable_for_zh: toStringArray(loadedRecordData.suitable_for_zh),
      suitable_for_en: toStringArray(loadedRecordData.suitable_for_en),
      common_projects_zh: toStringArray(loadedRecordData.common_projects_zh),
      common_projects_en: toStringArray(loadedRecordData.common_projects_en),
      scope_items_zh: toStringArray(loadedRecordData.scope_items_zh),
      scope_items_en: toStringArray(loadedRecordData.scope_items_en),
      process_steps_zh: toRecordArray<ProcessStepRecord>(loadedRecordData.process_steps_zh),
      process_steps_en: toRecordArray<ProcessStepRecord>(loadedRecordData.process_steps_en),
      faqs_zh: toRecordArray<FaqRecord>(loadedRecordData.faqs_zh),
      faqs_en: toRecordArray<FaqRecord>(loadedRecordData.faqs_en),
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote, dirty, isDirty } = useAdminFormState<ServiceRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
  const recordReady = isNew || Boolean(loaded?.id && record.id === loaded.id);
  const englishMissing = hasAnyMissingEnglish(record as unknown as Record<string, unknown>, serviceEnglishFields);
  useUnsavedChangesWarning((dirty || saveBusy) || isSubmitting);

  useEffect(() => {
    if (!isError || !loadError) return;
    const message = formatUserFacingError(loadError, language);
    toast({ title: A("loadFailed"), description: message, variant: "destructive" });
  }, [A, isError, language, loadError]);

  const checkSlugUnique = useCallback(
    async (slug: string) => {
      if (!hasServiceBackendConfig()) return true;
      const value = normalizeServiceSlug(slug);
      if (!value) return false;
      setSlugChecking(true);
      setSlugError("");
      try {
        const isUnique = await checkAdminServiceSlugUnique(value, record.id);
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
    const slug = loadedRecord?.status === "published" ? normalizeServiceSlug(loadedRecord.slug) : "";
    if (!slug) return "";
    return `/${language}/services/${slug}`;
  }, [language, loadedRecord]);

  const save = protectSubmission("record-write", async (nextStatus?: ServiceRecord["status"], generateEnglish?: boolean, forceEnglish?: boolean) => {
    if (!recordReady) return;
    if (!hasServiceBackendConfig()) return;
    const slug = normalizeServiceSlug(record.slug || record.title_zh);
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
    let savedResult: Awaited<ReturnType<typeof saveAdminService>>;
    try {
      savedResult = await saveAdminService({
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
    applyRemote({ ...record, ...saved, id: savedId, slug: savedResult.slug, status: savedResult.status }, record);
    toast({ title: A("saved") });
    setSaveBusy(false);

    if (isNew) navigateAfterSave(isDirty, () => navigate(`/admin/services/${savedId}`, { replace: true }));

    if (generateEnglish) {
      try {
        await generateAdminServiceEnglish(savedId, Boolean(forceEnglish));
        toast({ title: A("savedGenerateSuccess") });
        void invalidateAdminContentDetail(queryClient, "services", savedId);
      } catch (translationError) {
        const description = formatUserFacingError(translationError, language);
        toast({ title: A("savedGenerateFailed"), description, variant: "destructive" });
      }
    }
  });

  const publish = protectSubmission("record-write", async () => {
    if (!recordReady) return;
    const confirmed = await adminConfirm({
      title: A("confirmPublishTitle"),
      description: A("confirmPublishDescription"),
      confirmLabel: A("confirmPublishLabel"),
      confirmVariant: "default",
    });
    if (!confirmed) return;

    const slug = normalizeServiceSlug(record.slug || record.title_zh);
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
    try {
      const savedResult = await publishAdminService({
        record: { ...record, status: "published" },
        nextStatus: "published",
        queryClient,
        approvalId: `admin-ui-${new Date().toISOString()}`,
        source: "admin-service-editor",
      });
      const { saved, savedId, warnings } = savedResult;
      applyRemote({ ...record, ...saved, id: savedId, slug: savedResult.slug, status: savedResult.status }, record);
      await invalidateAdminResource(queryClient, "services");

      if (warnings?.length) {
        toast({ title: A("publishSucceeded"), description: formatA("publishWarningPrefix", { notes: warnings.join(" | ") }) });
      } else {
        toast({ title: A("publishSucceeded") });
      }

      if (isNew) navigateAfterSave(isDirty, () => navigate(`/admin/services/${savedId}`, { replace: true }));
    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
    } finally {
      setSaveBusy(false);
    }
  });

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

  if (!hasServiceBackendConfig()) {
    return <AdminEmptyState title={A("supabaseMissingTitle")} description={A("supabaseMissingDescription")} />;
  }

  if (!recordReady) {
    if (!isError) return <AdminLoadingState />;
    return <AdminEmptyState
      title={A("loadFailed")}
      description={formatUserFacingError(loadError, language)}
      action={<Button type="button" onClick={() => void refetchLoaded()}>{interactionText[language].retry}</Button>}
    />;
  }

  return (
    <>
      <AdminStickyActionBar
        mobileSticky
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/services">{A("backToList")}</Link>
            </Button>
            {record.status && <span className="text-xs text-muted-foreground">{formatA("statusPrefix", { status: adminStatusLabel("default", record.status) })}</span>}
            {slugChecking && <span className="text-xs text-muted-foreground">{A("slugChecking")}</span>}
            {slugError && <span className="text-xs admin-text-error">{slugError}</span>}
          </>
        }
        right={
          <>
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={() => void save("draft")} disabled={saveBusy || !recordReady || isLoading}>
              {record.status === "draft" ? A("saveDraft") : mobileText.moveToDraft}
            </AdminActionButton>
            <AdminActionButton action="content.publish" type="button" onClick={() => void publish()} disabled={saveBusy || !recordReady || isLoading}>
              {record.status === "published" ? mobileText.updatePublished : A("publish")}
            </AdminActionButton>
          </>
        }
        more={
          <>
            {previewUrl && (
              <Button asChild variant="outline">
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  {A("preview")}
                </a>
              </Button>
            )}
            <Button type="button" variant="outline" aria-expanded={showEnglish} onClick={() => setShowEnglish((value) => !value)}>
              {showEnglish ? A("hideEnglish") : A("showEnglish")}
            </Button>
            <AdminActionButton
              action="content.write"
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => void save(undefined, true)}
              disabled={saveBusy || !recordReady || isLoading || !record.id}
            >
              {A("saveAndGenerateEnglish")}
            </AdminActionButton>
            <AdminActionButton
              action="content.write"
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => void forceRegenerateEnglish()}
              disabled={saveBusy || !recordReady || isLoading || !record.id}
            >
              {A("forceRegenerateEnglish")}
            </AdminActionButton>
          </>
        }
      />

      <AdminContentPreflight record={record} disabled={saveBusy || isLoading || isSubmitting} onPreview={() => previewAdminService({ record })} />

      {!isNew && id && <AdminServiceNativeSnapshot key={`${id}:${loaded?.updated_at ?? ""}`} serviceId={id} language={language} disabled={saveBusy || isLoading || isSubmitting} />}

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
        />

        {englishMissing && (
          <div className="rounded-lg border px-4 py-3 text-sm admin-tone-warning">
            {englishMissingHint}
          </div>
        )}

        <AdminFormSection
          title={A("publishSectionTitle")}
          description={A("publishSectionDescription")}
          helpText={A("publishSectionHelp")}
        >
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

        <AdminFormSection
          title={A("basicZhTitle")}
          description={A("basicZhDescription")}
          helpText={A("basicZhHelp")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("titleZh")}</label>
              <Input value={record.title_zh} onChange={(e) => setRecord((r) => ({ ...r, title_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="mb-1 block text-sm font-medium">{A("slug")}</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const next = normalizeServiceSlug(record.slug || record.title_zh);
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
              {previewUrl && <div className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">{formatA("frontendPath", { path: previewUrl })}</div>}
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

        <AdminFormSection
          title={A("imageTitle")}
          description={A("imageDescription")}
          helpText={A("imageHelp")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label={A("coverImage")}
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`services/${record.id || "draft"}`}
                usageType="hero"
                altValue={record.alt_zh}
                onAltChange={(alt) => setRecord((r) => ({ ...r, alt_zh: alt }))}
                helpText={A("coverImageHelp")}
              />
            </div>
            <div hidden={!showEnglish}>
              <label className="mb-1 block text-sm font-medium">{A("englishImageAlt")}</label>
              <Input value={record.alt_en} onChange={(e) => setRecord((r) => ({ ...r, alt_en: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection
          title={A("businessZhTitle")}
          description={A("businessZhDescription")}
          helpText={A("businessZhHelp")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <TextListEditor
                label={A("suitableForZh")}
                helpText={getAdminFieldHelp("suitable_for_zh")}
                value={record.suitable_for_zh}
                onChange={(value) => setRecord((r) => ({ ...r, suitable_for_zh: value }))}
                placeholder={A("suitableForZhPlaceholder")}
              />
            </div>
            <div>
              <TextListEditor
                label={A("commonProjectsZh")}
                helpText={getAdminFieldHelp("common_projects_zh")}
                value={record.common_projects_zh}
                onChange={(value) => setRecord((r) => ({ ...r, common_projects_zh: value }))}
                placeholder={A("commonProjectsZhPlaceholder")}
              />
            </div>
            <div className="md:col-span-2">
              <TextListEditor
                label={A("scopeItemsZh")}
                helpText={getAdminFieldHelp("scope_items_zh")}
                value={record.scope_items_zh}
                onChange={(value) => setRecord((r) => ({ ...r, scope_items_zh: value }))}
                placeholder={A("scopeItemsZhPlaceholder")}
              />
            </div>
            <div className="md:col-span-2">
              <ProcessStepsEditor
                label={A("processStepsZh")}
                helpText={getAdminFieldHelp("process_steps_zh")}
                value={record.process_steps_zh}
                onChange={(value) => setRecord((r) => ({ ...r, process_steps_zh: value }))}
              />
            </div>
            <div className="md:col-span-2">
              <FaqListEditor
                label={A("faqsZh")}
                helpText={getAdminFieldHelp("faqs_zh")}
                value={record.faqs_zh}
                onChange={(value) => setRecord((r) => ({ ...r, faqs_zh: value }))}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection
          title={A("seoZhTitle")}
          description={A("seoZhDescription")}
          helpText={A("seoZhHelp")}
          collapsible
          defaultOpen={false}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("seoTitle")}</label>
              <Input value={record.seo_title_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_title_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("seoDescription")}</label>
              <Textarea rows={3} value={record.seo_description_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_description_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <div hidden={!showEnglish} className="space-y-6">
          <AdminFormSection
            title={A("autoEnglishTitle")}
            description={autoEnglishDescription}
            helpText={A("autoEnglishHelp")}
            collapsible
            defaultOpen={false}
          >
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
                <label className="mb-1 block text-sm font-medium">{A("englishBody")}</label>
                <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title={A("autoEnglishBusinessTitle")}
            description={autoEnglishDescription}
            helpText={A("autoEnglishBusinessHelp")}
            collapsible
            defaultOpen={false}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <TextListEditor
                  label={A("suitableForEn")}
                  helpText={getAdminFieldHelp("suitable_for_en")}
                  value={record.suitable_for_en}
                  onChange={(value) => setRecord((r) => ({ ...r, suitable_for_en: value }))}
                  placeholder={A("suitableForEnPlaceholder")}
                />
              </div>
              <div>
                <TextListEditor
                  label={A("commonProjectsEn")}
                  helpText={getAdminFieldHelp("common_projects_en")}
                  value={record.common_projects_en}
                  onChange={(value) => setRecord((r) => ({ ...r, common_projects_en: value }))}
                  placeholder={A("commonProjectsEnPlaceholder")}
                />
              </div>
              <div className="md:col-span-2">
                <TextListEditor
                  label={A("scopeItemsEn")}
                  helpText={getAdminFieldHelp("scope_items_en")}
                  value={record.scope_items_en}
                  onChange={(value) => setRecord((r) => ({ ...r, scope_items_en: value }))}
                  placeholder={A("scopeItemsEnPlaceholder")}
                />
              </div>
              <div className="md:col-span-2">
                <ProcessStepsEditor
                  label={A("processStepsEn")}
                  helpText={getAdminFieldHelp("process_steps_en")}
                  value={record.process_steps_en}
                  onChange={(value) => setRecord((r) => ({ ...r, process_steps_en: value }))}
                />
              </div>
              <div className="md:col-span-2">
                <FaqListEditor
                  label={A("faqsEn")}
                  helpText={getAdminFieldHelp("faqs_en")}
                  value={record.faqs_en}
                  onChange={(value) => setRecord((r) => ({ ...r, faqs_en: value }))}
                />
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title={A("englishSeoTitle")}
            description={autoEnglishDescription}
            helpText={A("englishSeoHelp")}
            collapsible
            defaultOpen={false}
          >
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
        </div>

        <div className="pb-10" />
      </form>
    </>
  );
}
