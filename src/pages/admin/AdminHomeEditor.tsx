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
import { invalidatePublishedContent } from "@/lib/adminInvalidate";
import type { CtaRow, FaqRow, HomeSectionRow, ProcessStepRow } from "@/lib/adminEditorData";
import { useAdminHomeEditorData } from "@/lib/adminQueries";
import { translateFieldLabel } from "@/i18n/displayLabels";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";

const L = (field: string) => translateFieldLabel(field, getAdminLang());

const safeJsonParse = (value: string) => {
  const raw = value.trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return parsed;
};

const jsonStringify = (value: any) => JSON.stringify(value ?? [], null, 2);

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

  const [statsItemsZh, setStatsItemsZh] = useState("");
  const [statsItemsEn, setStatsItemsEn] = useState("");
  const [whyItemsZh, setWhyItemsZh] = useState("");
  const [whyItemsEn, setWhyItemsEn] = useState("");
  const formDirtyRef = useRef(false);

  const markDirty = () => {
    formDirtyRef.current = true;
  };

  useEffect(() => {
    if (!bundle) return;
    if (formDirtyRef.current) return;
    setStatsSection(bundle.stats);
    setWhySection(bundle.why);
    setProcessSteps(bundle.processSteps);
    setFaqRows(bundle.faqRows);
    setCtaBlock(bundle.ctaBlock);
    if (bundle.stats) {
      setStatsItemsZh(jsonStringify(bundle.stats.items_zh || []));
      setStatsItemsEn(jsonStringify(bundle.stats.items_en || []));
    }
    if (bundle.why) {
      setWhyItemsZh(jsonStringify(bundle.why.items_zh || []));
      setWhyItemsEn(jsonStringify(bundle.why.items_en || []));
    }
  }, [bundle]);

  const refreshEditor = async () => {
    formDirtyRef.current = false;
    void invalidatePublishedContent(queryClient);
    await refetch();
  };

  const saveHomeSectionItems = async (row: HomeSectionRow | null, items_zh: string, items_en: string) => {
    if (!supabase) return;
    if (!row?.id) {
      toast({ title: "无法保存", description: "首页模块数据尚未加载，请刷新页面后重试。", variant: "destructive" });
      return;
    }
    try {
      const parsedZh = safeJsonParse(items_zh);
      const parsedEn = safeJsonParse(items_en);
      const { error } = await supabase
        .from("home_sections")
        .update({ items_zh: parsedZh, items_en: parsedEn })
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: "已保存" });
      await refreshEditor();
    } catch (e: any) {
      toast({ title: "保存失败（JSON 格式错误）", description: e?.message || String(e), variant: "destructive" });
    }
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
    const req = draft.id
      ? supabase.from("process_steps").update(payload).eq("id", draft.id)
      : supabase.from("process_steps").insert(payload);
    const { error } = await req;
    if (error) toast({ title: "保存失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已保存" });
      await refreshEditor();
    }
  };

  const deleteProcessStep = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("process_steps").delete().eq("id", id);
    if (error) toast({ title: "删除失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已删除" });
      await refreshEditor();
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
    const req = draft.id ? supabase.from("faqs").update(payload).eq("id", draft.id) : supabase.from("faqs").insert(payload);
    const { error } = await req;
    if (error) toast({ title: "保存失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已保存" });
      await refreshEditor();
    }
  };

  const deleteFaq = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast({ title: "删除失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已删除" });
      await refreshEditor();
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

    const req = draft.id ? supabase.from("cta_blocks").update(payload).eq("id", draft.id) : supabase.from("cta_blocks").insert(payload);
    const { error } = await req;
    if (error) toast({ title: "保存失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已保存" });
      await refreshEditor();
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
        description="这里管理首页关键区块：统计数据、为什么选择我们、施工流程、首页 FAQ、首页 CTA。首屏、客户评价、改造前后可通过对应入口管理。"
        actions={
          <Button variant="outline" onClick={() => void refetch()} disabled={loading}>
            {loading ? "刷新中..." : "刷新"}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-4 overflow-auto">
          <TabsList className="w-max">
            <TabsTrigger value="hero">首屏 Hero</TabsTrigger>
            <TabsTrigger value="stats">统计数据</TabsTrigger>
            <TabsTrigger value="why">为什么选择我们</TabsTrigger>
            <TabsTrigger value="process">施工流程</TabsTrigger>
            <TabsTrigger value="beforeAfter">改造前后</TabsTrigger>
            <TabsTrigger value="testimonials">客户评价</TabsTrigger>
            <TabsTrigger value="faq">首页 FAQ</TabsTrigger>
            <TabsTrigger value="cta">首页 CTA</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hero" className="space-y-6">
          <AdminFormSection title="首屏 Hero（hero_slides）" description="首页首屏当前展示第一条已发布幻灯片。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/hero_slides">管理首屏轮播</Link>
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
            title="统计数据（home_sections: stats）"
            description="用于首页 StatsSection。items_zh/items_en 为 JSON 数组。"
          >
            <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-1">items 示例</div>
              <pre className="whitespace-pre-wrap">{`[
  { "value": "200+", "label_zh": "完成项目", "label_en": "Completed Projects", "desc_zh": "…", "desc_en": "…", "icon": "star" }
]`}</pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">{L("items_zh")}</label>
                <Textarea rows={12} value={statsItemsZh} onChange={(e) => { markDirty(); setStatsItemsZh(e.target.value); }} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("items_en")}</label>
                <Textarea rows={12} value={statsItemsEn} onChange={(e) => { markDirty(); setStatsItemsEn(e.target.value); }} />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => void saveHomeSectionItems(statsSection, statsItemsZh, statsItemsEn)}>保存</Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="why" className="space-y-6">
          <AdminFormSection
            title="为什么选择我们（home_sections: why_choose_us）"
            description="用于首页 WhyChooseUsSection。items_zh/items_en 为 JSON 数组，支持 icon key。"
          >
            <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-1">items 示例</div>
              <pre className="whitespace-pre-wrap">{`[
  { "title_zh": "设计规划", "title_en": "Design Planning", "desc_zh": "…", "desc_en": "…", "icon": "paintbrush" }
]`}</pre>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">{L("items_zh")}</label>
                <Textarea rows={12} value={whyItemsZh} onChange={(e) => setWhyItemsZh(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("items_en")}</label>
                <Textarea rows={12} value={whyItemsEn} onChange={(e) => { markDirty(); setWhyItemsEn(e.target.value); }} />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={() => void saveHomeSectionItems(whySection, whyItemsZh, whyItemsEn)}>保存</Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <AdminFormSection title="施工流程（process_steps）" description="用于首页 ProcessSection 与流程页（后续会接入）。">
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
                        <span className="text-xs text-muted-foreground">({s.status || "published"})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">sort_order: {s.sort_order ?? 0} · icon: {s.icon_key || "—"}</div>
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
            <AdminFormSection title="编辑步骤" description="保存后立即影响首页流程模块。">
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
                  <Input value={editingStep.icon_key || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, icon_key: e.target.value } : v))} placeholder="可选，例如：ruler / message-circle" />
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
          <AdminFormSection title="改造前后（before_after_items）" description="用于首页改造前后展示区块。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/before-after">管理改造前后</Link>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-6">
          <AdminFormSection title="客户评价（testimonials）" description="用于首页 TestimonialsSection。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/testimonials">管理客户评价</Link>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <AdminFormSection title="首页 FAQ（faqs page_key='home'）" description="用于首页 HomeFAQSection。">
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
              {faqRows.length === 0 && <div className="text-sm text-muted-foreground">暂无 FAQ。添加后首页 FAQ 将优先显示后台数据。</div>}
            </div>
          </AdminFormSection>

          {editingFaq && (
            <AdminFormSection title="编辑 FAQ" description="中文优先；英文可为空，前台会 fallback。">
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
          <AdminFormSection title="首页 CTA（cta_blocks: home_final）" description="用于首页 CTASection。">
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
                  label="image_url（可选）"
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

