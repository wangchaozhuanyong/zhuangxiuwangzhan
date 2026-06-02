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
import { archiveOrDeleteAdminRecord, formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { adminStatusLabel, publishStatusOptions } from "@/lib/adminLocale";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { SectionContentEditor } from "@/pages/admin/AdminCmsSectionContentEditor";
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

const fallbackCmsSectionTemplates: CmsTemplate[] = [
  { template_key: "hero", label: "Hero 首屏", description: "页面顶部的大标题、说明、按钮和主图。" },
  { template_key: "rich_text", label: "富文本内容", description: "公司介绍、服务说明或长段落正文。" },
  { template_key: "service_grid", label: "服务卡片", description: "展示多个服务项目。" },
  { template_key: "testimonials", label: "客户评价", description: "展示客户评价列表。" },
  { template_key: "faq", label: "常见问题", description: "维护问答列表。" },
  { template_key: "cta", label: "行动引导 CTA", description: "联系、报价、预约等转化区域。" },
];

export default function AdminCmsBuilder() {
  const queryClient = useQueryClient();
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
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("cms_pages")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CmsPage[];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["admin", "cms_section_templates"],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase!.from("cms_section_templates").select("*").order("sort_order");
      if (error) throw error;
      return (data || []) as CmsTemplate[];
    },
  });

  const sectionsQuery = useQuery({
    queryKey: ["admin", "cms_sections", selectedPageId],
    enabled: isSupabaseConfigured && Boolean(selectedPageId),
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("cms_sections")
        .select("*")
        .eq("page_id", selectedPageId!)
        .is("deleted_at", null)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data || []) as CmsSection[];
    },
  });

  const revisionsQuery = useQuery({
    queryKey: ["admin", "cms_revisions", selectedPageId],
    enabled: isSupabaseConfigured && Boolean(selectedPageId),
    queryFn: async () => {
      const pageId = selectedPageId!;
      const sectionIds = (sectionsQuery.data || []).map((section) => section.id).filter(Boolean);
      const ids = [pageId, ...sectionIds] as string[];
      const { data, error } = await supabase!
        .from("cms_revisions")
        .select("*")
        .in("entity_id", ids)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as CmsRevision[];
    },
  });

  const pages = useMemo(() => pagesQuery.data || [], [pagesQuery.data]);
  const cmsSectionTemplates = useMemo(() => {
    const byKey = new Map<string, CmsTemplate>();
    fallbackCmsSectionTemplates.forEach((template) => byKey.set(template.template_key, template));
    (templatesQuery.data || []).forEach((template) => byKey.set(template.template_key, template));
    return Array.from(byKey.values());
  }, [templatesQuery.data]);
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
    if (cmsPathHasLanguagePrefix(pageDraft.path)) return "这里不用写 /zh 或 /en，系统会自动生成中文和英文访问地址。";
    if (normalizedDraftPath === "/" && normalizedPageKey && normalizedPageKey !== "home") return "只有首页应该使用 /，新页面请换成自己的路径，例如 /company-profile。";
    if (isCmsPathHandledByStaticRoute(normalizedDraftPath) && !isKnownStaticPage) {
      return "这个路径会被已有固定页面接管。新建自由页面建议换一个路径，例如 /company-profile。";
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
    setMessage("已创建新页面草稿。确认页面路径、标题和状态后保存。");
  };

  const newSection = () => {
    if (!selectedPageId) {
      setMessage("请先保存或选择一个页面，再添加模块。");
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
      if (!normalizedKey) throw new Error("页面标识不能为空。");
      if (!isValidCmsPageKey(normalizedKey)) throw new Error("页面标识只能使用小写英文、数字、下划线或短横线。");
      if (cmsPathHasLanguagePrefix(normalizedPath)) throw new Error("前台路径不要写 /zh 或 /en。保存 /company-profile 后，系统会生成 /zh/company-profile 和 /en/company-profile。");
      if (normalizedPath === "/" && normalizedKey !== "home") throw new Error("只有首页可以使用 /，新页面请换成自己的路径。");
      const payload = { ...pageDraft, page_key: normalizedKey, path: normalizedPath };
      const saved = await saveAdminRecord<CmsPage>({
        table: "cms_pages",
        id: pageDraft.id,
        expectedUpdatedAt: pageDraft.updated_at || null,
        payload,
        queryClient,
        invalidate: "admin-content",
      });
      setMessage("页面已保存。");
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
      if (!sectionDraft.section_key.trim()) throw new Error("模块标识不能为空。");
      if (!sectionDraft.section_type.trim()) throw new Error("模块类型不能为空。");
      const payload = {
        ...sectionDraft,
        content_zh: parseJson(contentZhText, "中文内容 JSON"),
        content_en: parseJson(contentEnText, "英文内容 JSON"),
        settings: parseJson(settingsText, "模块设置 JSON"),
      };
      const saved = await saveAdminRecord<CmsSection>({
        table: "cms_sections",
        id: sectionDraft.id,
        expectedUpdatedAt: sectionDraft.updated_at || null,
        payload,
        queryClient,
        invalidate: "admin-content",
      });
      setMessage("模块已保存。");
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
      setMessage(changedSections.length ? "模块顺序已保存，前台会按新顺序读取。" : "模块顺序没有变化。");
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
      title: "确认归档这个页面？",
      description: "归档后正式前台将不再显示它。请确认这个页面不是当前客户需要访问的页面。",
      confirmLabel: "归档页面",
    });
    if (!confirmed) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "cms_pages", id: pageDraft.id, expectedUpdatedAt: pageDraft.updated_at || null, queryClient });
      setMessage("页面已归档。");
      setSelectedPageId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_pages"] });
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    }
  };

  const archiveSection = async (section: CmsSection) => {
    if (!section.id) return;
    const confirmed = await adminConfirm({
      title: "确认归档这个模块？",
      description: "归档后正式前台将不再显示这个页面模块。请确认前台不再需要它。",
      confirmLabel: "归档模块",
    });
    if (!confirmed) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "cms_sections", id: section.id, expectedUpdatedAt: section.updated_at || null, queryClient });
      setMessage("模块已归档。");
      setSectionDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "cms_sections", selectedPageId] });
    } catch (error) {
      setMessage(formatAdminMutationError(error));
    }
  };

  const restoreRevision = async (revision: CmsRevision) => {
    const confirmed = await adminConfirm({
      title: "确认恢复这个版本？",
      description: "当前内容会被这个历史版本覆盖。建议确认版本时间和内容后再恢复。",
      confirmLabel: "恢复版本",
    });
    if (!confirmed) return;
    const snapshot = { ...revision.snapshot, deleted_at: null } as Record<string, any>;
    try {
      await saveAdminRecord({
        table: revision.entity_table,
        id: snapshot["id"],
        payload: snapshot,
        action: "restore",
        queryClient,
        invalidate: "admin-content",
      });
      setMessage("版本已恢复。");
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
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后，才能使用通用 CMS 页面搭建器。" />;
  }

  const dbMissing = pagesQuery.error instanceof Error && pagesQuery.error.message.includes("cms_pages");

  if (dbMissing) {
    return <AdminEmptyState title="CMS 数据表还没创建" description="请先执行迁移 supabase/migrations/202605300001_professional_admin_foundation.sql。" />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <div className="mb-4 space-y-3">
          <div>
            <h2 className="font-display text-xl font-bold leading-tight">页面列表</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">选择已有页面，或新建一个自由页面草稿。</p>
          </div>
          <AdminActionButton action="content.write" type="button" size="sm" className="w-full justify-center whitespace-nowrap" onClick={newPage}>
            <Plus className="mr-2 h-4 w-4" />
            新页面
          </AdminActionButton>
        </div>
        {message && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{message}</div>}
        <div className="space-y-2">
          {!pageDraft.id && dirty && (
            <div className="rounded-lg border border-dashed border-accent bg-accent/10 p-3 text-sm">
              <div className="font-medium">{pageDraft.title_zh || pageDraft.page_key || "新页面草稿"}</div>
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
          {!pages.length && <p className="text-sm text-muted-foreground">暂无 CMS 页面。可以先执行默认内容同步，或手动新建。</p>}
        </div>
      </section>

      <div className="space-y-6">
        <AdminPageHeader
          title="通用页面搭建器"
          description={
            <div className="space-y-2">
              <p>用于管理可复用页面、模块、草稿、发布和版本恢复。新建自由页面发布后，通过中文站和英文站访问。</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-foreground">
                  <Globe2 className="h-3.5 w-3.5" />
                  中文：{zhPreviewPath}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-foreground">
                  <Globe2 className="h-3.5 w-3.5" />
                  English：{enPreviewPath}
                </span>
              </div>
            </div>
          }
          helpText="这里适合新增不占用固定路由的自由页面。后台 path 保存为 /company-profile，前台实际访问 /zh/company-profile 和 /en/company-profile。"
          actions={
            pageDraft.path ? (
              <>
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={zhPreviewPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    预览中文
                  </a>
                </Button>
                <Button asChild type="button" variant="outline" size="sm">
                  <a href={enPreviewPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Preview EN
                  </a>
                </Button>
              </>
            ) : null
          }
        />

        <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-foreground">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div>
              <p className="font-semibold">这个功能可以新增页面，但路径不要直接访问 `/xxx`。</p>
              <p className="mt-1 text-muted-foreground">后台保存的 path 是不带语言前缀的基础路径；正式前台会使用 `{zhPreviewPath}` 和 `{enPreviewPath}`。</p>
            </div>
          </div>
        </div>

        <AdminFormSection title="页面基础信息" description="控制页面路径、标题、SEO、状态和排序。" helpText="保存页面后，才能给它添加模块。published 会给正式前台读取；draft 只适合后台预览。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <AdminFieldLabel label="页面标识 page_key" help="只用小写英文、数字、下划线或短横线。保存后不要随便改。" />
              <Input value={pageDraft.page_key} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, page_key: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label="前台路径 path" help="保存不带语言前缀的基础路径，例如 /company-profile。正式访问地址会自动加 /zh 或 /en。" />
              <Input value={pageDraft.path} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, path: event.target.value })); }} />
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">中文地址</span>
                  <p className="mt-1 break-all font-medium text-foreground">{zhPreviewPath}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <span className="text-muted-foreground">英文地址</span>
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
              <AdminFieldLabel label="中文标题" help="前台中文页面可读取的标题。" />
              <Input value={pageDraft.title_zh || ""} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, title_zh: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label="英文标题" help="前台英文页面可读取的标题。" />
              <Input value={pageDraft.title_en || ""} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, title_en: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label="状态" help="published 正式显示，draft 草稿，archived 归档。" />
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
              <AdminFieldLabel label="排序" help="数字越小越靠前。" />
              <Input type="number" value={pageDraft.sort_order} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, sort_order: Number(event.target.value || 0) })); }} />
            </div>
            <div className="md:col-span-2">
              <AdminFieldLabel label="中文 SEO 描述" help="搜索结果和分享卡片常用描述。" />
              <Textarea rows={3} value={pageDraft.seo_description_zh || ""} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, seo_description_zh: event.target.value })); }} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminActionButton action="content.write" type="button" disabled={saving} onClick={() => void savePage()}>{saving ? "保存中..." : "保存页面"}</AdminActionButton>
            {pageDraft.path && (
              <Button asChild type="button" variant="outline">
                <a href={zhPreviewPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  预览中文页
                </a>
              </Button>
            )}
            {pageDraft.path && (
              <Button asChild type="button" variant="outline">
                <a href={enPreviewPath} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  预览英文页
                </a>
              </Button>
            )}
            {pageDraft.id && (
              <AdminActionButton action="content.archive" type="button" variant="destructive" onClick={() => void archivePage()}>
                <Trash2 className="mr-2 h-4 w-4" />
                归档页面
              </AdminActionButton>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title="页面模块" description="一个页面可以由多个模块组成，模块排序会影响前台显示顺序。" helpText="模块类型决定前台渲染方式；模块内容用 JSON 保存，适合不同公司官网复用。">
          <div className="mb-4 flex flex-wrap gap-2">
            <AdminActionButton action="content.write" type="button" variant="outline" onClick={newSection}>
              <Plus className="mr-2 h-4 w-4" />
              新模块
            </AdminActionButton>
          </div>
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
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
                      title={reorderPermission.allowed ? "按住拖动可以调整模块顺序" : reorderPermission.reason}
                      className="mt-0.5 rounded-md p-1 text-muted-foreground hover:bg-muted"
                      aria-label="拖拽调整模块顺序"
                      disabled={!reorderPermission.allowed || reordering}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => selectSection(section)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{section.title_zh || section.title_en || section.section_key}</span>
                        <AdminStatusBadge status={section.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{section.section_type} · 排序 {section.sort_order}</p>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        title={reorderPermission.reason}
                        disabled={!reorderPermission.allowed || reordering || index === 0}
                        onClick={() => moveSection(section, -1)}
                        aria-label="模块上移"
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
                        aria-label="模块下移"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {selectedPageId && !orderedSections.length && <p className="text-sm text-muted-foreground">这个页面还没有模块。</p>}
              {reordering && <p className="text-xs text-muted-foreground">正在保存模块顺序...</p>}
            </div>

            {sectionDraft ? (
              <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <AdminFieldLabel label="模块标识" help="同一个页面里必须唯一，例如 hero、intro、faq。" />
                    <Input value={sectionDraft.section_key} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, section_key: event.target.value } : section); }} />
                  </div>
                  <div>
                    <AdminFieldLabel label="模块类型" help="选择前台渲染方式，例如 hero、rich_text、faq。" />
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
                    <AdminFieldLabel label="中文模块标题" help="可显示在前台模块标题位置。" />
                    <Input value={sectionDraft.title_zh || ""} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, title_zh: event.target.value } : section); }} />
                  </div>
                  <div>
                    <AdminFieldLabel label="英文模块标题" help="英文前台可读取。" />
                    <Input value={sectionDraft.title_en || ""} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, title_en: event.target.value } : section); }} />
                  </div>
                  <div>
                    <AdminFieldLabel label="状态" help="published 正式显示，draft 草稿，archived 归档。" />
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
                    <AdminFieldLabel label="排序" help="数字越小越靠前。" />
                    <Input type="number" value={sectionDraft.sort_order} onChange={(event) => { setDirty(true); setSectionDraft((section) => section ? { ...section, sort_order: Number(event.target.value || 0) } : section); }} />
                  </div>
                </div>
                <SectionContentEditor
                  sectionType={sectionDraft.section_type}
                  languageLabel="中文内容"
                  text={contentZhText}
                  onChange={setContentZhText}
                  onDirty={() => setDirty(true)}
                />
                <SectionContentEditor
                  sectionType={sectionDraft.section_type}
                  languageLabel="英文内容"
                  text={contentEnText}
                  onChange={setContentEnText}
                  onDirty={() => setDirty(true)}
                />
                <div>
                  <AdminFieldLabel label="模块设置 JSON" help="放布局、按钮、图片等不分语言的设置。" />
                  <Textarea rows={5} value={settingsText} onChange={(event) => { setDirty(true); setSettingsText(event.target.value); }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminActionButton action="content.write" type="button" disabled={saving} onClick={() => void saveSection()}>{saving ? "保存中..." : "保存模块"}</AdminActionButton>
                  {sectionDraft.id && (
                    <AdminActionButton action="content.archive" type="button" variant="destructive" onClick={() => void archiveSection(sectionDraft)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      归档模块
                    </AdminActionButton>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">选择一个模块编辑，或点击“新模块”。</div>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title="版本记录与恢复" description="显示当前页面和模块最近版本。恢复前请确认内容。" helpText="用于误操作后的回滚。恢复会写入新的版本记录。">
          <div className="space-y-2">
            {(revisionsQuery.data || []).map((revision) => (
              <div key={revision.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{revision.entity_table} · {revision.action} · v{revision.version || "-"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(revision.created_at).toLocaleString("zh-CN")}</p>
                </div>
                <AdminActionButton action="content.restore" type="button" variant="outline" size="sm" onClick={() => void restoreRevision(revision)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  恢复
                </AdminActionButton>
              </div>
            ))}
            {!(revisionsQuery.data || []).length && <p className="text-sm text-muted-foreground">暂无版本记录。</p>}
          </div>
        </AdminFormSection>
      </div>
    </div>
  );
}
