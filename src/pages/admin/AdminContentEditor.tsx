import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAdminContentLists, invalidatePublishedContent } from "@/lib/adminInvalidate";
import { useAdminEditorRows } from "@/lib/adminQueries";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { translateFieldLabel, translateStatusLabel } from "@/i18n/displayLabels";
import { getAdminLang } from "@/lib/adminLocale";
import {
  arrayLikeFields,
  arrayValue,
  autoTranslateTables,
  contentFields,
  copy,
  editableTables,
  englishFields,
  exportRowsAsCsv,
  formatFieldValue,
  getRecordLabel,
  getRecordMeta,
  imageFields,
  jsonFields,
  listContentTables,
  longTextFields,
  parseFieldValue,
  readOnlyFields,
  readOnlyTables,
  statusOptions,
  tableFields,
  tableLabels,
} from "@/lib/adminContentEditorUtils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminImageUpload, { getAdminImagePreviewVariant } from "./AdminImageUpload";
import AdminProjectImages from "./AdminProjectImages";
import { FaqListEditor, ProjectCardsEditor, TextListEditor } from "@/components/admin/StructuredArrayEditors";
import { AdminFieldLabel } from "@/components/admin/AdminHelpTip";
import { getAdminFieldHelp, getAdminTableHelp } from "@/lib/adminHelpText";
import { formatAdminMutationError, saveAdminRecord } from "@/lib/adminMutation";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";

const AdminContentEditor = () => {
  const { type = "projects", id } = useParams<{ type: string; id?: string }>();
  const queryClient = useQueryClient();
  const lang = getAdminLang();
  const t = copy[lang];
  const [record, setRecord] = useState<Record<string, any>>({});
  const recordDirtyRef = useRef(false);
  const [recordDirty, setRecordDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const setRecordField = useCallback((patch: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    recordDirtyRef.current = true;
    setRecordDirty(true);
    setRecord((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);
  useUnsavedChangesWarning(recordDirty);
  const canEdit = editableTables.has(type);
  const { data: rows = [], isFetching, error: rowsError, refetch } = useAdminEditorRows(type, canEdit);
  const isLoading = isFetching;

  const refreshContentCaches = useCallback(() => {
    void invalidatePublishedContent(queryClient);
    if (listContentTables.has(type)) void invalidateAdminContentLists(queryClient);
  }, [queryClient, type]);

  const visibleFields = useMemo(() => tableFields[type] || [...contentFields, ...englishFields, "slug", "status", "sort_order"], [type]);
  const availableStatuses = statusOptions[type] || statusOptions.default;
  const statusOptionLabels = useMemo(
    () => availableStatuses.map((option) => ({ value: option, label: translateStatusLabel(type, option, lang) })),
    [availableStatuses, lang, type],
  );
  const filteredRows = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query || visibleFields.some((field) => String(row[field] ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, deferredSearch, statusFilter, visibleFields]);

  useEffect(() => {
    recordDirtyRef.current = false;
    setRecordDirty(false);
  }, [id, type]);

  useEffect(() => {
    if (rowsError) {
      setStatus(rowsError instanceof Error ? rowsError.message : String(rowsError));
      return;
    }
    if (recordDirtyRef.current) return;
    if (id && rows.length) {
      setRecord(rows.find((item) => item.id === id) || {});
    } else if (!id) {
      setRecord({});
    }
  }, [id, rows, rowsError]);

  const save = async () => {
    setStatus(t.saving);
    const payload = { ...record };
    for (const field of Object.keys(payload)) {
      payload[field] = parseFieldValue(field, payload[field]);
    }

    let savedRecord: Record<string, any>;
    try {
      savedRecord = await saveAdminRecord({
        table: type,
        payload,
        id: record.id,
        expectedUpdatedAt: record.updated_at || null,
        queryClient,
      });
    } catch (error) {
      setStatus(formatAdminMutationError(error));
      return;
    }

    recordDirtyRef.current = false;
    setRecordDirty(false);
    setRecord(savedRecord);

    const hasChineseContent = Object.keys(payload).some((field) => field.endsWith("_zh") && payload[field]);
    if (autoTranslateTables.has(type) && hasChineseContent) {
      setStatus(t.generatingEnglish);
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: type, id: savedRecord.id },
      });

      if (translationError) {
        setStatus(t.generationFailed(translationError.message));
        return;
      }

      const { data: translatedRecord } = await supabase!.from(type).select("*").eq("id", savedRecord.id).single();
      if (translatedRecord) {
        recordDirtyRef.current = false;
        setRecordDirty(false);
        setRecord(translatedRecord);
      }
      setStatus(t.generated);
      refreshContentCaches();
      await refetch();
      return;
    }

    setStatus(t.saved);
    refreshContentCaches();
    void queryClient.invalidateQueries({ queryKey: ["admin", type, "rows"] });
    await refetch();
  };

  const regenerateEnglish = async () => {
    if (!record.id) {
      setStatus(t.saveFirst);
      return;
    }

    setStatus(t.generating);
    const { error } = await supabase!.functions.invoke("generate-english-content", {
      body: { table: type, id: record.id, force: true },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    const { data: translatedRecord } = await supabase!.from(type).select("*").eq("id", record.id).single();
      if (translatedRecord) {
        recordDirtyRef.current = false;
        setRecordDirty(false);
        setRecord(translatedRecord);
      }
    setStatus(t.regenerated);
    refreshContentCaches();
    void queryClient.invalidateQueries({ queryKey: ["admin", type, "rows"] });
    await refetch();
  };

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">{t.unsupported(type)}</div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display mb-3 text-lg font-bold">{tableLabels[type]?.[lang] || type}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{getAdminTableHelp(type)}</p>
          {!readOnlyTables.has(type) && (
            <Button
              className="mb-4 w-full"
              onClick={() => {
                recordDirtyRef.current = false;
                setRecordDirty(false);
                setRecord({ status: type === "leads" ? "new" : type === "quote_requests" ? "pending" : "draft", sort_order: 0 });
              }}
            >
              {t.createRecord}
            </Button>
          )}
          <div className="mb-4 space-y-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchPlaceholder} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">{t.allStatuses}</option>
              {statusOptionLabels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button className="w-full" variant="outline" onClick={() => void refetch()} disabled={isLoading || !isSupabaseConfigured}>
              {isLoading ? t.refreshing : t.refresh}
            </Button>
          </div>
          {(type === "leads" || type === "quote_requests") && (
            <Button className="mb-4 w-full" variant="outline" onClick={() => exportRowsAsCsv(type, visibleFields, filteredRows)} disabled={filteredRows.length === 0}>
              {t.exportCsv}
            </Button>
          )}
          <p className="mb-3 text-xs text-muted-foreground">{t.showing(filteredRows.length, rows.length)}</p>
          <div className="space-y-2">
            {filteredRows.map((row) => (
              <button
                key={row.id}
                className="block w-full rounded-lg border border-border p-3 text-left text-sm hover:bg-muted"
                onClick={() => {
                  recordDirtyRef.current = false;
                  setRecordDirty(false);
                  setRecord(row);
                }}
              >
                <span className="font-medium">{getRecordLabel(row, type, lang)}</span>
                <span className="block text-xs text-muted-foreground">{getRecordMeta(row, type, lang)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">{t.bilingualTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.bilingualDesc}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={regenerateEnglish} disabled={!isSupabaseConfigured || !record.id}>
                {t.regenerate}
              </Button>
              <Button onClick={save} disabled={!isSupabaseConfigured || readOnlyTables.has(type)}>
                {t.save}
              </Button>
            </div>
          </div>
          {(type === "leads" || type === "quote_requests") && (
            <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">{t.leadTip}</div>
          )}
          {status && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{status}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            {visibleFields.map((field) => {
              const label = translateFieldLabel(field, lang);
              const isWide =
                field.includes("content") ||
                field.includes("description") ||
                arrayLikeFields.has(field) ||
                jsonFields.has(field) ||
                imageFields.has(field);

              return (
                <div key={field} className={isWide ? "md:col-span-2" : ""}>
                  {readOnlyFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Input value={formatFieldValue(field, record[field])} readOnly className="bg-muted text-muted-foreground" />
                    </>
                  ) : field === "faqs_zh" || field === "faqs_en" ? (
                    <FaqListEditor label={label} helpText={getAdminFieldHelp(field)} value={arrayValue(field, record[field])} onChange={(value) => setRecordField({ [field]: value })} />
                  ) : field === "projects" ? (
                    <ProjectCardsEditor
                      label={label}
                      helpText={getAdminFieldHelp(field)}
                      value={arrayValue(field, record[field])}
                      onChange={(value) => setRecordField({ [field]: value })}
                      folder={`${type}/${record.id || "draft"}/projects`}
                      metaKey="type"
                      metaLabel="项目类型"
                    />
                  ) : field === "related_projects" ? (
                    <ProjectCardsEditor
                      label={label}
                      helpText={getAdminFieldHelp(field)}
                      value={arrayValue(field, record[field])}
                      onChange={(value) => setRecordField({ [field]: value })}
                      folder={`${type}/${record.id || "draft"}/related-projects`}
                      metaKey="location"
                      metaLabel="项目地点"
                    />
                  ) : arrayLikeFields.has(field) ? (
                    <TextListEditor label={label} helpText={getAdminFieldHelp(field)} value={arrayValue(field, record[field])} onChange={(value) => setRecordField({ [field]: value })} />
                  ) : field.includes("content") || field.includes("description") || longTextFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Textarea rows={5} value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                    </>
                  ) : jsonFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Textarea rows={4} value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                    </>
                  ) : imageFields.has(field) ? (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <div className="space-y-3">
                        <Input value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                        <AdminImageUpload
                          value={record[field]}
                          folder={`${type}/${record.id || "draft"}`}
                          previewVariant={getAdminImagePreviewVariant(field)}
                          recordAsset
                          assetUsageType={type === "projects" ? "project" : type === "materials" ? "material" : type === "blog_posts" ? "blog" : "general"}
                          onUploaded={(url) => setRecordField({ [field]: url })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <AdminFieldLabel label={label} help={getAdminFieldHelp(field)} />
                      <Input value={formatFieldValue(field, record[field])} onChange={(event) => setRecordField({ [field]: event.target.value })} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {type === "projects" && <AdminProjectImages projectId={record.id} />}
        </div>
      </div>
  );
};

export default AdminContentEditor;
