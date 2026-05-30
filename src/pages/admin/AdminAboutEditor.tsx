import { useEffect, useMemo, useRef, useState } from "react";
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
import { AboutSectionItemsEditor } from "@/components/admin/StructuredArrayEditors";
import { invalidatePublishedContent } from "@/lib/adminInvalidate";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { aboutSectionKeys, type AboutSectionKey, type AboutSectionRow, type CtaRow } from "@/lib/adminEditorData";
import { useAdminAboutEditorData } from "@/lib/adminQueries";
import { translateFieldLabel } from "@/i18n/displayLabels";
import { getAdminLang, publishStatusOptions } from "@/lib/adminLocale";

const L = (field: string) => translateFieldLabel(field, getAdminLang());

const sectionKeys = aboutSectionKeys;
type SectionKey = AboutSectionKey;

const sectionTabLabels: Record<SectionKey, string> = {
  hero: "首屏",
  intro: "公司介绍",
  stats: "统计数据",
  core_values: "核心价值",
  team: "团队亮点",
  milestones: "公司历程",
  office: "办公环境",
};

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : []);

const cleanAboutItems = (sectionKey: string, value: unknown[]) => {
  const items = asArray(value);
  if (sectionKey === "intro") {
    return items
      .map((item: any) => String(typeof item === "string" ? item : item?.title || ""))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (sectionKey === "stats") {
    return items
      .map((item: any) => ({
        value: String(item?.value || "").trim(),
        label: String(item?.label || item?.label_zh || item?.label_en || "").trim(),
        icon: String(item?.icon || "").trim(),
      }))
      .filter((item) => item.value && item.label);
  }
  if (sectionKey === "milestones") {
    return items
      .map((item: any) => ({
        year: String(item?.year || "").trim(),
        title: String(item?.title || "").trim(),
        desc: String(item?.desc || "").trim(),
      }))
      .filter((item) => item.year && item.title && item.desc);
  }
  if (sectionKey === "core_values" || sectionKey === "team") {
    return items
      .map((item: any) => ({
        title: String(item?.title || item?.title_zh || item?.title_en || "").trim(),
        desc: String(item?.desc || item?.desc_zh || item?.desc_en || "").trim(),
        icon: String(item?.icon || "").trim(),
      }))
      .filter((item) => item.title && item.desc);
  }
  return [];
};

export default function AdminAboutEditor() {
  const queryClient = useQueryClient();
  const { data: bundle, isFetching, refetch } = useAdminAboutEditorData();
  const [activeTab, setActiveTab] = useState<SectionKey | "cta">("hero");
  const loading = isFetching;

  const [sections, setSections] = useState<Record<string, AboutSectionRow | null>>({});
  const [itemsZh, setItemsZh] = useState<Record<string, any[]>>({});
  const [itemsEn, setItemsEn] = useState<Record<string, any[]>>({});

  const [ctaBlock, setCtaBlock] = useState<CtaRow | null>(null);
  const [editingCta, setEditingCta] = useState<CtaRow | null>(null);
  const formDirtyRef = useRef(false);
  const [formDirty, setFormDirty] = useState(false);

  const markDirty = () => {
    formDirtyRef.current = true;
    setFormDirty(true);
  };
  useUnsavedChangesWarning(formDirty);

  const touchEditingCta: typeof setEditingCta = (value) => {
    markDirty();
    setEditingCta(value);
  };

  useEffect(() => {
    if (!bundle) return;
    if (formDirtyRef.current) return;
    setSections(bundle.sections);
    const zh: Record<string, any[]> = {};
    const en: Record<string, any[]> = {};
    sectionKeys.forEach((key) => {
      zh[key] = asArray(bundle.sections[key]?.items_zh);
      en[key] = asArray(bundle.sections[key]?.items_en);
    });
    setItemsZh(zh);
    setItemsEn(en);
    setCtaBlock(bundle.ctaBlock);
  }, [bundle]);

  const refreshEditor = async () => {
    formDirtyRef.current = false;
    setFormDirty(false);
    void invalidatePublishedContent(queryClient);
    await refetch();
  };

  const updateSection = (key: string, patch: Partial<AboutSectionRow>) => {
    markDirty();
    setSections((prev) => ({ ...prev, [key]: { ...(prev[key] || ({ section_key: key } as any)), ...patch } }));
  };

  const saveSection = async (key: string) => {
    if (!supabase) return;
    const row = sections[key];
    if (!row) {
      toast({
        title: "无法保存",
        description: "区块数据还没有加载出来，请先刷新页面后再试。",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = {
        section_key: key,
        title_zh: row.title_zh || null,
        title_en: row.title_en || null,
        subtitle_zh: row.subtitle_zh || null,
        subtitle_en: row.subtitle_en || null,
        content_zh: row.content_zh || null,
        content_en: row.content_en || null,
        image_url: row.image_url || null,
        items_zh: cleanAboutItems(key, itemsZh[key] || []),
        items_en: cleanAboutItems(key, itemsEn[key] || []),
        status: row.status || "published",
        sort_order: Number(row.sort_order || 0),
      };
      await saveAdminRecord({
        table: "about_sections",
        payload,
        id: row.id,
        expectedUpdatedAt: row.updated_at || null,
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
        secondary_label_zh: "WhatsApp 联系",
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
    try {
      await saveAdminRecord({
        table: "cta_blocks",
        payload,
        id: ctaDraft.id,
        expectedUpdatedAt: ctaDraft.updated_at || null,
        queryClient,
      });
    } catch (error) {
      toast({ title: "\u4fdd\u5b58\u5931\u8d25", description: formatAdminMutationError(error), variant: "destructive" });
      return;
    }

    toast({ title: "已保存" });
    void invalidatePublishedContent(queryClient);
    setEditingCta(null);
    await refreshEditor();
  };

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title="Supabase 未配置" description="配置完成后，才能使用关于我们后台管理。" />;
  }

  return (
    <>
      <AdminPageHeader
        title="关于我们管理"
        description="管理关于我们页面的首屏、介绍、统计、价值观、团队、历程、办公环境和行动引导区。前台会优先读取已发布内容，留空时自动使用静态默认内容。"
        helpText="这里主要编辑关于我们页面的各个区块和底部行动引导。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={loading}>
              {loading ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild variant="outline">
              <a href="/zh/about" target="_blank" rel="noreferrer">
                预览中文页
              </a>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="mb-4 overflow-auto">
          <TabsList className="w-max">
            {sectionKeys.map((key) => (
              <TabsTrigger key={key} value={key}>
                {sectionTabLabels[key]}
              </TabsTrigger>
            ))}
            <TabsTrigger value="cta">行动引导区</TabsTrigger>
          </TabsList>
        </div>

        {sectionKeys.map((key) => {
          const row = sections[key];
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <AdminFormSection
                title={`关于我们区块：${sectionTabLabels[key]}`}
                description="中文和英文可以分开编辑，列表、卡片、标签等内容可以直接添加、删除和排序。"
                helpText="保存后，对应区块会同步更新到前台关于我们页面。"
              >
                {!row ? (
                  <div className="text-sm text-muted-foreground">加载中...</div>
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
                          {publishStatusOptions().map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">排序</label>
                        <Input
                          type="number"
                          value={row.sort_order ?? 0}
                          onChange={(e) => updateSection(key, { sort_order: Number(e.target.value || 0) })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{L("title_zh")}</label>
                        <Input value={row.title_zh || ""} onChange={(e) => updateSection(key, { title_zh: e.target.value })} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{L("title_en")}</label>
                        <Input value={row.title_en || ""} onChange={(e) => updateSection(key, { title_en: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">{L("subtitle_zh")}</label>
                        <Textarea rows={2} value={row.subtitle_zh || ""} onChange={(e) => updateSection(key, { subtitle_zh: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">{L("subtitle_en")}</label>
                        <Textarea rows={2} value={row.subtitle_en || ""} onChange={(e) => updateSection(key, { subtitle_en: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">{L("content_zh")}</label>
                        <Textarea rows={5} value={row.content_zh || ""} onChange={(e) => updateSection(key, { content_zh: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium">{L("content_en")}</label>
                        <Textarea rows={5} value={row.content_en || ""} onChange={(e) => updateSection(key, { content_en: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <ImageField
                          label="图片地址（可选）"
                          value={row.image_url || ""}
                          onChange={(url) => updateSection(key, { image_url: url })}
                          folder={"about_sections/" + key}
                          usageType="hero"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <AboutSectionItemsEditor
                          label="中文列表 / 卡片内容"
                          helpText="管理当前区块的中文列表或卡片内容，不同区块会按自己的页面样式展示。"
                          sectionKey={key}
                          value={itemsZh[key] || []}
                          onChange={(value) => {
                            markDirty();
                            setItemsZh((prev) => ({ ...prev, [key]: value }));
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <AboutSectionItemsEditor
                          label="英文列表 / 卡片内容"
                          helpText="管理当前区块的英文列表或卡片内容。英文为空时，英文站可能显示空内容或最后兜底内容。"
                          sectionKey={key}
                          value={itemsEn[key] || []}
                          onChange={(value) => {
                            markDirty();
                            setItemsEn((prev) => ({ ...prev, [key]: value }));
                          }}
                        />
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
          <AdminFormSection
            title="关于我们行动引导区"
            description="用于关于我们页面底部的行动引导区域。"
            helpText="管理底部联系和报价引导区，包含标题、说明、按钮和图片。"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">状态</label>
                <select
                  value={ctaDraft.status || "published"}
                  onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), status: e.target.value as any }))}
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
                <Input value={ctaDraft.title_zh || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), title_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("title_en")}</label>
                <Input value={ctaDraft.title_en || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), title_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("description_zh")}</label>
                <Textarea rows={3} value={ctaDraft.description_zh || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), description_zh: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("description_en")}</label>
                <Textarea rows={3} value={ctaDraft.description_en || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), description_en: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("primary_label_zh")}</label>
                <Input value={ctaDraft.primary_label_zh || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), primary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("primary_label_en")}</label>
                <Input value={ctaDraft.primary_label_en || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), primary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("primary_url")}</label>
                <Input value={ctaDraft.primary_url || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), primary_url: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("secondary_label_zh")}</label>
                <Input value={ctaDraft.secondary_label_zh || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_zh: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{L("secondary_label_en")}</label>
                <Input value={ctaDraft.secondary_label_en || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), secondary_label_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{L("secondary_url")}</label>
                <Input value={ctaDraft.secondary_url || ""} onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), secondary_url: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <ImageField
                  label="图片地址（可选）"
                  value={ctaDraft.image_url || ""}
                  onChange={(url) => touchEditingCta((v) => ({ ...(v || ctaDraft), image_url: url }))}
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
