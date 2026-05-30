import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import ImageField from "@/components/admin/ImageField";
import { HomeSectionItemsEditor } from "@/components/admin/StructuredArrayEditors";
import { invalidatePublishedContent } from "@/lib/adminInvalidate";
import { archiveOrDeleteAdminRecord, formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import type { CtaRow, FaqRow, HomeSectionRow, ProcessStepRow } from "@/lib/adminEditorData";
import { useAdminHomeEditorData } from "@/lib/adminQueries";
import { translateFieldLabel } from "@/i18n/displayLabels";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";

const L = (field: string) => translateFieldLabel(field, getAdminLang());

const mergeSectionItems = (itemsZh?: any[] | null, itemsEn?: any[] | null) => {
  const zh = Array.isArray(itemsZh) ? itemsZh : [];
  const en = Array.isArray(itemsEn) ? itemsEn : [];
  const length = Math.max(zh.length, en.length);
  return Array.from({ length }, (_, index) => ({ ...(en[index] || {}), ...(zh[index] || {}) }));
};

export default function AdminHomeEditor() {
  const queryClient = useQueryClient();
  const { data: bundle, isFetching, refetch } = useAdminHomeEditorData();
  const [activeTab, setActiveTab] = useState("hero");
  const loading = isFetching;

  const [statsSection, setStatsSection] = useState<HomeSectionRow | null>(null);
  const [whySection, setWhySection] = useState<HomeSectionRow | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStepRow[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([]);
  const [ctaBlock, setCtaBlock] = useState<CtaRow | null>(null);

  const [statsItems, setStatsItems] = useState<any[]>([]);
  const [whyItems, setWhyItems] = useState<any[]>([]);
  const formDirtyRef = useRef(false);
  const [formDirty, setFormDirty] = useState(false);

  const markDirty = () => {
    formDirtyRef.current = true;
    setFormDirty(true);
  };
  useUnsavedChangesWarning(formDirty);

  useEffect(() => {
    if (!bundle) return;
    if (formDirtyRef.current) return;
    setStatsSection(bundle.stats);
    setWhySection(bundle.why);
    setProcessSteps(bundle.processSteps);
    setFaqRows(bundle.faqRows);
    setCtaBlock(bundle.ctaBlock);
    setStatsItems(mergeSectionItems(bundle.stats?.items_zh as any[] | undefined, bundle.stats?.items_en as any[] | undefined));
    setWhyItems(mergeSectionItems(bundle.why?.items_zh as any[] | undefined, bundle.why?.items_en as any[] | undefined));
  }, [bundle]);

  const refreshEditor = async () => {
    formDirtyRef.current = false;
    setFormDirty(false);
    void invalidatePublishedContent(queryClient);
    await refetch();
  };

  const saveHomeSectionItems = async (row: HomeSectionRow | null, items: any[]) => {
    if (!supabase) return;
    if (!row?.id) {
      toast({ title: "无法保存", description: "首页模块数据还没加载出来，请先刷新页面再试。", variant: "destructive" });
      return;
    }
    const cleaned = items.filter((item) => Object.values(item || {}).some((value) => String(value || "").trim()));
    try {
      await saveAdminRecord({
        table: "home_sections",
        payload: { items_zh: cleaned, items_en: cleaned },
        id: row.id,
        expectedUpdatedAt: row.updated_at || null,
        queryClient,
      });
    } catch (error) {
      toast({ title: "\u4fdd\u5b58\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
      return;
    }
    toast({ title: "已保存" });
    await refreshEditor();
  };

  const upsertProcessStep = async (draft: ProcessStepRow) => {
    if (!supabase) return;
    const payload: any = {
      step_number: Number(draft.step_number || 0),
      title_zh: draft.title_zh || null,
      title_en: draft.title_en || null,
      description_zh: draft.description_zh || null,
      description_en: draft.description_en || null,
      icon_key: draft.icon_key || null,
      status: draft.status || "published",
      sort_order: Number(draft.sort_order || 0),
    };
    try {
      await saveAdminRecord({
        table: "process_steps",
        payload,
        id: draft.id,
        expectedUpdatedAt: draft.updated_at || null,
        queryClient,
      });
      toast({ title: "已保存" });
      await refreshEditor();
    } catch (error) {
      toast({ title: "\u4fdd\u5b58\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const deleteProcessStep = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm("\u786e\u8ba4\u8981\u5f52\u6863/\u5220\u9664\u8fd9\u4e2a\u6d41\u7a0b\u6b65\u9aa4\u5417\uff1f")) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "process_steps", id, queryClient });
      toast({ title: "已删除" });
      await refreshEditor();
    } catch (error) {
      toast({ title: "\u5220\u9664\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const upsertFaq = async (draft: FaqRow) => {
    if (!supabase) return;
    const payload: any = {
      page_key: "home",
      question_zh: draft.question_zh || null,
      answer_zh: draft.answer_zh || null,
      question_en: draft.question_en || null,
      answer_en: draft.answer_en || null,
      status: draft.status || "published",
      sort_order: Number(draft.sort_order || 0),
    };
    try {
      await saveAdminRecord({
        table: "faqs",
        payload,
        id: draft.id,
        expectedUpdatedAt: draft.updated_at || null,
        queryClient,
      });
      toast({ title: "已保存" });
      await refreshEditor();
    } catch (error) {
      toast({ title: "\u4fdd\u5b58\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const deleteFaq = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm("\u786e\u8ba4\u8981\u5f52\u6863/\u5220\u9664\u8fd9\u4e2a FAQ \u5417\uff1f")) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "faqs", id, queryClient });
      toast({ title: "已删除" });
      await refreshEditor();
    } catch (error) {
      toast({ title: "\u5220\u9664\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const upsertCta = async (draft: CtaRow) => {
    if (!supabase) return;
    const payload: any = {
      block_key: "home_final",
      title_zh: draft.title_zh || null,
      title_en: draft.title_en || null,
      description_zh: draft.description_zh || null,
      description_en: draft.description_en || null,
      primary_label_zh: draft.primary_label_zh || null,
      primary_label_en: draft.primary_label_en || null,
      primary_url: draft.primary_url || null,
      secondary_label_zh: draft.secondary_label_zh || null,
      secondary_label_en: draft.secondary_label_en || null,
      secondary_url: draft.secondary_url || null,
      image_url: draft.image_url || null,
      status: draft.status || "published",
    };

    try {
      await saveAdminRecord({
        table: "cta_blocks",
        payload,
        id: draft.id,
        expectedUpdatedAt: draft.updated_at || null,
        queryClient,
      });
      toast({ title: "已保存" });
      await refreshEditor();
    } catch (error) {
      toast({ title: "\u4fdd\u5b58\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const ctaDraft = useMemo<CtaRow>(
    () =>
      ctaBlock || {
        block_key: "home_final",
        title_zh: "",
        title_en: "",
        description_zh: "",
        description_en: "",
        primary_label_zh: "",
        primary_label_en: "",
        primary_url: "/quote",
        secondary_label_zh: "",
        secondary_label_en: "",
        secondary_url: "",
        image_url: "",
        status: "published",
      },
    [ctaBlock],
  );

  const [editingStep, setEditingStep] = useState<ProcessStepRow | null>(null);
  const [editingFaq, setEditingFaq] = useState<FaqRow | null>(null);
  const [editingCta, setEditingCta] = useState<CtaRow | null>(null);

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用首页后台管理。" />;
  }

  return (
    <>
      <AdminPageHeader
        title="首页管理"
        description="这里管理首页关键区块：统计数据、为什么选择我们、施工流程、首页常见问题和首页行动引导区。首页首屏固定播放视频，后台只管理按钮文案和链接，避免图片覆盖视频。"
        actions={
          <Button variant="outline" onClick={() => void refetch()} disabled={loading}>
            {loading ? "刷新中..." : "刷新"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-4 overflow-auto">
          <TabsList className="w-max">
            <TabsTrigger value="hero">首屏按钮</TabsTrigger>
            <TabsTrigger value="stats">统计数据</TabsTrigger>
            <TabsTrigger value="why">为什么选择我们</TabsTrigger>
            <TabsTrigger value="process">施工流程</TabsTrigger>
            <TabsTrigger value="beforeAfter">改造前后</TabsTrigger>
            <TabsTrigger value="testimonials">客户评价</TabsTrigger>
            <TabsTrigger value="faq">首页常见问题</TabsTrigger>
            <TabsTrigger value="cta">首页行动引导</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hero" className="space-y-6">
          <AdminFormSection title="首页首屏按钮（固定视频）" description="首页最上方只播放固定视频，不再读取后台图片或轮播图。" helpText="这里最多管理首屏中间的报价按钮文案和跳转链接。图片、标题、副标题不会再覆盖首页视频，避免前后台逻辑冲突。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/hero_slides">管理首屏按钮文案</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="/zh" target="_blank" rel="noreferrer">
                  预览首页（中文）
                </a>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <AdminFormSection
            title="统计数据"
            description="用于首页统计模块。这里保存后，前台统计数据优先读取后台内容。"
            helpText="管理首页统计数字和说明，例如服务范围、地区、信任背书等。保存后首页统计模块会同步更新。"
          >
            <HomeSectionItemsEditor
              label="统计项目"
              helpText="每一条统计都会显示成首页统计卡片，可以设置图标、数字、标题和说明。"
              variant="stats"
              value={statsItems}
              onChange={(value) => {
                markDirty();
                setStatsItems(value);
              }}
            />

            <div className="mt-4 flex gap-2">
              <Button onClick={() => void saveHomeSectionItems(statsSection, statsItems)}>保存</Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="why" className="space-y-6">
          <AdminFormSection
            title="为什么选择我们"
            description="用于首页优势模块。这里保存后，前台为什么选择我们模块优先读取后台内容。"
            helpText="管理首页优势卖点卡片。每一条都是前台首页的一个优势说明。"
          >
            <HomeSectionItemsEditor
              label="优势项目"
              helpText="每一条优势都会显示成首页优势卡片，可以设置图标、标题和说明。"
              variant="why"
              value={whyItems}
              onChange={(value) => {
                markDirty();
                setWhyItems(value);
              }}
            />

            <div className="mt-4 flex gap-2">
              <Button onClick={() => void saveHomeSectionItems(whySection, whyItems)}>保存</Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <AdminFormSection title="施工流程" description="用于首页流程模块与流程页。" helpText="管理施工流程步骤。保存后首页流程模块和流程页步骤列表都会读取这里。">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() =>
                  setEditingStep({
                    step_number: processSteps.length + 1,
                    title_zh: "",
                    title_en: "",
                    description_zh: "",
                    description_en: "",
                    icon_key: "",
                    status: "published",
                    sort_order: processSteps.length,
                  })
                }
              >
                添加步骤
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {processSteps.map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        #{s.step_number} · {s.title_zh || s.title_en || "(未命名)"}{" "}
                        <span className="text-xs text-muted-foreground">({adminStatusLabel("default", s.status || "published")})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">排序：{s.sort_order ?? 0} · 图标代号：{s.icon_key || "-"}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingStep(s)}>
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteProcessStep(String(s.id))}>
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {processSteps.length === 0 && <div className="text-sm text-muted-foreground">暂无步骤。添加后首页流程模块将优先显示后台数据。</div>}
            </div>
          </AdminFormSection>

          {editingStep && (
            <AdminFormSection title="编辑步骤" description="保存后会立刻影响首页流程模块。" helpText="填写步骤编号、标题、说明、图标和状态。只有已发布内容会在前台显示。">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("step_number")}</label>
                  <Input
                    type="number"
                    value={editingStep.step_number}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, step_number: Number(e.target.value || 0) } : v))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("sort_order")}</label>
                  <Input
                    type="number"
                    value={editingStep.sort_order ?? 0}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, sort_order: Number(e.target.value || 0) } : v))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("title_zh")}</label>
                  <Input value={editingStep.title_zh || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, title_zh: e.target.value } : v))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("title_en")}</label>
                  <Input value={editingStep.title_en || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, title_en: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{L("description_zh")}</label>
                  <Textarea rows={3} value={editingStep.description_zh || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, description_zh: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{L("description_en")}</label>
                  <Textarea rows={3} value={editingStep.description_en || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, description_en: e.target.value } : v))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("icon_key")}</label>
                  <Input value={editingStep.icon_key || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, icon_key: e.target.value } : v))} placeholder="可选，例如 ruler / message-circle" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("status")}</label>
                  <select
                    value={editingStep.status || "published"}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, status: e.target.value as any } : v))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {publishStatusOptions().map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void upsertProcessStep(editingStep)}>保存</Button>
                <Button variant="outline" onClick={() => setEditingStep(null)}>
                  取消
                </Button>
              </div>
            </AdminFormSection>
          )}
        </TabsContent>

        <TabsContent value="beforeAfter" className="space-y-6">
          <AdminFormSection title="改造前后" description="用于首页改造前后展示区块。" helpText="管理首页改造前/改造后对比内容，通常用于展示施工效果。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/before-after">管理改造前后</Link>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-6">
          <AdminFormSection title="客户评价" description="用于首页客户评价模块。" helpText="管理首页客户评价内容，发布后的评价会显示在前台首页。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/testimonials">管理客户评价</Link>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <AdminFormSection title="首页常见问题" description="用于首页常见问题模块。" helpText="管理首页底部常见问题。这里只影响首页常见问题模块。">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() =>
                  setEditingFaq({
                    page_key: "home",
                    question_zh: "",
                    answer_zh: "",
                    question_en: "",
                    answer_en: "",
                    status: "published",
                    sort_order: faqRows.length,
                  })
                }
              >
                新建问题
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {faqRows.map((f) => (
                <div key={f.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{f.question_zh || f.question_en || "(未填写问题)"}</div>
                      <div className="text-xs text-muted-foreground">
                        排序：{f.sort_order ?? 0} · 状态：{adminStatusLabel("default", f.status || "published")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingFaq(f)}>
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteFaq(String(f.id))}>
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {faqRows.length === 0 && <div className="text-sm text-muted-foreground">暂无常见问题。添加后首页模块将优先显示后台数据。</div>}
            </div>
          </AdminFormSection>

          {editingFaq && (
            <AdminFormSection title="编辑常见问题" description="中文优先；英文可为空，前台会自动回退。" helpText="填写问题、答案、排序和状态。英文没填时英文前台会回退显示中文。">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("sort_order")}</label>
                  <Input
                    type="number"
                    value={editingFaq.sort_order ?? 0}
                    onChange={(e) => setEditingFaq((v) => (v ? { ...v, sort_order: Number(e.target.value || 0) } : v))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("status")}</label>
                  <select
                    value={editingFaq.status || "published"}
                    onChange={(e) => setEditingFaq((v) => (v ? { ...v, status: e.target.value as any } : v))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {publishStatusOptions().map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{L("question_zh")}</label>
                  <Textarea rows={2} value={editingFaq.question_zh || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, question_zh: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{L("answer_zh")}</label>
                  <Textarea rows={4} value={editingFaq.answer_zh || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, answer_zh: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{L("question_en")}</label>
                  <Textarea rows={2} value={editingFaq.question_en || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, question_en: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">{L("answer_en")}</label>
                  <Textarea rows={4} value={editingFaq.answer_en || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, answer_en: e.target.value } : v))} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void upsertFaq(editingFaq)}>保存</Button>
                <Button variant="outline" onClick={() => setEditingFaq(null)}>
                  取消
                </Button>
              </div>
            </AdminFormSection>
          )}
        </TabsContent>

        <TabsContent value="cta" className="space-y-6">
          <AdminFormSection title="首页行动引导" description="用于首页行动引导模块。" helpText="管理首页底部联系/报价引导区，包括标题、说明、按钮文字、按钮链接和图片。">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">状态</label>
                <select
                  value={(editingCta || ctaDraft).status || "published"}
                  onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), status: e.target.value as any }))}
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
                <label className="mb-1 block text-sm font-medium">{L("title_zh")}</label>
                <Input value={(editingCta || ctaDraft).title_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), title_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("title_en")}</label>
                <Input value={(editingCta || ctaDraft).title_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), title_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("description_zh")}</label>
                <Textarea rows={3} value={(editingCta || ctaDraft).description_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), description_zh: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("description_en")}</label>
                <Textarea rows={3} value={(editingCta || ctaDraft).description_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), description_en: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">{L("primary_label_zh")}</label>
                <Input value={(editingCta || ctaDraft).primary_label_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("primary_label_en")}</label>
                <Input value={(editingCta || ctaDraft).primary_label_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("primary_url")}</label>
                <Input value={(editingCta || ctaDraft).primary_url || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_url: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">{L("secondary_label_zh")}</label>
                <Input value={(editingCta || ctaDraft).secondary_label_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("secondary_label_en")}</label>
                <Input value={(editingCta || ctaDraft).secondary_label_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("secondary_url")}</label>
                <Input value={(editingCta || ctaDraft).secondary_url || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_url: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <ImageField
                  label="图片地址（可选）"
                  value={(editingCta || ctaDraft).image_url || ""}
                  onChange={(url) => setEditingCta((v) => ({ ...(v || ctaDraft), image_url: url }))}
                  folder="cta_blocks"
                  usageType="hero"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => void upsertCta(editingCta || ctaDraft)}>保存</Button>
            </div>
          </AdminFormSection>
        </TabsContent>
      </Tabs>
    </>
  );
}
