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
import { adminHomeEditorText } from "@/i18n/adminHomeEditorText";
import type { CtaRow, FaqRow, HomeSectionRow, ProcessStepRow } from "@/lib/adminEditorData";
import { useAdminHomeEditorData } from "@/lib/adminCmsQueries";
import { translateFieldLabel } from "@/i18n/displayLabels";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";

type AdminHomeEditorTextKey = keyof typeof adminHomeEditorText;

const L = (field: string) => translateFieldLabel(field, getAdminLang());
const A = (key: AdminHomeEditorTextKey) => adminHomeEditorText[key][getAdminLang()];
const formatA = (key: AdminHomeEditorTextKey, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));

type PublishStatus = "draft" | "published" | "archived";
type HomeSectionItem = {
  value?: string;
  label_zh?: string;
  label_en?: string;
  title_zh?: string;
  title_en?: string;
  desc_zh?: string;
  desc_en?: string;
  icon?: string;
  [key: string]: unknown;
};

const toPublishStatus = (value: string): PublishStatus =>
  value === "draft" || value === "archived" ? value : "published";
const toHomeSectionItem = (value: unknown): HomeSectionItem =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as HomeSectionItem) : {};
const toRecordPayload = (value: Record<string, unknown>): Record<string, unknown> => value;

const mergeSectionItems = (itemsZh?: unknown, itemsEn?: unknown): HomeSectionItem[] => {
  const zh = Array.isArray(itemsZh) ? itemsZh.map(toHomeSectionItem) : [];
  const en = Array.isArray(itemsEn) ? itemsEn.map(toHomeSectionItem) : [];
  const length = Math.max(zh.length, en.length);
  return Array.from({ length }, (_, index) => ({ ...(en[index] || {}), ...(zh[index] || {}) }));
};

export default function AdminHomeEditor() {
  const queryClient = useQueryClient();
  const { data: bundle, isFetching, refetch } = useAdminHomeEditorData();
  const [activeTab, setActiveTab] = useState("hero");
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const initialLoading = !bundle && isFetching;

  const [statsSection, setStatsSection] = useState<HomeSectionRow | null>(null);
  const [whySection, setWhySection] = useState<HomeSectionRow | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStepRow[]>([]);
  const [faqRows, setFaqRows] = useState<FaqRow[]>([]);
  const [ctaBlock, setCtaBlock] = useState<CtaRow | null>(null);

  const [statsItems, setStatsItems] = useState<HomeSectionItem[]>([]);
  const [whyItems, setWhyItems] = useState<HomeSectionItem[]>([]);
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
    setStatsItems(mergeSectionItems(bundle.stats?.items_zh, bundle.stats?.items_en));
    setWhyItems(mergeSectionItems(bundle.why?.items_zh, bundle.why?.items_en));
  }, [bundle]);

  const refreshEditor = async () => {
    formDirtyRef.current = false;
    setFormDirty(false);
    void invalidatePublishedContent(queryClient);
    await refetch();
  };

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await refreshEditor();
    } finally {
      setManualRefreshing(false);
    }
  };

  const saveHomeSectionItems = async (row: HomeSectionRow | null, items: HomeSectionItem[]) => {
    if (!supabase) return;
    if (!row?.id) {
      toast({ title: A("cannotSave"), description: A("homeDataNotLoaded"), variant: "destructive" });
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
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
      return;
    }
    toast({ title: A("saved") });
    await refreshEditor();
  };

  const upsertProcessStep = async (draft: ProcessStepRow) => {
    if (!supabase) return;
    const payload = toRecordPayload({
      step_number: Number(draft.step_number || 0),
      title_zh: draft.title_zh || null,
      title_en: draft.title_en || null,
      description_zh: draft.description_zh || null,
      description_en: draft.description_en || null,
      icon_key: draft.icon_key || null,
      status: draft.status || "published",
      sort_order: Number(draft.sort_order || 0),
    });
    try {
      await saveAdminRecord({
        table: "process_steps",
        payload,
        id: draft.id,
        expectedUpdatedAt: draft.updated_at || null,
        queryClient,
      });
      toast({ title: A("saved") });
      await refreshEditor();
    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const deleteProcessStep = async (id: string) => {
    if (!supabase) return;
    const confirmed = await adminConfirm({
      title: A("deleteStepTitle"),
      description: A("deleteStepDescription"),
      confirmLabel: A("continueProcessing"),
    });
    if (!confirmed) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "process_steps", id, queryClient });
      toast({ title: A("deleted") });
      await refreshEditor();
    } catch (error) {
      toast({ title: A("deleteFailed"), description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const upsertFaq = async (draft: FaqRow) => {
    if (!supabase) return;
    const payload = toRecordPayload({
      page_key: "home",
      question_zh: draft.question_zh || null,
      answer_zh: draft.answer_zh || null,
      question_en: draft.question_en || null,
      answer_en: draft.answer_en || null,
      status: draft.status || "published",
      sort_order: Number(draft.sort_order || 0),
    });
    try {
      await saveAdminRecord({
        table: "faqs",
        payload,
        id: draft.id,
        expectedUpdatedAt: draft.updated_at || null,
        queryClient,
      });
      toast({ title: A("saved") });
      await refreshEditor();
    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const deleteFaq = async (id: string) => {
    if (!supabase) return;
    const confirmed = await adminConfirm({
      title: A("deleteFaqTitle"),
      description: A("deleteFaqDescription"),
      confirmLabel: A("continueProcessing"),
    });
    if (!confirmed) return;
    try {
      await archiveOrDeleteAdminRecord({ table: "faqs", id, queryClient });
      toast({ title: A("deleted") });
      await refreshEditor();
    } catch (error) {
      toast({ title: A("deleteFailed"), description: formatAdminMutationError(error), variant: "destructive" });
    }
  };

  const upsertCta = async (draft: CtaRow) => {
    if (!supabase) return;
    const payload = toRecordPayload({
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
    });

    try {
      await saveAdminRecord({
        table: "cta_blocks",
        payload,
        id: draft.id,
        expectedUpdatedAt: draft.updated_at || null,
        queryClient,
      });
      toast({ title: A("saved") });
      await refreshEditor();
    } catch (error) {
      toast({ title: A("saveFailed"), description: formatAdminMutationError(error), variant: "destructive" });
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
    return <AdminEmptyState title={A("supabaseMissingTitle")} description={A("supabaseMissingDescription")} />;
  }

  return (
    <>
      <AdminPageHeader
        title={A("pageTitle")}
        description={A("pageDescription")}
        helpText={A("pageHelpText")}
        actions={
          <Button type="button" variant="outline" onClick={() => void handleManualRefresh()} disabled={initialLoading || manualRefreshing}>
            {manualRefreshing ? A("refreshing") : initialLoading ? A("loading") : A("refresh")}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-4 overflow-auto">
          <TabsList className="w-max">
            <TabsTrigger value="hero">{A("tabHero")}</TabsTrigger>
            <TabsTrigger value="stats">{A("tabStats")}</TabsTrigger>
            <TabsTrigger value="why">{A("tabWhy")}</TabsTrigger>
            <TabsTrigger value="process">{A("tabProcess")}</TabsTrigger>
            <TabsTrigger value="beforeAfter">{A("tabBeforeAfter")}</TabsTrigger>
            <TabsTrigger value="testimonials">{A("tabTestimonials")}</TabsTrigger>
            <TabsTrigger value="faq">{A("tabFaq")}</TabsTrigger>
            <TabsTrigger value="cta">{A("tabCta")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hero" className="space-y-6">
          <AdminFormSection title={A("heroTitle")} description={A("heroDescription")} helpText={A("heroHelpText")}>
            <div data-admin-card-actions className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/hero_slides">{A("manageHeroButtons")}</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="/zh" target="_blank" rel="noreferrer">{A("previewHomeZh")}</a>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <AdminFormSection
            title={A("statsTitle")}
            description={A("statsDescription")}
            helpText={A("statsHelpText")}
          >
            <HomeSectionItemsEditor
              label={A("statsItemsLabel")}
              helpText={A("statsItemsHelp")}
              variant="stats"
              value={statsItems}
              onChange={(value) => {
                markDirty();
                setStatsItems(value);
              }}
            />

            <div data-admin-card-actions className="mt-4 flex gap-2">
              <Button onClick={() => void saveHomeSectionItems(statsSection, statsItems)}>{A("save")}</Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="why" className="space-y-6">
          <AdminFormSection
            title={A("whyTitle")}
            description={A("whyDescription")}
            helpText={A("whyHelpText")}
          >
            <HomeSectionItemsEditor
              label={A("whyItemsLabel")}
              helpText={A("whyItemsHelp")}
              variant="why"
              value={whyItems}
              onChange={(value) => {
                markDirty();
                setWhyItems(value);
              }}
            />

            <div data-admin-card-actions className="mt-4 flex gap-2">
              <Button onClick={() => void saveHomeSectionItems(whySection, whyItems)}>{A("save")}</Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <AdminFormSection title={A("processTitle")} description={A("processDescription")} helpText={A("processHelpText")}>
            <div data-admin-card-actions className="flex flex-wrap gap-2">
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
              >{A("addStep")}</Button>
            </div>

            <div className="mt-4 space-y-3">
              {processSteps.map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        #{s.step_number} · {s.title_zh || s.title_en || A("unnamed")}{" "}
                        <span className="text-xs text-muted-foreground">({adminStatusLabel("default", s.status || "published")})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatA("processMeta", { sort: String(s.sort_order ?? 0), icon: s.icon_key || "-" })}</div>
                    </div>
                    <div data-admin-card-actions className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingStep(s)}>
                        {A("edit")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteProcessStep(String(s.id))}>
                        {A("delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {processSteps.length === 0 && <div className="text-sm text-muted-foreground">{A("noSteps")}</div>}
            </div>
          </AdminFormSection>

          {editingStep && (
            <AdminFormSection title={A("editStepTitle")} description={A("editStepDescription")} helpText={A("editStepHelpText")}>
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
                  <Input value={editingStep.icon_key || ""} onChange={(e) => setEditingStep((v) => (v ? { ...v, icon_key: e.target.value } : v))} placeholder={A("iconPlaceholder")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{L("status")}</label>
                  <select
                    value={editingStep.status || "published"}
                    onChange={(e) => setEditingStep((v) => (v ? { ...v, status: toPublishStatus(e.target.value) } : v))}
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
              <div data-admin-card-actions className="mt-4 flex gap-2">
                <Button onClick={() => void upsertProcessStep(editingStep)}>{A("save")}</Button>
                <Button variant="outline" onClick={() => setEditingStep(null)}>
                  {A("cancel")}
                </Button>
              </div>
            </AdminFormSection>
          )}
        </TabsContent>

        <TabsContent value="beforeAfter" className="space-y-6">
          <AdminFormSection title={A("beforeAfterTitle")} description={A("beforeAfterDescription")} helpText={A("beforeAfterHelpText")}>
            <div data-admin-card-actions className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/before-after">{A("manageBeforeAfter")}</Link>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-6">
          <AdminFormSection title={A("testimonialsTitle")} description={A("testimonialsDescription")} helpText={A("testimonialsHelpText")}>
            <div data-admin-card-actions className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/admin/content/testimonials">{A("manageTestimonials")}</Link>
              </Button>
            </div>
          </AdminFormSection>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <AdminFormSection title={A("faqTitle")} description={A("faqDescription")} helpText={A("faqHelpText")}>
            <div data-admin-card-actions className="flex flex-wrap gap-2">
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
              >{A("newQuestion")}</Button>
            </div>

            <div className="mt-4 space-y-3">
              {faqRows.map((f) => (
                <div key={f.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{f.question_zh || f.question_en || A("unnamedQuestion")}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatA("faqMeta", { sort: String(f.sort_order ?? 0), status: adminStatusLabel("default", f.status || "published") })}
                      </div>
                    </div>
                    <div data-admin-card-actions className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingFaq(f)}>
                        {A("edit")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => void deleteFaq(String(f.id))}>
                        {A("delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {faqRows.length === 0 && <div className="text-sm text-muted-foreground">{A("noFaq")}</div>}
            </div>
          </AdminFormSection>

          {editingFaq && (
            <AdminFormSection title={A("editFaqTitle")} description={A("editFaqDescription")} helpText={A("editFaqHelpText")}>
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
                    onChange={(e) => setEditingFaq((v) => (v ? { ...v, status: toPublishStatus(e.target.value) } : v))}
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
              <div data-admin-card-actions className="mt-4 flex gap-2">
                <Button onClick={() => void upsertFaq(editingFaq)}>{A("save")}</Button>
                <Button variant="outline" onClick={() => setEditingFaq(null)}>
                  {A("cancel")}
                </Button>
              </div>
            </AdminFormSection>
          )}
        </TabsContent>

        <TabsContent value="cta" className="space-y-6">
          <AdminFormSection title={A("ctaTitle")} description={A("ctaDescription")} helpText={A("ctaHelpText")}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">{A("status")}</label>
                <select
                  value={(editingCta || ctaDraft).status || "published"}
                  onChange={(e) => setEditingCta((v) => ({ ...(v || ctaDraft), status: toPublishStatus(e.target.value) }))}
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
                  label={A("imageUrlOptional")}
                  value={(editingCta || ctaDraft).image_url || ""}
                  onChange={(url) => setEditingCta((v) => ({ ...(v || ctaDraft), image_url: url }))}
                  folder="cta_blocks"
                  usageType="hero"
                />
              </div>
            </div>

            <div data-admin-card-actions className="mt-4 flex gap-2">
              <Button onClick={() => void upsertCta(editingCta || ctaDraft)}>{A("save")}</Button>
            </div>
          </AdminFormSection>
        </TabsContent>
      </Tabs>
    </>
  );
}
