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
import { invalidateAdminContentDetail, invalidateAfterAdminContentSave } from "@/lib/adminInvalidate";
import { useAdminBlogPostDetail } from "@/lib/adminBusinessContentQueries";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { formatAdminMutationError } from "@/lib/adminMutation";
import { isNewAdminRouteRecord } from "@/lib/adminRouteParams";
import { autoEnglishDescription, englishMissingHint, hasAnyMissingEnglish } from "@/lib/adminTranslation";
import { formatUserFacingError } from "@/lib/userFacingText";
import { adminBlogEditorText } from "@/i18n/adminBlogEditorText";
import {
  checkAdminBlogSlugUnique,
  generateAdminBlogEnglish,
  hasBlogBackendConfig,
  normalizeBlogSlug,
  saveAdminBlogPost,
} from "@/backend/modules/blog/service/blogService";

type AdminBlogEditorTextKey = keyof typeof adminBlogEditorText;
const A = (key: AdminBlogEditorTextKey) => adminBlogEditorText[key][getAdminLang()];

type BlogRecord = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sort_order: number;
  published_at: string | null; // timestamptz

  title_zh: string;
  excerpt_zh: string;
  content_zh: string;
  category: string;
  tags: string[];

  cover_image_url: string;
  alt_zh: string;

  seo_title_zh: string;
  seo_description_zh: string;

  title_en: string;
  excerpt_en: string;
  content_en: string;
  alt_en: string;
  seo_title_en: string;
  seo_description_en: string;
};

const empty: BlogRecord = {
  slug: "",
  status: "draft",
  sort_order: 0,
  published_at: null,
  title_zh: "",
  excerpt_zh: "",
  content_zh: "",
  category: "",
  tags: [],
  cover_image_url: "",
  alt_zh: "",
  seo_title_zh: "",
  seo_description_zh: "",
  title_en: "",
  excerpt_en: "",
  content_en: "",
  alt_en: "",
  seo_title_en: "",
  seo_description_en: "",
};

const blogEnglishFields = [
  "title_en",
  "excerpt_en",
  "content_en",
  "seo_title_en",
  "seo_description_en",
];

const parseLines = (value: string) => value.split("\n").map((s) => s.trim()).filter(Boolean);
const formatLines = (value?: string[] | null) => (value || []).join("\n");

// Convert timestamptz -> datetime-local value (no timezone support in input)
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export default function AdminBlogEditor() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isNew = isNewAdminRouteRecord(id);
  const [showEnglish, setShowEnglish] = useState(true);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugError, setSlugError] = useState<string>("");
  const [saveBusy, setSaveBusy] = useState(false);

  const { data: loaded, isLoading, isError, error: loadError } = useAdminBlogPostDetail(isNew ? undefined : id);

  const loadedRecord = useMemo<BlogRecord | undefined>(() => {
    if (isNew || !loaded) return isNew ? empty : undefined;
    return {
      ...empty,
      ...(loaded as any),
      tags: (loaded as any).tags || [],
      published_at: (loaded as any).published_at || null,
      sort_order: Number((loaded as any).sort_order || 0),
    };
  }, [isNew, loaded]);

  const { state: record, setForm: setRecord, applyRemote, dirty } = useAdminFormState<BlogRecord>(loadedRecord, {
    resetKey: id ?? "new",
    initial: empty,
  });
  const englishMissing = hasAnyMissingEnglish(record as unknown as Record<string, unknown>, blogEnglishFields);
  useUnsavedChangesWarning(dirty && !saveBusy);

  useEffect(() => {
    if (!isError || !loadError) return;
    const message = formatUserFacingError(loadError, getAdminLang());
    toast({ title: A("loadFailed"), description: message, variant: "destructive" });
  }, [isError, loadError]);

  const checkSlugUnique = useCallback(
    async (slug: string) => {
      if (!hasBlogBackendConfig()) return true;
      const value = normalizeBlogSlug(slug);
      if (!value) return false;
      setSlugChecking(true);
      setSlugError("");
      try {
        const isUnique = await checkAdminBlogSlugUnique(value, record.id);
        if (!isUnique) {
          setSlugError(A("slugTaken"));
          return false;
        }
        return true;
      } catch (error) {
        setSlugError(formatUserFacingError(error, getAdminLang()));
        return false;
      } finally {
        setSlugChecking(false);
      }
    },
    [record.id],
  );

  const previewUrl = useMemo(() => {
    const lang = "zh";
    const slug = record.slug ? normalizeBlogSlug(record.slug) : "";
    if (!slug) return "";
    return `/${lang}/blog/${slug}`;
  }, [record.slug]);

  const save = async (nextStatus?: BlogRecord["status"], generateEnglish?: boolean, forceEnglish?: boolean) => {
    if (!hasBlogBackendConfig()) return;
    const slug = normalizeBlogSlug(record.slug || record.title_zh);
    if (!slug) {
      toast({ title: A("slugOrTitleRequired"), variant: "destructive" });
      return;
    }
    const ok = await checkSlugUnique(slug);
    if (!ok) {
      toast({ title: A("slugUnavailable"), description: slugError || A("editBeforeSaving"), variant: "destructive" });
      return;
    }

    setSaveBusy(true);
    let savedResult: Awaited<ReturnType<typeof saveAdminBlogPost>>;
    try {
      savedResult = await saveAdminBlogPost({
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

    if (isNew) navigate(`/admin/blog/${savedId}`, { replace: true });

    if (generateEnglish) {
      try {
        await generateAdminBlogEnglish(savedId, Boolean(forceEnglish));
        toast({ title: A("savedAndEnglishGenerated") });
        void invalidateAdminContentDetail(queryClient, "blog_posts", savedId);
      } catch (translationError) {
        const description = formatUserFacingError(translationError, getAdminLang());
        toast({ title: A("savedButEnglishFailed"), description, variant: "destructive" });
      }
    }
  };

  const forceRegenerateEnglish = async () => {
    const confirmed = await adminConfirm({
      title: A("confirmRegenerateEnglishTitle"),
      description: A("confirmRegenerateEnglishDescription"),
      confirmLabel: A("regenerate"),
    });
    if (confirmed) {
      await save(undefined, true, true);
    }
  };

  if (!hasBlogBackendConfig()) {
    return <AdminEmptyState title={A("supabaseNotConfigured")} description={A("supabaseNotConfiguredDescription")} />;
  }

  return (
    <>
    <AdminStickyActionBar
        left={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/blog">{A("backToList")}</Link>
            </Button>
            {record.status && <span className="text-xs text-muted-foreground">{A("statusInline").replace("{status}", adminStatusLabel("default", record.status))}</span>}
            {slugChecking && <span className="text-xs text-muted-foreground">{A("checkingSlug")}</span>}
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
            <AdminActionButton
              action="content.publish"
              type="button"
              onClick={() => {
                // If publishing without a published_at, set it to now.
                setRecord((r) => ({ ...r, published_at: r.published_at || new Date().toISOString() }));
                void save("published");
              }}
              disabled={saveBusy || isLoading}
            >
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
          title={isNew ? A("newPageTitle") : A("editPageTitle")}
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

        <AdminFormSection title={A("publishSectionTitle")} description={A("publishSectionDescription")} helpText={A("publishSectionHelpText")}>
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
            <div>
              <label className="mb-1 block text-sm font-medium">{A("publishTime")}</label>
              <Input
                type="datetime-local"
                value={toLocalInput(record.published_at)}
                onChange={(e) => setRecord((r) => ({ ...r, published_at: fromLocalInput(e.target.value) }))}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("zhBasicSectionTitle")} description={A("zhBasicSectionDescription")} helpText={A("zhBasicSectionHelpText")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("zhTitle")}</label>
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
                      const next = normalizeBlogSlug(record.slug || record.title_zh);
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
              {previewUrl && <div className="mt-1 text-xs text-muted-foreground">{A("publicPath").replace("{path}", previewUrl)}</div>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{A("category")}</label>
              <Input value={record.category} onChange={(e) => setRecord((r) => ({ ...r, category: e.target.value }))} placeholder={A("categoryPlaceholder")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{A("tags")}</label>
              <Textarea rows={3} value={formatLines(record.tags)} onChange={(e) => setRecord((r) => ({ ...r, tags: parseLines(e.target.value) }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("zhExcerpt")}</label>
              <Textarea rows={3} value={record.excerpt_zh} onChange={(e) => setRecord((r) => ({ ...r, excerpt_zh: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("zhContent")}</label>
              <Textarea rows={14} value={record.content_zh} onChange={(e) => setRecord((r) => ({ ...r, content_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("coverSectionTitle")} description={A("coverSectionDescription")} helpText={A("coverSectionHelpText")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageField
                label={A("coverImage")}
                value={record.cover_image_url}
                onChange={(url) => setRecord((r) => ({ ...r, cover_image_url: url }))}
                folder={`blog_posts/${record.id || "draft"}`}
                usageType="blog"
                altValue={record.alt_zh}
                onAltChange={(alt) => setRecord((r) => ({ ...r, alt_zh: alt }))}
              />
            </div>
            {showEnglish && (
              <div>
                <label className="mb-1 block text-sm font-medium">{A("enImageAlt")}</label>
                <Input value={record.alt_en} onChange={(e) => setRecord((r) => ({ ...r, alt_en: e.target.value }))} />
              </div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("zhSeoSectionTitle")} description={A("zhSeoSectionDescription")} helpText={A("zhSeoSectionHelpText")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("zhSeoTitle")}</label>
              <Input value={record.seo_title_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_title_zh: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">{A("zhSeoDescription")}</label>
              <Textarea rows={3} value={record.seo_description_zh} onChange={(e) => setRecord((r) => ({ ...r, seo_description_zh: e.target.value }))} />
            </div>
          </div>
        </AdminFormSection>

        {showEnglish && (
          <>
            <AdminFormSection title={A("englishSectionTitle")} description={autoEnglishDescription} helpText={A("englishSectionHelpText")} collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("enTitle")}</label>
                  <Input value={record.title_en} onChange={(e) => setRecord((r) => ({ ...r, title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("enExcerpt")}</label>
                  <Textarea rows={3} value={record.excerpt_en} onChange={(e) => setRecord((r) => ({ ...r, excerpt_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("enContent")}</label>
                  <Textarea rows={14} value={record.content_en} onChange={(e) => setRecord((r) => ({ ...r, content_en: e.target.value }))} />
                </div>
              </div>
            </AdminFormSection>

            <AdminFormSection title={A("enSeoSectionTitle")} description={autoEnglishDescription} helpText={A("enSeoSectionHelpText")} collapsible defaultOpen={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("enSeoTitle")}</label>
                  <Input value={record.seo_title_en} onChange={(e) => setRecord((r) => ({ ...r, seo_title_en: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{A("enSeoDescription")}</label>
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
