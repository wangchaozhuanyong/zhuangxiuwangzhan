import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminSimpleCmsRows } from "@/lib/adminCmsQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured } from "@/lib/supabase";
import AdminImageUpload, { getAdminImagePreviewVariant } from "./AdminImageUpload";
import { adminConfirm } from "@/components/admin/AdminConfirmProvider";
import { adminSimpleCmsConfigText, adminSimpleCmsText } from "@/i18n/adminSimpleCmsText";
import { adminStatusLabel, getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { TextListEditor } from "@/components/admin/StructuredArrayEditors";
import { getAdminFieldHelp, getAdminTableHelp } from "@/lib/adminHelpText";
import { archiveOrDeleteAdminRecord, formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { formatUserFacingError } from "@/lib/userFacingText";

type ModuleKey = "site_pages" | "home_sections" | "faqs" | "before_after_items" | "brand_partners";
type Field = { key: string; type?: "text" | "textarea" | "image" | "number" | "select" | "textList" };
type AdminSimpleCmsTextKey = keyof typeof adminSimpleCmsText.en;

const configs: Record<ModuleKey, { table: ModuleKey; labelField: string; fields: Field[] }> = {
  site_pages: {
    table: "site_pages",
    labelField: "page_key",
    fields: [
      { key: "page_key" },
      { key: "path" },
      { key: "title_zh" },
      { key: "title_en" },
      { key: "subtitle_zh" },
      { key: "subtitle_en" },
      { key: "description_zh", type: "textarea" },
      { key: "description_en", type: "textarea" },
      { key: "content_zh", type: "textarea" },
      { key: "content_en", type: "textarea" },
      { key: "cta_title_zh" },
      { key: "cta_title_en" },
      { key: "cta_description_zh", type: "textarea" },
      { key: "cta_description_en", type: "textarea" },
      { key: "image_url", type: "image" },
      { key: "alt_zh" },
      { key: "alt_en" },
      { key: "seo_title_zh" },
      { key: "seo_title_en" },
      { key: "seo_description_zh", type: "textarea" },
      { key: "seo_description_en", type: "textarea" },
      { key: "seo_keywords_zh" },
      { key: "seo_keywords_en" },
      { key: "items_zh", type: "textList" },
      { key: "items_en", type: "textList" },
    ],
  },
  home_sections: {
    table: "home_sections",
    labelField: "section_key",
    fields: [
      { key: "section_key" },
      { key: "title_zh" },
      { key: "title_en" },
      { key: "subtitle_zh", type: "textarea" },
      { key: "subtitle_en", type: "textarea" },
      { key: "content_zh", type: "textarea" },
      { key: "content_en", type: "textarea" },
      { key: "image_url", type: "image" },
      { key: "button_label_zh" },
      { key: "button_label_en" },
      { key: "button_url" },
    ],
  },
  faqs: {
    table: "faqs",
    labelField: "question_zh",
    fields: [
      { key: "page_key" },
      { key: "question_zh", type: "textarea" },
      { key: "question_en", type: "textarea" },
      { key: "answer_zh", type: "textarea" },
      { key: "answer_en", type: "textarea" },
    ],
  },
  before_after_items: {
    table: "before_after_items",
    labelField: "title_zh",
    fields: [
      { key: "title_zh" },
      { key: "title_en" },
      { key: "location" },
      { key: "description_zh", type: "textarea" },
      { key: "description_en", type: "textarea" },
      { key: "before_image_url", type: "image" },
      { key: "after_image_url", type: "image" },
      { key: "alt_zh" },
      { key: "alt_en" },
    ],
  },
  brand_partners: {
    table: "brand_partners",
    labelField: "name",
    fields: [
      { key: "name" },
      { key: "logo_url", type: "image" },
      { key: "website_url" },
    ],
  },
};

const emptyRecord = { status: "published", sort_order: 0 };

const formatAdminError = (module: ModuleKey, error: unknown, language: "en" | "zh") => {
  const record = error as { code?: string; message?: string; hint?: string; details?: string };
  const message = typeof record?.message === "string" ? record.message : "";
  if (module === "site_pages" && (record?.code === "PGRST205" || message.includes("site_pages"))) {
    return adminSimpleCmsText[language].sitePagesMissingTable;
  }
  return formatUserFacingError([message, record?.hint, record?.details].filter(Boolean).join(" "), language);
};

const AdminSimpleCms = ({ module }: { module: ModuleKey }) => {
  const language = getAdminLang();
  const t = adminSimpleCmsText[language];
  const configText = adminSimpleCmsConfigText[language][module];
  const config = configs[module];
  const queryClient = useQueryClient();
  const { data: rows = [], error, refetch } = useAdminSimpleCmsRows(config.table);
  const [record, setRecord] = useState<Record<string, any>>(emptyRecord);
  const recordDirtyRef = useRef(false);
  const [message, setMessage] = useState(error ? formatAdminError(module, error, language) : "");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recordDirty, setRecordDirty] = useState(false);

  useUnsavedChangesWarning(recordDirty && !saving);

  useEffect(() => {
    if (error) setMessage(formatAdminError(module, error, language));
  }, [error, language, module]);

  const title = useMemo(() => {
    const current = record as Record<string, unknown>;
    return String(current[config.labelField] || current["title_en"] || current["name"] || t.newRecord);
  }, [config.labelField, record, t.newRecord]);

  const fieldLabel = (fieldKey: string) => {
    const labels = configText.fields as Record<string, string>;
    return labels[fieldKey] || fieldKey;
  };

  const formatText = (key: AdminSimpleCmsTextKey, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), t[key]);

  const markRecordDirty = () => {
    recordDirtyRef.current = true;
    setRecordDirty(true);
  };

  const markRecordClean = () => {
    recordDirtyRef.current = false;
    setRecordDirty(false);
  };

  const confirmDiscardUnsaved = async () => {
    if (!recordDirtyRef.current) return true;
    return adminConfirm({
      title: t.discardTitle,
      description: t.discardDescription,
      confirmLabel: t.discardConfirm,
    });
  };

  const update = (key: string, value: unknown) => {
    markRecordDirty();
    setRecord((current) => ({ ...current, [key]: value }));
  };

  const loadRecord = async (row: Record<string, any>) => {
    if (!(await confirmDiscardUnsaved())) return;
    markRecordClean();
    setRecord(row);
  };

  const resetRecord = async () => {
    if (!(await confirmDiscardUnsaved())) return;
    markRecordClean();
    setRecord({ ...emptyRecord });
  };

  const save = async () => {
    if (!isSupabaseConfigured || saving) return;
    setSaving(true);
    const payload = { ...record };
    for (const field of config.fields) {
      if (field.type === "textList") {
        const value = payload[field.key];
        payload[field.key] = Array.isArray(value)
          ? value.map((item) => String(item || "").trim()).filter(Boolean)
          : String(value || "")
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean);
      }
    }
    const recordId = payload.id;
    const expectedUpdatedAt = payload.updated_at || null;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    try {
      const data = await saveAdminRecord<Record<string, any>>({
        table: config.table,
        id: recordId,
        expectedUpdatedAt,
        payload,
        queryClient,
        invalidate: "admin-content",
      });
      setMessage(t.saved);
      markRecordClean();
      setRecord(data || emptyRecord);
      void queryClient.invalidateQueries({ queryKey: ["admin", config.table, "rows"] });
      await refetch();
    } catch (saveError) {
      setMessage(formatAdminMutationError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured || deletingId) return;
    const confirmed = await adminConfirm({
      title: t.archiveTitle,
      description: t.archiveDescription,
      confirmLabel: t.archiveConfirm,
    });
    if (!confirmed) return;
    const current = rows.find((row) => String(row.id) === String(id)) as Record<string, any> | undefined;
    setDeletingId(id);
    try {
      await archiveOrDeleteAdminRecord({
        table: config.table,
        id,
        expectedUpdatedAt: current?.updated_at || null,
        queryClient,
        softDelete: true,
      });
      setMessage(t.archived);
      void queryClient.invalidateQueries({ queryKey: ["admin", config.table, "rows"] });
      await refetch();
    } catch (deleteError) {
      setMessage(formatAdminMutationError(deleteError));
    } finally {
      setDeletingId(null);
    }
  };

  const renderField = (field: Field) => {
    const rawValue = record[field.key];
    const value = String(rawValue || "");
    if (field.type === "textList") {
      const listValue = Array.isArray(rawValue)
        ? rawValue.map((item) => String(item || ""))
        : String(rawValue || "")
            .split("\n")
            .filter(Boolean);
      return (
        <div key={field.key} className="md:col-span-2">
          <TextListEditor
            label={fieldLabel(field.key)}
            helpText={getAdminFieldHelp(field.key)}
            value={listValue}
            onChange={(nextValue) => update(field.key, nextValue)}
            placeholder={t.textListPlaceholder}
            addLabel={t.textListAdd}
          />
          <p className="mt-1 text-xs text-muted-foreground">{getAdminFieldHelp(field.key)}</p>
        </div>
      );
    }

    return (
      <div key={field.key} className={field.type === "textarea" || field.type === "image" ? "md:col-span-2" : ""}>
        <AdminFieldLabel label={fieldLabel(field.key)} help={getAdminFieldHelp(field.key)} />
        {field.type === "textarea" ? (
          <Textarea rows={4} value={value} onChange={(event) => update(field.key, event.target.value)} />
        ) : field.type === "image" ? (
          <div className="space-y-3">
            <Input value={value} onChange={(event) => update(field.key, event.target.value)} />
            <AdminImageUpload
              folder={config.table}
              value={value}
              previewVariant={getAdminImagePreviewVariant(field.key)}
              recordAsset
              assetUsageType="general"
              onUploaded={(url) => update(field.key, url)}
            />
          </div>
        ) : (
          <Input value={value} onChange={(event) => update(field.key, event.target.value)} />
        )}
      </div>
    );
  };

  return (
    <div>
      <AdminPageHeader
        title={configText.title}
        description={getAdminTableHelp(config.table)}
        helpText={t.pageHelpText}
      />

      <div className="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{t.currentEditing}</p>
              <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">{String(title)}</h2>
            </div>
            <Button type="button" variant="outline" onClick={() => void resetRecord()}>{t.newRecord}</Button>
          </div>
          {message && <p className="mb-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
          {recordDirty && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.unsavedWarning}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {config.fields.map(renderField)}
            <div>
              <AdminFieldLabel label={t.status} help={getAdminFieldHelp("status")} />
              <select
                value={record.status || "published"}
                onChange={(event) => update("status", event.target.value)}
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
              <AdminFieldLabel label={t.sort} help={getAdminFieldHelp("sort_order")} />
              <Input type="number" value={record.sort_order || 0} onChange={(event) => update("sort_order", Number(event.target.value || 0))} />
            </div>
          </div>
          <Button type="button" className="mt-5 w-full" disabled={saving} onClick={() => void save()}>
            {saving ? t.saving : t.save}
          </Button>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-5">
            <h1 className="font-display text-xl font-bold sm:text-2xl">{configText.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{getAdminTableHelp(config.table)}</p>
          </div>
          <div className="space-y-3">
            {rows.map((row) => {
              const rowRecord = row as Record<string, unknown>;
              const rowId = String(rowRecord.id || "");
              const label = rowRecord[config.labelField] || rowRecord["title_en"] || rowRecord["name"] || t.unnamed;
              const status = String(rowRecord.status || "-");
              const sortOrder = rowRecord.sort_order || 0;

              return (
                <div key={rowId} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between xl:flex-col xl:items-stretch">
                  <div className="min-w-0">
                    <p className="font-semibold">{String(label)}</p>
                    <p className="text-xs text-muted-foreground">{formatText("rowMeta", { status: adminStatusLabel("default", status), sort: String(sortOrder) })}</p>
                  </div>
                  <div data-admin-card-actions className="flex gap-2 xl:justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadRecord(row)}>
                      {t.edit}
                    </Button>
                    <Button type="button" variant="destructive" size="sm" disabled={deletingId === rowId} onClick={() => void remove(rowId)}>
                      {t.delete}
                    </Button>
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{t.emptyList}</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSimpleCms;


