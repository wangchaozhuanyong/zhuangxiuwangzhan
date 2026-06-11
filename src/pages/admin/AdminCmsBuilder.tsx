import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDown, ArrowUp, ExternalLink, Globe2, GripVertical, Info, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { AdminActionButton, AdminPermissionHint, useAdminPermission } from "@/components/admin/AdminPermission";
import { adminCmsBuilderSectionTemplates, adminCmsBuilderText } from "@/i18n/adminCmsBuilderText";
import { archiveOrDeleteAdminRecord, formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { isSupabaseConfigured } from "@/lib/supabase";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { SectionContentEditor } from "@/pages/admin/AdminCmsSectionContentEditor";
import {
  loadAdminCmsPages,
  loadAdminCmsRevisions,
  loadAdminCmsSections,
  loadAdminCmsSectionTemplates,
} from "@/backend/modules/cms/service/cmsService";
import {
  buildCmsLocalizedPath,
  cmsPathHasLanguagePrefix,
  createCmsPageDraft,
  emptyPage,
  isCmsPathHandledByStaticRoute,
  isValidCmsPageKey,
  makeSectionKey,
  normalizeCmsPageKey,
  normalizeCmsPagePath,
  parseJson,
  prettyJson,
  shouldAutoSelectFirstCmsPage,
  type CmsPage,
  type CmsRevision,
  type CmsSection,
  type CmsTemplate,
} from "@/lib/adminCmsBuilderModel";

type AdminCmsBuilderTextKey = keyof typeof adminCmsBuilderText;

const A = (key: AdminCmsBuilderTextKey) => adminCmsBuilderText[key][getAdminLang()];

const formatA = (key: AdminCmsBuilderTextKey, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));

export default function AdminCmsBuilder() {
  const queryClient = useQueryClient();
  const adminLang = getAdminLang();
  const [message, setMessage] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pageDraft, setPageDraft] = useState<CmsPage>(emptyPage);
  const [sectionDraft, setSectionDraft] = useState<CmsSection | null>(null);
  const [contentZhText, setContentZhText] = useState("{}");
  const [contentEnText, setContentEnText] = useState("{}");
  const [settingsText, setSettingsText] = useState("{}");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const reorderPermission = useAdminPermission("content.reorder");
  const fallbackCmsSectionTemplates = useMemo<CmsTemplate[]>(
    () =>
      adminCmsBuilderSectionTemplates.map((template) => ({
        template_key: template.template_key,
        label: template.label[adminLang],
        description: template.description[adminLang],
      })),
    [adminLang],
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const pagesQuery = useQuery({
    queryKey: ["admin", "cms_pages"],
    enabled: isSupabaseConfigured,
    queryFn: loadAdminCmsPages,
  });

  const templatesQuery = useQuery({
    queryKey: ["admin", "cms_section_templates"],
    enabled: isSupabaseConfigured,
    queryFn: loadAdminCmsSectionTemplates,
  });

  const sectionsQuery = useQuery({
    queryKey: ["admin", "cms_sections", selectedPageId],
    enabled: isSupabaseConfigured && Boolean(selectedPageId),
    queryFn: () => loadAdminCmsSections(selectedPageId!),
  });

  const revisionsQuery = useQuery({
    queryKey: ["admin", "cms_revisions", selectedPageId],
    enabled: isSupabaseConfigured && Boolean(selectedPageId),
    queryFn: () => loadAdminCmsRevisions(selectedPageId!, sectionsQuery.data || []),
  });

  const pages = useMemo(() => pagesQuery.data || [], [pagesQuery.data]);
  const cmsSectionTemplates = useMemo(() => {
    const byKey = new Map<string, CmsTemplate>();
    fallbackCmsSectionTemplates.forEach((template) => byKey.set(template.template_key, template));
    (templatesQuery.data || []).forEach((template) => byKey.set(template.template_key, template));
    return Array.from(byKey.values());
  }, [fallbackCmsSectionTemplates, templatesQuery.data]);
  const sections = useMemo(() => sectionsQuery.data || [], [sectionsQuery.data]);
  const orderedSections = useMemo(() => {
    if (!sectionOrder.length) return sections;
    const sectionMap = new Map(sections.map((section) => [section.id, section]));
    const ordered = sectionOrder
      .map((id) => sectionMap.get(id))
      .filter(Boolean) as CmsSection[];
    const missing = sections.filter((section) => !section.id || !sectionOrder.includes(section.id));
    return [...ordered, ...missing];
  }, [sectionOrder, sections]);
  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);
  const normalizedDraftPath = normalizeCmsPagePath(pageDraft.path || "/");
  const zhPreviewPath = buildCmsLocalizedPath(normalizedDraftPath, "zh");
  const enPreviewPath = buildCmsLocalizedPath(normalizedDraftPath, "en");
  const normalizedPageKey = normalizeCmsPageKey(pageDraft.page_key || "");
  const isKnownStaticPage = ["home", "about", "services", "materials", "projects", "process", "faq", "contact", "quote", "blog", "privacy", "terms"].includes(normalizedPageKey);
  const pathWarning = useMemo(() => {
    if (!pageDraft.path.trim()) return "";
    if (cmsPathHasLanguagePrefix(pageDraft.path)) return A("pathWarningLanguagePrefix");
    if (normalizedDraftPath === "/" && normalizedPageKey && normalizedPageKey !== "home") return A("pathWarningHome");
    if (isCmsPathHandledByStaticRoute(normalizedDraftPath) && !isKnownStaticPage) {
      return A("pathWarningStatic");
    }
    return "";
  }, [isKnownStaticPage, normalizedDraftPath, normalizedPageKey, pageDraft.path]);

  useEffect(() => {
    if (shouldAutoSelectFirstCmsPage(selectedPageId, dirty, pages[0]?.id)) setSelectedPageId(pages[0].id);
  }, [dirty, pages, selectedPageId]);

  useEffect(() => {
    if (selectedPage) {
      setPageDraft(selectedPage);
      setDirty(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    setSectionOrder(sections.map((section) => section.id).filter(Boolean) as string[]);
  }, [sections]);

  const selectSection = (section: CmsSection) => {
    setSectionDraft(section);
    setContentZhText(prettyJson(section.content_zh));
    setContentEnText(prettyJson(section.content_en));
    setSettingsText(prettyJson(section.settings));
    setDirty(false);
  };

  const newPage = () => {
    setSelectedPageId(null);
    setPageDraft(createCmsPageDraft(pages.length));
    setSectionDraft(null);
    setDirty(true);
    setMessage(A("newPageMessage"));
  };

  const newSection = () => {
    if (!selectedPageId) {
      setMessage(A("sectionNeedsPageMessage"));
      return;
    }
    const template = cmsSectionTemplates[0]?.template_key || "rich_text";
    const draft: CmsSection = {
      page_id: selectedPageId,
      section_key: makeSectionKey(template),
      section_type: template,
      title_zh: "",
      title_en: "",
      content_zh: {},
      content_en: {},
      settings: {},
      status: "draft",
      sort_order: (sectionsQuery.data?.length || 0) * 10 + 10,
    };
    setSectionDraft(draft);
    setContentZhText("{}");
    setContentEnText("{}");
    setSettingsText("{}");
    setDirty(true);
  };

  const savePage = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const normalizedKey = normalizeCmsPageKey(pageDraft.page_key);
      const normalizedPath = normalizeCmsPagePath(pageDraft.path);
      if (!normalizedKey) throw new Error(A("pageKeyRequiredError"));
      if (!isValidCmsPageKey(normalizedKey)) throw new Error(A("pageKeyFormatError"));
      if (cmsPathHasLanguagePrefix(normalizedPath)) throw new Error(A("pathNoLanguagePrefixError"));
      if (normalizedPath === "/" && normalizedKey !== "home") throw new Error(A("homepagePathError"));
      const payload = { ...pageDraft, page_key: normalizedKey, path: normalizedPath };
      const saved = await saveAdminRecord<CmsPage>({
        table: "cms_pages",
        id: pageDraft.id,
        expectedUpdatedAt: pageDraft.updated_at || null,
        payload,
        queryClient,
        invalidate: "admin-content",
      });
      setMessage(A("pageSavedMessage"));
      setSelectedPageId(saved.id || null);
      setPageDraft(saved);
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_pages"] });
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    } finally {
      setSaving(false);
    }
  };

  const saveSection = async () => {
    if (!sectionDraft || saving) return;
    setSaving(true);
    try {
      if (!sectionDraft.section_key.trim()) throw new Error(A("sectionKeyRequiredError"));
      if (!sectionDraft.section_type.trim()) throw new Error(A("sectionTypeRequiredError"));
      const payload = {
        ...sectionDraft,
        content_zh: parseJson(contentZhText, A("zhContentJsonLabel")),
        content_en: parseJson(contentEnText, A("enContentJsonLabel")),
        settings: parseJson(settingsText, A("settingsJsonLabel")),
      };
      const saved = await saveAdminRecord<CmsSection>({
        table: "cms_sections",
        id: sectionDraft.id,
        expectedUpdatedAt: sectionDraft.updated_at || null,
        payload,
        queryClient,
        invalidate: "admin-content",
      });
      setMessage(A("sectionSavedMessage"));
      selectSection(saved);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_sections", selectedPageId] });
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    } finally {
      setSaving(false);
    }
  };

  const persistSectionOrder = async (nextSections: CmsSection[]) => {
    if (!reorderPermission.allowed) {
      setMessage(reorderPermission.reason);
      return;
    }
    if (reordering) return;

    setReordering(true);
    setMessage("");
    try {
      const changedSections = nextSections
        .map((section, index) => ({ section, sortOrder: (index + 1) * 10 }))
        .filter(({ section, sortOrder }) => section.id && Number(section.sort_order || 0) !== sortOrder);

      for (const { section, sortOrder } of changedSections) {
        await saveAdminRecord<CmsSection>({
          table: "cms_sections",
          id: section.id,
          expectedUpdatedAt: section.updated_at || null,
          payload: { ...section, sort_order: sortOrder },
          action: "section_reorder",
          queryClient,
          invalidate: "none",
        });
      }

      setSectionOrder(nextSections.map((section) => section.id).filter(Boolean) as string[]);
      setMessage(changedSections.length ? A("sectionOrderSaved") : A("sectionOrderUnchanged"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "cms_sections", selectedPageId] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "cms_revisions", selectedPageId] }),
        queryClient.invalidateQueries({ queryKey: ["published"] }),
      ]);
    } catch (error) {
      setMessage(formatAdminMutationError(error));
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_sections", selectedPageId] });
    } finally {
      setReordering(false);
      setDraggingSectionId(null);
    }
  };

  const reorderSectionById = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const nextSections = [...orderedSections];
    const sourceIndex = nextSections.findIndex((section) => section.id === sourceId);
    const targetIndex = nextSections.findIndex((section) => section.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = nextSections.splice(sourceIndex, 1);
    nextSections.splice(targetIndex, 0, moved);
    setSectionOrder(nextSections.map((section) => section.id).filter(Boolean) as string[]);
    void persistSectionOrder(nextSections);
  };

  const moveSection = (section: CmsSection, direction: -1 | 1) => {
    if (!section.id) return;
    const currentIndex = orderedSections.findIndex((item) => item.id === section.id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedSections.length) return;
    const nextSections = [...orderedSections];
    const [moved] = nextSections.splice(currentIndex, 1);
    nextSections.splice(nextIndex, 0, moved);
    setSectionOrder(nextSections.map((item) => item.id).filter(Boolean) as string[]);
    void persistSectionOrder(nextSections);
  };

  const archivePage = async () => {
    if (!pageDraft.id) return;
    const confirmed = await adminConfirm({
      title: A("archivePageDialogTitle"),
      description: A("archivePageDialogDescription"),
      confirmLabel: A("archivePageDialogConfirm"),
    });
    if (!confirmed) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "cms_pages", id: pageDraft.id, expectedUpdatedAt: pageDraft.updated_at || null, queryClient });
      setMessage(A("pageArchivedMessage"));
      setSelectedPageId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_pages"] });
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    }
  };

  const archiveSection = async (section: CmsSection) => {
    if (!section.id) return;
    const confirmed = await adminConfirm({
      title: A("archiveSectionDialogTitle"),
      description: A("archiveSectionDialogDescription"),
      confirmLabel: A("archiveSectionDialogConfirm"),
    });
    if (!confirmed) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "cms_sections", id: section.id, expectedUpdatedAt: section.updated_at || null, queryClient });
      setMessage(A("sectionArchivedMessage"));
      setSectionDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_sections", selectedPageId] });
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    }
  };

  const restoreRevision = async (revision: CmsRevision) => {
    const confirmed = await adminConfirm({
      title: A("restoreDialogTitle"),
      description: A("restoreDialogDescription"),
      confirmLabel: A("restoreDialogConfirm"),
    });
    if (!confirmed) return;
    const snapshot = { ...revision.snapshot, deleted_at: null } as Record<string, unknown>;
    const snapshotId = snapshot["id"];
    if (typeof snapshotId !== "string" && typeof snapshotId !== "number") return;
    try {
      await saveAdminRecord({
        table: revision.entity_table,
        id: snapshotId,
        payload: snapshot,
        action: "restore",
        queryClient,
        invalidate: "admin-content",
      });
      setMessage(A("revisionRestoredMessage"));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "cms_pages"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "cms_sections", selectedPageId] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "cms_revisions", selectedPageId] }),
      ]);
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    }
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title={A("supabaseMissingTitle")} description={A("supabaseMissingDescription")} />;
  }

  const dbMissing = pagesQuery.error instanceof Error && pagesQuery.error.message.includes("cms_pages");

  if (dbMissing) {
    return <AdminEmptyState title={A("dbMissingTitle")} description={A("dbMissingDescription")} />;
  }

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <section className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <div className="mb-4 space-y-3">
          <div>
            <h2 className="font-display text-xl font-bold leading-tight">{A("pageListTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{A("pageListDescription")}</p>
          </div>
          <AdminActionButton action="content.write" type="button" size="sm" className="w-full justify-center whitespace-nowrap" onClick={newPage}>
            <Plus className="mr-2 h-4 w-4" />{A("newPageButton")}</AdminActionButton>
        </div>
        {message && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{message}</div>}
        <div className="space-y-2">
          {!pageDraft.id && dirty && (
            <div className="rounded-lg border border-dashed border-accent bg-accent/10 p-3 text-sm">
              <div className="font-medium">{pageDraft.title_zh || pageDraft.page_key || A("newPageDraftFallback")}</div>
              <p className="mt-1 break-all text-xs text-muted-foreground">{normalizedDraftPath}</p>
            </div>
          )}
          {pages.map((page) => (
            <button
              type="button"
              key={page.id}
              onClick={() => setSelectedPageId(page.id || null)}
              className={`w-full rounded-lg border p-3 text-left transition ${selectedPageId === page.id ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-muted"}`}
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 truncate font-medium">{page.title_zh || page.title_en || page.page_key}</span>
                <AdminStatusBadge status={page.status} className="shrink-0" />
              </div>
              <p className="mt-1 break-all text-xs text-muted-foreground">{page.path}</p>
            </button>
          ))}
          {!pages.length && <p className="text-sm text-muted-foreground">{A("noPages")}</p>}
        </div>
      </section>

      <div className="space-y-6">
        <AdminPageHeader
          title={A("builderTitle")}
          description={
            <div className="space-y-2">
              <p>{A("builderDescription")}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-foreground">
                  <Globe2 className="h-3.5 w-3.5" />
                  {A("zhPreviewBadgeLabel")}{zhPreviewPath}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-foreground">
                  <Globe2 className="h-3.5 w-3.5" />
                  {A("enPreviewBadgeLabel")}{enPreviewPath}
                </span>
              </div>
            </div>
          }
          helpText={A("builderHelpText")}
          actions={
            pageDraft.path ? (
              <>
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={zhPreviewPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {A("previewZhButton")}
                  </a>
                </Button>
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={enPreviewPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {A("previewEnButton")}
                  </a>
                </Button>
              </>
            ) : null
          }
        />

        <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-foreground">
          <div className="flex min-w-0 gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">{A("infoTitle")}</p>
              <p className="mt-1 text-muted-foreground">{formatA("infoDescription", { zhPreviewPath, enPreviewPath })}</p>
            </div>
          </div>
        </div>

        <AdminFormSection title={A("pageBasicsTitle")} description={A("pageBasicsDescription")} helpText={A("pageBasicsHelp")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <AdminFieldLabel label={A("pageKeyLabel")} help={A("pageKeyHelp")} />
              <Input value={pageDraft.page_key} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, page_key: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label={A("pathLabel")} help={A("pathHelp")} />
              <Input value={pageDraft.path} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, path: event.target.value })); }} />
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">{A("zhAddressLabel")}</span>
                  <p className="mt-1 break-all font-medium text-foreground">{zhPreviewPath}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">{A("enAddressLabel")}</span>
                  <p className="mt-1 break-all font-medium text-foreground">{enPreviewPath}</p>
                </div>
              </div>
              {pathWarning && (
                <div className="mt-2 flex gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{pathWarning}</span>
                </div>
              )}
            </div>
            <div>
              <AdminFieldLabel label={A("zhTitleLabel")} help={A("zhTitleHelp")} />
              <Input value={pageDraft.title_zh || ""} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, title_zh: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label={A("enTitleLabel")} help={A("enTitleHelp")} />
              <Input value={pageDraft.title_en || ""} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, title_en: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label={A("statusLabel")} help={A("statusHelp")} />
              <select
                value={pageDraft.status}
                onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, status: event.target.value as CmsPage["status"] })); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {publishStatusOptions().map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <AdminFieldLabel label={A("sortLabel")} help={A("sortHelp")} />
              <Input type="number" value={pageDraft.sort_order} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, sort_order: Number(event.target.value || 0) })); }} />
            </div>
            <div className="md:col-span-2">
              <AdminFieldLabel label={A("zhSeoDescriptionLabel")} help={A("zhSeoDescriptionHelp")} />
              <Textarea rows={3} value={pageDraft.seo_description_zh || ""} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, seo_description_zh: event.target.value })); }} />
            </div>
          </div>
          <div data-admin-card-actions className="mt-4 flex flex-wrap gap-2">
            <AdminActionButton action="content.write" type="button" disabled={saving} onClick={() => void savePage()}>{saving ? A("saving") : A("savePageButton")}</AdminActionButton>
            {pageDraft.path && (
              <Button asChild type="button" variant="outline">
                <a href={zhPreviewPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {A("previewZhPageButton")}
                </a>
              </Button>
            )}
            {pageDraft.path && (
              <Button asChild type="button" variant="outline">
                <a href={enPreviewPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {A("previewEnPageButton")}
                </a>
              </Button>
            )}
            {pageDraft.id && (
              <AdminActionButton action="content.archive" type="button" variant="destructive" onClick={() => void archivePage()}>
                <Trash2 className="mr-2 h-4 w-4" />
                {A("archivePageButton")}
              </AdminActionButton>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("sectionsTitle")} description={A("sectionsDescription")} helpText={A("sectionsHelp")}>
          <div data-admin-card-actions className="mb-4 flex flex-wrap gap-2">
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={newSection}>
              <Plus className="mr-2 h-4 w-4" />{A("newSectionButton")}</AdminActionButton>
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-2">
              <AdminPermissionHint action="content.reorder" />
              {orderedSections.map((section, index) => (
                <div
                  key={section.id}
                  draggable={reorderPermission.allowed && Boolean(section.id) && !reordering}
                  onDragStart={(event) => {
                    if (!section.id || !reorderPermission.allowed) return;
                    setDraggingSectionId(section.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", section.id);
                  }}
                  onDragOver={(event) => {
                    if (!reorderPermission.allowed || !draggingSectionId || draggingSectionId === section.id) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = event.dataTransfer.getData("text/plain") || draggingSectionId;
                    if (sourceId && section.id) reorderSectionById(sourceId, section.id);
                  }}
                  onDragEnd={() => setDraggingSectionId(null)}
                  className={`rounded-lg border p-3 transition ${sectionDraft?.id === section.id ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-muted"} ${draggingSectionId === section.id ? "opacity-55" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      title={reorderPermission.allowed ? A("dragSectionTitle") : reorderPermission.reason}
                      className="mt-0.5 rounded-md p-1 text-muted-foreground hover:bg-muted"
                      aria-label={A("dragSectionAria")}
                      disabled={!reorderPermission.allowed || reordering}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => selectSection(section)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{section.title_zh || section.title_en || section.section_key}</span>
                        <AdminStatusBadge status={section.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{section.section_type} · {A("sectionSortInlineLabel")} {section.sort_order}</p>
                    </button>
                    <div className="grid shrink-0 grid-cols-2 gap-1 sm:flex">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        title={reorderPermission.reason}
                        disabled={!reorderPermission.allowed || reordering || index === 0}
                        onClick={() => moveSection(section, -1)}
                        aria-label={A("moveSectionUpAria")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        title={reorderPermission.reason}
                        disabled={!reorderPermission.allowed || reordering || index === orderedSections.length - 1}
                        onClick={() => moveSection(section, 1)}
                        aria-label={A("moveSectionDownAria")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {selectedPageId && !orderedSections.length && <p className="text-sm text-muted-foreground">{A("noSections")}</p>}
              {reordering && <p className="text-xs text-muted-foreground">{A("reordering")}</p>}
            </div>

            {sectionDraft ? (
              <div className="min-w-0 space-y-4 rounded-lg border border-border bg-background p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <AdminFieldLabel label={A("sectionKeyLabel")} help={A("sectionKeyHelp")} />
                    <Input value={sectionDraft.section_key} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, section_key: event.target.value } : section); }} />
                  </div>
                  <div>
                    <AdminFieldLabel label={A("sectionTypeLabel")} help={A("sectionTypeHelp")} />
                    <select
                      value={sectionDraft.section_type}
                      onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, section_type: event.target.value } : section); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {cmsSectionTemplates.map((template) => (
                        <option key={template.template_key} value={template.template_key}>{template.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel label={A("zhSectionTitleLabel")} help={A("zhSectionTitleHelp")} />
                    <Input value={sectionDraft.title_zh || ""} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, title_zh: event.target.value } : section); }} />
                  </div>
                  <div>
                    <AdminFieldLabel label={A("enSectionTitleLabel")} help={A("enSectionTitleHelp")} />
                    <Input value={sectionDraft.title_en || ""} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, title_en: event.target.value } : section); }} />
                  </div>
                  <div>
                    <AdminFieldLabel label={A("statusLabel")} help={A("statusHelp")} />
                    <select
                      value={sectionDraft.status}
                      onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, status: event.target.value as CmsSection["status"] } : section); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {publishStatusOptions().map((item) => (
                        <option key={item.value} value={item.value}>{adminStatusLabel("default", item.value)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <AdminFieldLabel label={A("sortLabel")} help={A("sortHelp")} />
                    <Input type="number" value={sectionDraft.sort_order} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, sort_order: Number(event.target.value || 0) } : section); }} />
                  </div>
                </div>
                <SectionContentEditor
                  sectionType={sectionDraft.section_type}
                  languageLabel={A("zhContentJsonLabel")}
                  text={contentZhText}
                  onChange={setContentZhText}
                  onDirty={() => setDirty(true)}
                />
                <SectionContentEditor
                  sectionType={sectionDraft.section_type}
                  languageLabel={A("enContentJsonLabel")}
                  text={contentEnText}
                  onChange={setContentEnText}
                  onDirty={() => setDirty(true)}
                />
                <div>
                  <AdminFieldLabel label={A("settingsLabel")} help={A("settingsHelp")} />
                  <Textarea rows={5} value={settingsText} onChange={(event) => { setDirty(true); setSettingsText(event.target.value); }} />
                </div>
                <div data-admin-card-actions className="flex flex-wrap gap-2">
                  <AdminActionButton action="content.write" type="button" disabled={saving} onClick={() => void saveSection()}>{saving ? A("saving") : A("saveSectionButton")}</AdminActionButton>
                  {sectionDraft.id && (
                    <AdminActionButton action="content.archive" type="button" variant="destructive" onClick={() => void archiveSection(sectionDraft)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {A("archiveSectionButton")}
                    </AdminActionButton>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground sm:p-6">{A("sectionEmptyPrompt")}</div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title={A("revisionsTitle")} description={A("revisionsDescription")} helpText={A("revisionsHelp")}>
          <div className="space-y-2">
            {(revisionsQuery.data || []).map((revision) => (
              <div key={revision.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{revision.entity_table} · {revision.action} · v{revision.version || "-"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(revision.created_at).toLocaleString("zh-CN")}</p>
                </div>
                <AdminActionButton action="content.restore" type="button" variant="outline" size="sm" onClick={() => void restoreRevision(revision)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {A("restoreButton")}
                </AdminActionButton>
              </div>
            ))}
            {!(revisionsQuery.data || []).length && <p className="text-sm text-muted-foreground">{A("noRevisions")}</p>}
          </div>
        </AdminFormSection>
      </div>
    </div>
  );
}
