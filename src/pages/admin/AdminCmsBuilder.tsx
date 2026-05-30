import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { archiveOrDeleteAdminRecord, formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { adminStatusLabel, publishStatusOptions } from "@/lib/adminLocale";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type CmsPage = {
  id?: string;
  page_key: string;
  path: string;
  title_zh?: string | null;
  title_en?: string | null;
  seo_title_zh?: string | null;
  seo_title_en?: string | null;
  seo_description_zh?: string | null;
  seo_description_en?: string | null;
  status: "draft" | "published" | "archived";
  sort_order: number;
  updated_at?: string | null;
};

type CmsSection = {
  id?: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title_zh?: string | null;
  title_en?: string | null;
  content_zh: Record<string, any>;
  content_en: Record<string, any>;
  settings: Record<string, any>;
  status: "draft" | "published" | "archived";
  sort_order: number;
  updated_at?: string | null;
};

type CmsTemplate = {
  template_key: string;
  label: string;
  description?: string | null;
};

type CmsRevision = {
  id: string;
  entity_table: "cms_pages" | "cms_sections" | "cms_content_entries";
  entity_id: string;
  action: string;
  version: number | null;
  snapshot: Record<string, any>;
  created_at: string;
};

const emptyPage: CmsPage = {
  page_key: "",
  path: "/",
  title_zh: "",
  title_en: "",
  seo_title_zh: "",
  seo_title_en: "",
  seo_description_zh: "",
  seo_description_en: "",
  status: "draft",
  sort_order: 0,
};

const prettyJson = (value: unknown) => JSON.stringify(value || {}, null, 2);

const parseJson = (value: string, label: string) => {
  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    throw new Error(`${label} 不是合法 JSON，请检查逗号、引号和括号。`);
  }
};

const makeSectionKey = (type: string) => `${type.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString().slice(-6)}`;

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
  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);

  useEffect(() => {
    if (!selectedPageId && pages[0]?.id) setSelectedPageId(pages[0].id);
  }, [pages, selectedPageId]);

  useEffect(() => {
    if (selectedPage) {
      setPageDraft(selectedPage);
      setDirty(false);
    }
  }, [selectedPage]);

  const selectSection = (section: CmsSection) => {
    setSectionDraft(section);
    setContentZhText(prettyJson(section.content_zh));
    setContentEnText(prettyJson(section.content_en));
    setSettingsText(prettyJson(section.settings));
    setDirty(false);
  };

  const newPage = () => {
    setSelectedPageId(null);
    setPageDraft({ ...emptyPage });
    setSectionDraft(null);
    setDirty(true);
  };

  const newSection = () => {
    if (!selectedPageId) {
      setMessage("请先保存或选择一个页面，再添加模块。");
      return;
    }
    const template = templatesQuery.data?.[0]?.template_key || "rich_text";
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
      if (!pageDraft.page_key.trim()) throw new Error("页面标识不能为空。");
      if (!pageDraft.path.trim().startsWith("/")) throw new Error("前台路径必须以 / 开头。");
      const saved = await saveAdminRecord<CmsPage>({
        table: "cms_pages",
        id: pageDraft.id,
        expectedUpdatedAt: pageDraft.updated_at || null,
        payload: pageDraft,
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

  const archivePage = async () => {
    if (!pageDraft.id || !window.confirm("确认归档这个页面吗？正式前台将不再显示它。")) return;
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
    if (!section.id || !window.confirm("确认归档这个模块吗？正式前台将不再显示它。")) return;
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
    if (!window.confirm("确认恢复这个版本吗？当前内容会被该版本覆盖。")) return;
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
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">通用页面搭建器</h1>
            <p className="mt-1 text-sm text-muted-foreground">管理页面、模块、草稿、发布和版本恢复。</p>
          </div>
          <Button type="button" size="sm" onClick={newPage}>
            <Plus className="mr-2 h-4 w-4" />
            新页面
          </Button>
        </div>
        {message && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{message}</div>}
        <div className="space-y-2">
          {pages.map((page) => (
            <button
              type="button"
              key={page.id}
              onClick={() => setSelectedPageId(page.id || null)}
              className={`w-full rounded-lg border p-3 text-left transition ${selectedPageId === page.id ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-muted"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{page.title_zh || page.title_en || page.page_key}</span>
                <AdminStatusBadge status={page.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{page.path}</p>
            </button>
          ))}
          {!pages.length && <p className="text-sm text-muted-foreground">暂无 CMS 页面。可以先执行默认内容同步，或手动新建。</p>}
        </div>
      </section>

      <div className="space-y-6">
        <AdminPageHeader
          title="通用页面搭建器"
          description="管理页面、模块、草稿、发布和版本恢复。"
          helpText="这里适合做更自由的页面搭建。先建页面，再给页面加模块，最后发布到前台。"
        />

        <AdminFormSection title="页面基础信息" description="控制页面路径、标题、SEO、状态和排序。" helpText="保存页面后，才能给它添加模块。published 会给正式前台读取；draft 只适合后台预览。">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <AdminFieldLabel label="页面标识 page_key" help="只用小写英文、数字、下划线或短横线。保存后不要随便改。" />
              <Input value={pageDraft.page_key} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, page_key: event.target.value })); }} />
            </div>
            <div>
              <AdminFieldLabel label="前台路径 path" help="必须以 / 开头，例如 /about、/services。" />
              <Input value={pageDraft.path} onChange={(event) => { setDirty(true); setPageDraft((page) => ({ ...page, path: event.target.value })); }} />
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
            <Button type="button" disabled={saving} onClick={() => void savePage()}>{saving ? "保存中..." : "保存页面"}</Button>
            {pageDraft.path && (
              <Button asChild type="button" variant="outline">
                <a href={pageDraft.path} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  预览正式路径
                </a>
              </Button>
            )}
            {pageDraft.id && (
              <Button type="button" variant="destructive" onClick={() => void archivePage()}>
                <Trash2 className="mr-2 h-4 w-4" />
                归档页面
              </Button>
            )}
          </div>
        </AdminFormSection>

        <AdminFormSection title="页面模块" description="一个页面可以由多个模块组成，模块排序会影响前台显示顺序。" helpText="模块类型决定前台渲染方式；模块内容用 JSON 保存，适合不同公司官网复用。">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={newSection}>
              <Plus className="mr-2 h-4 w-4" />
              新模块
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-2">
              {(sectionsQuery.data || []).map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => selectSection(section)}
                  className={`w-full rounded-lg border p-3 text-left ${sectionDraft?.id === section.id ? "border-accent bg-accent/10" : "border-border bg-background hover:bg-muted"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{section.title_zh || section.title_en || section.section_key}</span>
                    <AdminStatusBadge status={section.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{section.section_type} · 排序 {section.sort_order}</p>
                </button>
              ))}
              {selectedPageId && !(sectionsQuery.data || []).length && <p className="text-sm text-muted-foreground">这个页面还没有模块。</p>}
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
                      {(templatesQuery.data || []).map((template) => (
                        <option key={template.template_key} value={template.template_key}>{template.label}</option>
                      ))}
                      {!templatesQuery.data?.length && <option value="rich_text">Rich Text</option>}
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
                <div>
                  <AdminFieldLabel label="中文内容 JSON" help="模块中文内容。保存前会检查 JSON 格式。" />
                  <Textarea rows={8} value={contentZhText} onChange={(event) => { setDirty(true); setContentZhText(event.target.value); }} />
                </div>
                <div>
                  <AdminFieldLabel label="英文内容 JSON" help="模块英文内容。英文为空时，英文站可能显示空内容或最后兜底内容。" />
                  <Textarea rows={8} value={contentEnText} onChange={(event) => { setDirty(true); setContentEnText(event.target.value); }} />
                </div>
                <div>
                  <AdminFieldLabel label="模块设置 JSON" help="放布局、按钮、图片等不分语言的设置。" />
                  <Textarea rows={5} value={settingsText} onChange={(event) => { setDirty(true); setSettingsText(event.target.value); }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" disabled={saving} onClick={() => void saveSection()}>{saving ? "保存中..." : "保存模块"}</Button>
                  {sectionDraft.id && (
                    <Button type="button" variant="destructive" onClick={() => void archiveSection(sectionDraft)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      归档模块
                    </Button>
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
                <Button type="button" variant="outline" size="sm" onClick={() => void restoreRevision(revision)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  恢复
                </Button>
              </div>
            ))}
            {!(revisionsQuery.data || []).length && <p className="text-sm text-muted-foreground">暂无版本记录。</p>}
          </div>
        </AdminFormSection>
      </div>
    </div>
  );
}
