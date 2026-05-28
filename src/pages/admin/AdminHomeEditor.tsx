import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import ImageField from "@/components/admin/ImageField";

type HomeSectionRow = {
  id?: string;
  section_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  subtitle_zh?: string | null;
  subtitle_en?: string | null;
  content_zh?: string | null;
  content_en?: string | null;
  image_url?: string | null;
  items_zh?: any;
  items_en?: any;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

type ProcessStepRow = {
  id?: string;
  step_number: number;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
  icon_key?: string | null;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

type FaqRow = {
  id?: string;
  page_key: string;
  question_zh?: string | null;
  answer_zh?: string | null;
  question_en?: string | null;
  answer_en?: string | null;
  status?: "draft" | "published" | "archived";
  sort_order?: number;
};

type CtaRow = {
  id?: string;
  block_key: string;
  title_zh?: string | null;
  title_en?: string | null;
  description_zh?: string | null;
  description_en?: string | null;
  primary_label_zh?: string | null;
  primary_label_en?: string | null;
  primary_url?: string | null;
  secondary_label_zh?: string | null;
  secondary_label_en?: string | null;
  secondary_url?: string | null;
  image_url?: string | null;
  status?: "draft" | "published" | "archived";
};

const statusOptions = ["published", "draft", "archived"] as const;

const safeJsonParse = (value: string) => {
  const raw = value.trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return parsed;
};

const jsonStringify = (value: any) => JSON.stringify(value ?? [], null, 2);

const ensureHomeSection = async (section_key: string): Promise<HomeSectionRow | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase.from("home_sections").select("*").eq("section_key", section_key).order("sort_order").limit(1);
  if (error) return null;
  const row = (data || [])[0];
  if (row) return row as any;
  const { data: inserted, error: insertError } = await supabase
    .from("home_sections")
    .insert({ section_key, status: "published", sort_order: 0 })
    .select("*")
    .single();
  if (insertError) return null;
  return inserted as any;
};

export default function AdminHomeEditor() {
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(false);

  const [statsSection, setStatsSection] = useState<HomeSectionRow | null>(null);
  const [whySection, setWhySection] = useState<HomeSectionRow | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStepRow[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([]);
  const [ctaBlock, setCtaBlock] = useState<CtaRow | null>(null);

  const [statsItemsZh, setStatsItemsZh] = useState("");
  const [statsItemsEn, setStatsItemsEn] = useState("");
  const [whyItemsZh, setWhyItemsZh] = useState("");
  const [whyItemsEn, setWhyItemsEn] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);

    const [stats, why, steps, faqs, cta] = await Promise.all([
      ensureHomeSection("stats"),
      ensureHomeSection("why_choose_us"),
      supabase.from("process_steps").select("*").order("sort_order").order("step_number"),
      supabase.from("faqs").select("*").eq("page_key", "home").order("sort_order"),
      supabase.from("cta_blocks").select("*").eq("block_key", "home_final").maybeSingle(),
    ]);

    setStatsSection(stats);
    setWhySection(why);
    setProcessSteps(((steps as any).data || []) as any);
    setFaqRows(((faqs as any).data || []) as any);
    setCtaBlock(((cta as any).data || null) as any);

    if (stats) {
      setStatsItemsZh(jsonStringify((stats as any).items_zh || []));
      setStatsItemsEn(jsonStringify((stats as any).items_en || []));
    }
    if (why) {
      setWhyItemsZh(jsonStringify((why as any).items_zh || []));
      setWhyItemsEn(jsonStringify((why as any).items_en || []));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveHomeSectionItems = async (row: HomeSectionRow | null, items_zh: string, items_en: string) => {
    if (!row?.id || !supabase) return;
    try {
      const parsedZh = safeJsonParse(items_zh);
      const parsedEn = safeJsonParse(items_en);
      const { error } = await supabase
        .from("home_sections")
        .update({ items_zh: parsedZh, items_en: parsedEn })
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: "已保存" });
      await load();
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
      await load();
    }
  };

  const deleteProcessStep = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("process_steps").delete().eq("id", id);
    if (error) toast({ title: "删除失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已删除" });
      await load();
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
      await load();
    }
  };

  const deleteFaq = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) toast({ title: "删除失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已删除" });
      await load();
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
      await load();
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
    return (
      <AdminLayout>
        <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用首页后台管理。" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="首页管理"
        description="这里管理首页关键区块：统计数据 / 为什么选择我们 / 施工流程 / 首页 FAQ / 首页 CTA。Hero、客户评价、Before/After 可通过对应入口管理。"
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
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
            <TabsTrigger value="beforeAfter">Before/After</TabsTrigger>
            <TabsTrigger value="testimonials">客户评价</TabsTrigger>
            <TabsTrigger value="faq">首页 FAQ</TabsTrigger>
            <TabsTrigger value="cta">首页 CTA</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hero" className="space-y-6">
          <AdminFormSection title="首屏 Hero（hero_slides）" description="首页首屏当前展示第一条已发布幻灯片。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/hero_slides">管理 Hero Slides</Link>
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
                <label className="mb-1 block text-sm font-medium">items_zh</label>
                <Textarea rows={12} value={statsItemsZh} onChange={(e) => setStatsItemsZh(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">items_en</label>
                <Textarea rows={12} value={statsItemsEn} onChange={(e) => setStatsItemsEn(e.target.value)} />
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
                <label className="mb-1 block text-sm font-medium">items_zh</label>
                <Textarea rows={12} value={whyItemsZh} onChange={(e) => setWhyItemsZh(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">items_en</label>
                <Textarea rows={12} value={whyItemsEn} onChange={(e) => setWhyItemsEn(e.target.value)} />
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
                  <label className="mb-1 block text-sm font-medium">step_number</label>
                  <Input
                    type="number"
                    value={editingStep.step_number}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, step_number: Number(e.target.value || 0) } : v))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">sort_order</label>
                  <Input
                    type="number"
                    value={editingStep.sort_order ?? 0}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, sort_order: Number(e.target.value || 0) } : v))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">title_zh</label>
                  <Input value={editingStep.title_zh || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, title_zh: e.target.value } : v))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">title_en</label>
                  <Input value={editingStep.title_en || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, title_en: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">description_zh</label>
                  <Textarea rows={3} value={editingStep.description_zh || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, description_zh: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">description_en</label>
                  <Textarea rows={3} value={editingStep.description_en || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, description_en: e.target.value } : v))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">icon_key</label>
                  <Input value={editingStep.icon_key || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, icon_key: e.target.value } : v))} placeholder="可选，例如：ruler / message-circle" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">status</label>
                  <select
                    value={editingStep.status || "published"}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, status: e.target.value as any } : v))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
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
          <AdminFormSection title="Before / After（before_after_items）" description="用于首页 BeforeAfterSection。">
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/before-after">管理 Before / After</Link>
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
                      <div className="text-xs text-muted-foreground">sort_order: {f.sort_order ?? 0} · status: {f.status || "published"}</div>
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
                  <label className="mb-1 block text-sm font-medium">sort_order</label>
                  <Input
                    type="number"
                    value={editingFaq.sort_order ?? 0}
                    onChange={(e) => setEditingFaq((v) => (v ? { ...v, sort_order: Number(e.target.value || 0) } : v))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">status</label>
                  <select
                    value={editingFaq.status || "published"}
                    onChange={(e) => setEditingFaq((v) => (v ? { ...v, status: e.target.value as any } : v))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">question_zh</label>
                  <Textarea rows={2} value={editingFaq.question_zh || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, question_zh: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">answer_zh</label>
                  <Textarea rows={4} value={editingFaq.answer_zh || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, answer_zh: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">question_en</label>
                  <Textarea rows={2} value={editingFaq.question_en || ""} onChange={(e) => setEditingFaq((v) => (v ? { ...v, question_en: e.target.value } : v))} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">answer_en</label>
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
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">title_zh</label>
                <Input value={(editingCta || ctaDraft).title_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), title_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">title_en</label>
                <Input value={(editingCta || ctaDraft).title_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), title_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">description_zh</label>
                <Textarea rows={3} value={(editingCta || ctaDraft).description_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), description_zh: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">description_en</label>
                <Textarea rows={3} value={(editingCta || ctaDraft).description_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), description_en: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">primary_label_zh</label>
                <Input value={(editingCta || ctaDraft).primary_label_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">primary_label_en</label>
                <Input value={(editingCta || ctaDraft).primary_label_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">primary_url</label>
                <Input value={(editingCta || ctaDraft).primary_url || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_url: e.target.value }))} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">secondary_label_zh</label>
                <Input value={(editingCta || ctaDraft).secondary_label_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">secondary_label_en</label>
                <Input value={(editingCta || ctaDraft).secondary_label_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">secondary_url</label>
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
    </AdminLayout>
  );
}

