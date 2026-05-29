import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { aboutSectionKeys, type AboutSectionKey, type AboutSectionRow, type CtaRow } from "@/lib/adminEditorData";
import { useAdminAboutEditorData } from "@/lib/adminQueries";

const sectionKeys = aboutSectionKeys;
type SectionKey = AboutSectionKey;

const statusOptions = ["published", "draft", "archived"] as const;

const jsonStringify = (value: any) => JSON.stringify(value ?? [], null, 2);
const safeJsonParse = (value: string) => {
  const raw = value.trim();
  if (!raw) return [];
  return JSON.parse(raw);
};

export default function AdminAboutEditor() {
  const queryClient = useQueryClient();
  const { data: bundle, isFetching, refetch } = useAdminAboutEditorData();
  const [activeTab, setActiveTab] = useState<SectionKey | "cta">("hero");
  const loading = isFetching;

  const [sections, setSections] = useState<Record<string, AboutSectionRow | null>>({});
  const [itemsZh, setItemsZh] = useState<Record<string, string>>({});
  const [itemsEn, setItemsEn] = useState<Record<string, string>>({});

  const [ctaBlock, setCtaBlock] = useState<CtaRow | null>(null);
  const [editingCta, setEditingCta] = useState<CtaRow | null>(null);

  useEffect(() => {
    if (!bundle) return;
    setSections(bundle.sections);
    const zh: Record<string, string> = {};
    const en: Record<string, string> = {};
    sectionKeys.forEach((key) => {
      zh[key] = jsonStringify(bundle.sections[key]?.items_zh || []);
      en[key] = jsonStringify(bundle.sections[key]?.items_en || []);
    });
    setItemsZh(zh);
    setItemsEn(en);
    setCtaBlock(bundle.ctaBlock);
  }, [bundle]);

  const refreshEditor = async () => {
    void invalidatePublishedContent(queryClient);
    await refetch();
  };

  const updateSection = (key: string, patch: Partial<AboutSectionRow>) =>
    setSections((prev) => ({ ...prev, [key]: { ...(prev[key] || ({ section_key: key } as any)), ...patch } }));

  const saveSection = async (key: string) => {
    if (!supabase) return;
    const row = sections[key];
    if (!row) return;

    try {
      const parsedZh = safeJsonParse(itemsZh[key] || "[]");
      const parsedEn = safeJsonParse(itemsEn[key] || "[]");
      const payload: any = {
        section_key: key,
        title_zh: row.title_zh || null,
        title_en: row.title_en || null,
        subtitle_zh: row.subtitle_zh || null,
        subtitle_en: row.subtitle_en || null,
        content_zh: row.content_zh || null,
        content_en: row.content_en || null,
        image_url: row.image_url || null,
        items_zh: parsedZh,
        items_en: parsedEn,
        status: row.status || "published",
        sort_order: Number(row.sort_order || 0),
      };
      const req = row.id ? supabase.from("about_sections").update(payload).eq("id", row.id) : supabase.from("about_sections").insert(payload);
      const { error } = await req;
      if (error) throw error;
      toast({ title: "已保存" });
      await refreshEditor();
    } catch (e: any) {
      toast({ title: "保存失败（JSON 格式错误）", description: e?.message || String(e), variant: "destructive" });
    }
  };

  const ctaDraft = useMemo<CtaRow>(
    () =>
      editingCta ||
      ctaBlock || {
        block_key: "about_final",
        title_zh: "",
        title_en: "",
        description_zh: "",
        description_en: "",
        primary_label_zh: "获取免费报价",
        primary_label_en: "Get a Free Quote",
        primary_url: "/quote",
        secondary_label_zh: "WhatsApp 咨询",
        secondary_label_en: "WhatsApp Us",
        secondary_url: "",
        image_url: "",
        status: "published",
      },
    [editingCta, ctaBlock],
  );

  const saveCta = async () => {
    if (!supabase) return;
    const payload: any = {
      block_key: "about_final",
      title_zh: ctaDraft.title_zh || null,
      title_en: ctaDraft.title_en || null,
      description_zh: ctaDraft.description_zh || null,
      description_en: ctaDraft.description_en || null,
      primary_label_zh: ctaDraft.primary_label_zh || null,
      primary_label_en: ctaDraft.primary_label_en || null,
      primary_url: ctaDraft.primary_url || null,
      secondary_label_zh: ctaDraft.secondary_label_zh || null,
      secondary_label_en: ctaDraft.secondary_label_en || null,
      secondary_url: ctaDraft.secondary_url || null,
      image_url: ctaDraft.image_url || null,
      status: ctaDraft.status || "published",
    };
    const req = ctaDraft.id ? supabase.from("cta_blocks").update(payload).eq("id", ctaDraft.id) : supabase.from("cta_blocks").insert(payload);
    const { error } = await req;
    if (error) toast({ title: "保存失败", description: error.message, variant: "destructive" });
    else {
      toast({ title: "已保存" });
      void invalidatePublishedContent(queryClient);
      setEditingCta(null);
      await refreshEditor();
    }
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后才能使用关于我们后台管理。" />;
  }

  return (
    <>
    <AdminPageHeader
        title="关于我们管理"
        description="管理关于我们页面的 Hero、介绍、统计、价值观、团队、里程碑、办公室与 CTA。前台会优先读取已发布内容，空则自动 fallback 静态内容。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={loading}>
              {loading ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild variant="outline">
              <a href="/zh/about" target="_blank" rel="noreferrer">
                预览（中文）
              </a>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="mb-4 overflow-auto">
          <TabsList className="w-max">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="intro">公司介绍</TabsTrigger>
            <TabsTrigger value="stats">统计数据</TabsTrigger>
            <TabsTrigger value="core_values">核心价值</TabsTrigger>
            <TabsTrigger value="team">团队亮点</TabsTrigger>
            <TabsTrigger value="milestones">公司历程</TabsTrigger>
            <TabsTrigger value="office">办公室</TabsTrigger>
            <TabsTrigger value="cta">CTA</TabsTrigger>
          </TabsList>
        </div>

        {sectionKeys.map((key) => {
          const row = sections[key];
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <AdminFormSection title={`about_sections: ${key}`} description="中英文可分别编辑；items 为 JSON 数组，用于列表/卡片/标签等。">
                {!row ? (
                  <div className="text-sm text-muted-foreground">加载中…</div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">状态</label>
                        <select
                          value={row.status || "published"}
                          onChange={(e) => updateSection(key, { status: e.target.value as any })}
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
                        <label className="mb-1 block text-sm font-medium">排序 sort_order</label>
                        <Input
                          type="number"
                          value={row.sort_order ?? 0}
                          onChange={(e) => updateSection(key, { sort_order: Number(e.target.value || 0) })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">title_zh</label>
                        <Input value={row.title_zh || ""} onChange={(e) => updateSection(key, { title_zh: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">title_en</label>
                        <Input value={row.title_en || ""} onChange={(e) => updateSection(key, { title_en: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">subtitle_zh</label>
                        <Textarea rows={2} value={row.subtitle_zh || ""} onChange={(e) => updateSection(key, { subtitle_zh: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">subtitle_en</label>
                        <Textarea rows={2} value={row.subtitle_en || ""} onChange={(e) => updateSection(key, { subtitle_en: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">content_zh</label>
                        <Textarea rows={5} value={row.content_zh || ""} onChange={(e) => updateSection(key, { content_zh: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">content_en</label>
                        <Textarea rows={5} value={row.content_en || ""} onChange={(e) => updateSection(key, { content_en: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <ImageField
                          label="image_url（可选）"
                          value={row.image_url || ""}
                          onChange={(url) => updateSection(key, { image_url: url })}
                          folder={`about_sections/${key}`}
                          usageType="hero"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">items_zh（JSON）</label>
                        <Textarea rows={10} value={itemsZh[key] || "[]"} onChange={(e) => setItemsZh((prev) => ({ ...prev, [key]: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">items_en（JSON）</label>
                        <Textarea rows={10} value={itemsEn[key] || "[]"} onChange={(e) => setItemsEn((prev) => ({ ...prev, [key]: e.target.value }))} />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => void saveSection(key)}>保存</Button>
                    </div>
                  </>
                )}
              </AdminFormSection>
            </TabsContent>
          );
        })}

        <TabsContent value="cta" className="space-y-6">
          <AdminFormSection title="关于我们 CTA（cta_blocks: about_final）" description="用于关于我们页面底部 CTA。">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">状态</label>
                <select
                  value={ctaDraft.status || "published"}
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
                <Input value={ctaDraft.title_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), title_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">title_en</label>
                <Input value={ctaDraft.title_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), title_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">description_zh</label>
                <Textarea rows={3} value={ctaDraft.description_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), description_zh: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">description_en</label>
                <Textarea rows={3} value={ctaDraft.description_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), description_en: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">primary_label_zh</label>
                <Input value={ctaDraft.primary_label_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">primary_label_en</label>
                <Input value={ctaDraft.primary_label_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">primary_url</label>
                <Input value={ctaDraft.primary_url || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), primary_url: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">secondary_label_zh</label>
                <Input value={ctaDraft.secondary_label_zh || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">secondary_label_en</label>
                <Input value={ctaDraft.secondary_label_en || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">secondary_url</label>
                <Input value={ctaDraft.secondary_url || ""} onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), secondary_url: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <ImageField
                  label="image_url（可选）"
                  value={ctaDraft.image_url || ""}
                  onChange={(url) => setEditingCta((v) => ({ ...(v || ctaDraft), image_url: url }))}
                  folder="cta_blocks"
                  usageType="hero"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => void saveCta()}>保存</Button>
            </div>
          </AdminFormSection>
        </TabsContent>
      </Tabs>
    </>
  );
}

