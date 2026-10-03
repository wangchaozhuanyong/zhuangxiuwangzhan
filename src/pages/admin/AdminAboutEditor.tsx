import { useAdminFormState } from "@/hooks/useAdminFormState";
import { useSubmissionLock } from "@/hooks/useSubmissionLock";
import { useMemo, useState } from "react";
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
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { aboutSectionKeys, type AboutSectionKey, type AboutSectionRow, type CtaRow } from "@/lib/adminEditorData";
import { useAdminAboutEditorData } from "@/lib/adminCmsQueries";
import { translateFieldLabel } from "@/i18n/displayLabels";
import { adminAboutEditorSectionTabLabels, adminAboutEditorText } from "@/i18n/adminAboutEditorText";
import { getAdminLang, publishStatusOptions } from "@/lib/adminLocale";

const L = (field: string) => translateFieldLabel(field, getAdminLang());

const sectionKeys = aboutSectionKeys;
type SectionKey = AboutSectionKey;

type AdminAboutEditorTextKey = keyof typeof adminAboutEditorText;
const A = (key: AdminAboutEditorTextKey) => adminAboutEditorText[key][getAdminLang()];
const sectionTabLabel = (key: SectionKey) => adminAboutEditorSectionTabLabels[key][getAdminLang()];

type PublishStatus = "draft" | "published" | "archived";
type AboutSectionItem = {
  value?: string;
  label?: string;
  label_zh?: string;
  label_en?: string;
  title?: string;
  title_zh?: string;
  title_en?: string;
  desc?: string;
  desc_zh?: string;
  desc_en?: string;
  year?: string;
  icon?: string;
  [key: string]: unknown;
};

const toPublishStatus = (value: string): PublishStatus =>
  value === "draft" || value === "archived" ? value : "published";
const toTabValue = (value: string): SectionKey | "cta" =>
  value === "cta" || sectionKeys.includes(value as SectionKey) ? (value as SectionKey | "cta") : "hero";
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const toItem = (value: unknown): AboutSectionItem =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as AboutSectionItem) : { title: String(value || "") };

const cleanAboutItems = (sectionKey: string, value: unknown[]) => {
  const items = asArray(value);
  if (sectionKey === "intro") {
    return items
      .map((item) => String(typeof item === "string" ? item : toItem(item).title || ""))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (sectionKey === "stats") {
    return items
      .map((item) => {
        const record = toItem(item);
        return {
          value: String(record.value || "").trim(),
          label: String(record.label || record.label_zh || record.label_en || "").trim(),
          icon: String(record.icon || "").trim(),
        };
      })
      .filter((item) => item.value && item.label);
  }
  if (sectionKey === "milestones") {
    return items
      .map((item) => {
        const record = toItem(item);
        return {
          year: String(record.year || "").trim(),
          title: String(record.title || "").trim(),
          desc: String(record.desc || "").trim(),
        };
      })
      .filter((item) => item.year && item.title && item.desc);
  }
  if (sectionKey === "core_values" || sectionKey === "team") {
    return items
      .map((item) => {
        const record = toItem(item);
        return {
          title: String(record.title || record.title_zh || record.title_en || "").trim(),
          desc: String(record.desc || record.desc_zh || record.desc_en || "").trim(),
          icon: String(record.icon || "").trim(),
        };
      })
      .filter((item) => item.title && item.desc);
  }
  return [];
};

export default function AdminAboutEditor() {
  const { protectSubmission, isSubmitting } = useSubmissionLock();
  const queryClient = useQueryClient();
  const { data: bundle, isFetching, refetch } = useAdminAboutEditorData();
  const [activeTab, setActiveTab] = useState<SectionKey | "cta">("hero");
  const loading = isFetching && !bundle;

  const remoteForm = useMemo(() => {
    const itemsZh: Record<string, AboutSectionItem[]> = {};
    const itemsEn: Record<string, AboutSectionItem[]> = {};
    sectionKeys.forEach((key) => {
      itemsZh[key] = asArray(bundle?.sections[key]?.items_zh).map(toItem);
      itemsEn[key] = asArray(bundle?.sections[key]?.items_en).map(toItem);
    });
    return { sections: bundle?.sections ?? {} as Record<string, AboutSectionRow | null>, itemsZh, itemsEn, ctaBlock: bundle?.ctaBlock ?? null, editingCta: null as CtaRow | null };
  }, [bundle]);
  const { state: form, field, dirty: formDirty, applyPatchRemote } = useAdminFormState(bundle ? remoteForm : undefined, { initial: remoteForm });
  const [sections, setSections] = field("sections");
  const [itemsZh, setItemsZh] = field("itemsZh");
  const [itemsEn, setItemsEn] = field("itemsEn");
  const [ctaBlock] = field("ctaBlock");
  const [editingCta, setEditingCta] = field("editingCta");
  useUnsavedChangesWarning(formDirty || isSubmitting);
  const touchEditingCta: typeof setEditingCta = setEditingCta;

  const updateSection = (key: string, patch: Partial<AboutSectionRow>) => {

    setSections((prev) => ({ ...prev, [key]: { ...(prev[key] || { section_key: key }), ...patch } }));
  };

  const saveSection = protectSubmission("saveSection", async (key: string) => {
    if (!supabase) return;
    const row = sections[key];
    if (!row) {
      toast({
        title: A("saveUnavailable"),
        description: A("sectionDataNotLoaded"),
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: Record<string, unknown> = {
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
      const saved = await saveAdminRecord<AboutSectionRow>({
        table: "about_sections",
        payload,
        id: row.id,
        expectedUpdatedAt: row.updated_at || null,
        queryClient,
      });
      applyPatchRemote({ sections: { [key]: saved }, itemsZh: { [key]: (itemsZh[key] || []) }, itemsEn: { [key]: (itemsEn[key] || []) } }, form);
      toast({ title: A("saved") });

    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
    }
  });

  const ctaDraft = useMemo<CtaRow>(
    () =>
      editingCta ||
      ctaBlock || {
        block_key: "about_final",
        title_zh: "",
        title_en: "",
        description_zh: "",
        description_en: "",
        primary_label_zh: adminAboutEditorText.defaultPrimaryLabel.zh,
        primary_label_en: adminAboutEditorText.defaultPrimaryLabel.en,
        primary_url: "/quote",
        secondary_label_zh: adminAboutEditorText.defaultSecondaryLabel.zh,
        secondary_label_en: adminAboutEditorText.defaultSecondaryLabel.en,
        secondary_url: "",
        image_url: "",
        status: "published",
      },
    [editingCta, ctaBlock],
  );

  const saveCta = protectSubmission("saveCta", async () => {
    if (!supabase) return;
    const payload: Record<string, unknown> = {
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
      const saved = await saveAdminRecord<CtaRow>({
        table: "cta_blocks",
        payload,
        id: ctaDraft.id,
        expectedUpdatedAt: ctaDraft.updated_at || null,
        queryClient,
      });
      applyPatchRemote({ ctaBlock: saved, editingCta: null }, { ctaBlock, editingCta });
    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
      return;
    }

    toast({ title: A("saved") });


  });

  if (!isSupabaseConfigured) {
    return <AdminEmptyState title={A("supabaseNotConfigured")} description={A("supabaseNotConfiguredDescription")} />;
  }

  return (
    <>
      <AdminPageHeader
        title={A("pageTitle")}
        description={A("pageDescription")}
        helpText={A("pageHelpText")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={loading}>
              {loading ? A("refreshing") : A("refresh")}
            </Button>
            <Button asChild variant="outline">
              <a href="/zh/about" target="_blank" rel="noreferrer">
                {A("previewZhPage")}
              </a>
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(toTabValue(v))}>
        <div className="mb-4 overflow-auto">
          <TabsList className="w-max">
            {sectionKeys.map((key) => (
              <TabsTrigger key={key} value={key}>
                {sectionTabLabel(key)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="cta">{A("ctaTab")}</TabsTrigger>
          </TabsList>
        </div>

        {sectionKeys.map((key) => {
          const row = sections[key];
          return (
            <TabsContent key={key} value={key} className="space-y-6">
              <AdminFormSection
                title={A("aboutSectionTitle").replace("{label}", sectionTabLabel(key))}
                description={A("sectionDescription")}
                helpText={A("sectionHelpText")}
              >
                {!row ? (
                  <div className="text-sm text-muted-foreground">{A("loading")}</div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">{A("status")}</label>
                        <select
                          value={row.status || "published"}
                          onChange={(e) => updateSection(key, { status: toPublishStatus(e.target.value) })}
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
                          label={A("optionalImageUrl")}
                          value={row.image_url || ""}
                          onChange={(url) => updateSection(key, { image_url: url })}
                          folder={"about_sections/" + key}
                          usageType="hero"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <AboutSectionItemsEditor
                          label={A("zhItemsLabel")}
                          helpText={A("zhItemsHelp")}
                          sectionKey={key}
                          value={itemsZh[key] || []}
                          onChange={(value) => {

                            setItemsZh((prev) => ({ ...prev, [key]: value }));
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <AboutSectionItemsEditor
                          label={A("enItemsLabel")}
                          helpText={A("enItemsHelp")}
                          sectionKey={key}
                          value={itemsEn[key] || []}
                          onChange={(value) => {

                            setItemsEn((prev) => ({ ...prev, [key]: value }));
                          }}
                        />
                      </div>
                    </div>
                    <div data-admin-card-actions className="mt-4 flex gap-2">
                      <Button onClick={() => void saveSection(key)}>{A("save")}</Button>
                    </div>
                  </>
                )}
              </AdminFormSection>
            </TabsContent>
          );
        })}

        <TabsContent value="cta" className="space-y-6">
          <AdminFormSection
            title={A("ctaSectionTitle")}
            description={A("ctaSectionDescription")}
            helpText={A("ctaSectionHelpText")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{A("status")}</label>
                <select
                  value={ctaDraft.status || "published"}
                  onChange={(e) => touchEditingCta((v) => ({ ...(v || ctaDraft), status: toPublishStatus(e.target.value) }))}
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
                  label={A("optionalImageUrl")}
                  value={ctaDraft.image_url || ""}
                  onChange={(url) => touchEditingCta((v) => ({ ...(v || ctaDraft), image_url: url }))}
                  folder="cta_blocks"
                  usageType="hero"
                />
              </div>
            </div>
            <div data-admin-card-actions className="mt-4 flex gap-2">
              <Button onClick={() => void saveCta()}>{A("save")}</Button>
            </div>
          </AdminFormSection>
        </TabsContent>
      </Tabs>
    </>
  );
}
