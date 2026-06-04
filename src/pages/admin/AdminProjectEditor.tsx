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
import { adminProjectEditorText } from "@/i18n/adminProjectEditorText";
import { invalidateAdminContentDetail, invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminProjectDetail } from "@/lib/adminBusinessContentQueries";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import AdminProjectImages from "./AdminProjectImages";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { isNewAdminRouteRecord } from "@/lib/adminRouteParams";
import { autoEnglishDescription, englishMissingHint, hasAnyMissingEnglish } from "@/lib/adminTranslation";
import { formatUserFacingError } from "@/lib/userFacingText";
import {
  checkAdminProjectSlugUnique,
  generateAdminProjectEnglish,
  hasProjectBackendConfig,
  normalizeProjectSlug,
  saveAdminProject,
} from "@/backend/modules/projects/service/projectService";

type ProjectRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;

  title_zh: string;
  excerpt_zh: string;
  content_zh: string;

  title_en: string;
  excerpt_en: string;
  content_en: string;

  project_type: string;
  location: string;
  area: string;
  duration: string;
  budget: string;
  client_need_zh: string;
  client_need_en: string;
  materials: string[];
  scope: string[];
  highlights_zh: string[];
  highlights_en: string[];

  image_url: string; // legacy fallback only; actual cover is project_images(type='cover')

  seo_title_zh: string;
  seo_description_zh: string;
  seo_title_en: string;
  seo_description_en: string;
};

const empty: ProjectRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  project_type: "",
  location: "",
  area: "",
  duration: "",
  budget: "",
  client_need_zh: "",
  client_need_en: "",
  materials: [],
  scope: [],
  highlights_zh: [],
  highlights_en: [],
  image_url: "",
  seo_title_zh: "",
  seo_description_zh: "",
  seo_title_en: "",
  seo_description_en: "",
};

const projectEnglishFields = [
  "title_en",
  "excerpt_en",
  "content_en",
  "client_need_en",
  "highlights_en",
  "seo_title_en",
  "seo_description_en",
];

type AdminProjectEditorTextKey = keyof typeof adminProjectEditorText;

const parseLines = (value: string) => value.split("\n").map((s) => s.trim()).filter(Boolean);
const formatLines = (value?: string[] | null) => (value || []).join("\n");

export default function AdminProjectEditor() {
  const language = getAdminLang();
  const A = useCallback((key: AdminProjectEditorTextKey): string => adminProjectEditorText[key][language], [language]);
  const formatA = useCallback(
    (key: AdminProjectEditorTextKey, values: Record<string, string>): string =>
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

  const { data: loaded, isLoading, isError, error: loadError } = useAdminProjectDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<ProjectRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    return {
      ...empty,
      ...(loaded as any),
      materials: (loaded as any).materials || [],
      scope: (loaded as any).scope || [],
      highlights_zh: (loaded as any).highlights_zh || [],
      highlights_en: (loaded as any).highlights_en || [],
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote, dirty } = useAdminFormState<ProjectRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
  const englishMissing = hasAnyMissingEnglish(record as unknown as Record<string, unknown>, projectEnglishFields);
  useUnsavedChangesWarning(dirty && !saveBusy);

  useEffect(() => {
    if (!isError || !loadError) return;
    const message = formatUserFacingError(loadError, language);
    toast({ title: A("loadFailed"), description: message, variant: "destructive" });
  }, [A, isError, language, loadError]);

  const checkSlugUnique = useCallback(
    async (slug: string) => {
      if (!hasProjectBackendConfig()) return true;
      const value = normalizeProjectSlug(slug);
      if (!value) return false;
      setSlugChecking(true);
      setSlugError("");
      try {
        const isUnique = await checkAdminProjectSlugUnique(value, record.id);
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
    const slug = record.slug ? normalizeProjectSlug(record.slug) : "";
    if (!slug) return "";
    return `/${lang}/projects/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: ProjectRecord["status"], generateEnglish?: boolean, forceEnglish?: boolean) => {
    if (!hasProjectBackendConfig()) return;
    const slug = normalizeProjectSlug(record.slug || record.title_zh);
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
    let savedResult: Awaited<ReturnType<typeof saveAdminProject>>;
    try {
      savedResult = await saveAdminProject({
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

    if (isNew) navigate(`/admin/projects/${savedId}`, { replace: true });

    if (generateEnglish) {
      try {
        await generateAdminProjectEnglish(savedId, Boolean(forceEnglish));
        toast({ title: A("savedGenerateSuccess") });
        void invalidateAdminContentDetail(queryClient, "projects", savedId);
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

  if (!hasProjectBackendConfig()) {
    return <AdminEmptyState title={A("supabaseMissingTitle")} description={A("supabaseMissingDescription")} />;
  }

  return (
    <>
    <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/projects">{A("backToList")}</Link>
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
                onChange={(e) => setRecord((r) => ({ ...r, status: e.target.value as any }))}
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
              <label className="mb-1 block text-sm font-medium">{A("projectTitle")}</label>
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
                      const next = normalizeProjectSlug(record.slug || record.title_zh);
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
              <label className="mb-1 block text-sm font-medium">{A("projectExcerpt")}</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("projectContent")}</label>
              <Textarea rows={10} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("projectDataTitle")} description={A("projectDataDescription")} helpText={A("projectDataHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{A("projectType")}</label>
              <Input value={record.project_type} onChange={(e) => setRecord((r) => ({ ...r, project_type: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("location")}</label>
              <Input value={record.location} onChange={(e) => setRecord((r) => ({ ...r, location: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("area")}</label>
              <Input value={record.area} onChange={(e) => setRecord((r) => ({ ...r, area: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("duration")}</label>
              <Input value={record.duration} onChange={(e) => setRecord((r) => ({ ...r, duration: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("budget")}</label>
              <Input value={record.budget} onChange={(e) => setRecord((r) => ({ ...r, budget: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("clientNeed")}</label>
              <Textarea rows={4} value={record.client_need_zh} onChange={(e) => setRecord((r) => ({ ...r, client_need_zh: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("materials")}</label>
              <Textarea rows={6} value={formatLines(record.materials)} onChange={(e) => setRecord((r) => ({ ...r, materials: parseLines(e.target.value) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("scope")}</label>
              <Textarea rows={6} value={formatLines(record.scope)} onChange={(e) => setRecord((r) => ({ ...r, scope: parseLines(e.target.value) }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("highlights")}</label>
              <Textarea rows={6} value={formatLines(record.highlights_zh)} onChange={(e) => setRecord((r) => ({ ...r, highlights_zh: parseLines(e.target.value) }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("fallbackCoverTitle")} description={A("fallbackCoverDescription")} helpText={A("fallbackCoverHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label={A("fallbackCoverLabel")}
                value={record.image_url}
                onChange={(url) => setRecord((r) => ({ ...r, image_url: url }))}
                folder={`projects/${record.id || "draft"}`}
                usageType="project"
                helpText={A("fallbackCoverFieldHelp")}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminProjectImages projectId={record.id} />

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
                  <label className="mb-1 block text-sm font-medium">{A("englishBody")}</label>
                  <Textarea rows={10} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("clientNeedEn")}</label>
                  <Textarea rows={4} value={record.client_need_en} onChange={(e) => setRecord((r) => ({ ...r, client_need_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("highlightsEn")}</label>
                  <Textarea rows={6} value={formatLines(record.highlights_en)} onChange={(e) => setRecord((r) => ({ ...r, highlights_en: parseLines(e.target.value) }))} />
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
