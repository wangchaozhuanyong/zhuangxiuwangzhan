import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";
import AdminImageUpload from "./AdminImageUpload";
import AdminProjectImages from "./AdminProjectImages";

const editableTables = new Set([
  "services",
  "projects",
  "blog_posts",
  "materials",
  "testimonials",
  "hero_slides",
  "service_areas",
  "landing_pages",
  "leads",
  "quote_requests",
  "translation_jobs",
]);

const contentFields = ["title_zh", "excerpt_zh", "content_zh", "seo_title_zh", "seo_description_zh", "alt_zh"];
const englishFields = ["title_en", "excerpt_en", "content_en", "seo_title_en", "seo_description_en", "alt_en"];
const tableFields: Record<string, string[]> = {
  hero_slides: [
    "title_zh", "excerpt_zh", "button_label_zh", "alt_zh",
    "title_en", "excerpt_en", "button_label_en", "alt_en",
    "button_url", "image_url", "status", "sort_order",
  ],
  services: [
    ...contentFields, "suitable_for_zh", "common_projects_zh", "scope_items_zh", "faqs_zh",
    ...englishFields, "suitable_for_en", "common_projects_en", "scope_items_en", "faqs_en",
    "slug", "image_url", "status", "sort_order",
  ],
  projects: [
    ...contentFields, "client_need_zh", "highlights_zh",
    ...englishFields, "client_need_en", "highlights_en",
    "slug", "location", "area", "duration", "budget", "project_type", "materials", "scope", "status", "sort_order",
  ],
  materials: [
    ...contentFields, "suitable_spaces_zh", "pros_zh", "cons_zh", "recommended_pairing_zh", "note_zh",
    ...englishFields, "suitable_spaces_en", "pros_en", "cons_en", "recommended_pairing_en", "note_en",
    "slug", "category", "subcategory", "material_type", "color", "texture", "reference_price", "image_url", "status", "sort_order",
  ],
  blog_posts: [
    ...contentFields, ...englishFields,
    "slug", "category", "tags", "cover_image_url", "status", "published_at",
  ],
  testimonials: [
    "customer_name", "content_zh", "content_en", "rating", "project_id", "status", "sort_order",
  ],
  service_areas: [
    ...contentFields, "construction_notes_zh", "property_types", "common_needs", "projects", "faqs_zh",
    ...englishFields, "construction_notes_en", "faqs_en",
    "slug", "area_name", "status", "sort_order",
  ],
  landing_pages: [
    ...contentFields, "benefits_zh", "faqs_zh",
    ...englishFields, "benefits_en", "faqs_en",
    "slug", "hero_image_url", "related_projects", "status", "sort_order",
  ],
  leads: ["name", "phone", "email", "project_type", "location", "message", "source", "source_path", "status", "notes", "created_at", "updated_at"],
  quote_requests: [
    "customer_name", "customer_phone", "customer_email", "project_type", "location", "property_size", "estimated_budget",
    "quoted_amount", "valid_until", "project_details", "attachments", "status", "notes", "source_path", "created_at", "updated_at",
  ],
  translation_jobs: ["table_name", "record_id", "status", "error_message", "regenerated_at", "created_at", "updated_at"],
};

const arrayLikeFields = new Set([
  "materials", "scope", "tags", "suitable_for_zh", "suitable_for_en", "common_projects_zh", "common_projects_en",
  "scope_items_zh", "scope_items_en", "highlights_zh", "highlights_en", "suitable_spaces_zh", "suitable_spaces_en",
  "pros_zh", "pros_en", "cons_zh", "cons_en", "property_types", "common_needs", "benefits_zh", "benefits_en",
  "attachments",
]);

const jsonFields = new Set(["faqs_zh", "faqs_en", "projects", "process_steps_zh", "process_steps_en", "related_projects"]);
const imageFields = new Set(["image_url", "cover_image_url", "hero_image_url"]);
const autoTranslateTables = new Set(["services", "projects", "blog_posts", "materials", "testimonials", "hero_slides", "service_areas", "landing_pages"]);
const readOnlyTables = new Set(["translation_jobs"]);
const readOnlyFields = new Set(["created_at", "updated_at", "regenerated_at"]);

const getRecordLabel = (row: Record<string, any>, type: string) => {
  if (type === "leads") return `${row.name || "Lead"} - ${row.phone || "No phone"}`;
  if (type === "quote_requests") return `${row.customer_name || "Quote request"} - ${row.customer_phone || "No phone"}`;
  if (type === "translation_jobs") return `${row.table_name || "translation"} - ${row.status || "unknown"}`;
  return row.title_zh || row.title_en || row.name || row.customer_name || row.id;
};

const getRecordMeta = (row: Record<string, any>, type: string) => {
  if (type === "leads") return `${row.project_type || "General"} · ${row.location || "No location"} · ${row.status || "new"}`;
  if (type === "quote_requests") return `${row.project_type || "Project"} · ${row.location || "No location"} · ${row.status || "pending"}`;
  if (type === "translation_jobs") return row.error_message || row.record_id || "Translation job";
  return row.status || "saved";
};

const parseFieldValue = (field: string, value: any) => {
  if (arrayLikeFields.has(field)) {
    if (Array.isArray(value)) return value;
    return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
  }

  if (jsonFields.has(field)) {
    if (typeof value !== "string") return value;
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return value;
    }
  }

  if (field === "sort_order" || field === "rating" || field === "quoted_amount") {
    return Number(value || 0);
  }

  return value;
};

const formatFieldValue = (field: string, value: any) => {
  if (arrayLikeFields.has(field)) return Array.isArray(value) ? value.join("\n") : value || "";
  if (jsonFields.has(field)) return typeof value === "string" ? value : JSON.stringify(value || [], null, 2);
  return value || "";
};

const csvEscape = (value: any) => {
  const text = Array.isArray(value) || (value && typeof value === "object") ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

const exportRowsAsCsv = (type: string, fields: string[], rows: any[]) => {
  const csv = [
    fields.map(csvEscape).join(","),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const statusOptions: Record<string, string[]> = {
  leads: ["new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"],
  quote_requests: ["pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"],
  translation_jobs: ["processing", "completed", "failed"],
  default: ["draft", "published", "archived"],
};

const AdminContentEditor = () => {
  const { type = "projects", id } = useParams<{ type: string; id?: string }>();
  const [rows, setRows] = useState<any[]>([]);
  const [record, setRecord] = useState<Record<string, any>>({});
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const canEdit = editableTables.has(type);

  const visibleFields = useMemo(() => tableFields[type] || [...contentFields, ...englishFields, "slug", "status", "sort_order"], [type]);
  const availableStatuses = statusOptions[type] || statusOptions.default;
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !query || visibleFields.some((field) => String(row[field] ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter, visibleFields]);

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured || !canEdit) return;

    setIsLoading(true);
    const query = supabase!.from(type).select("*").order("created_at", { ascending: false }).limit(50);
    const { data, error } = await query;
    setIsLoading(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setRows(data || []);
    if (id && data) {
      setRecord(data.find((item) => item.id === id) || {});
    } else {
      setRecord({});
    }
  }, [canEdit, id, type]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const save = async () => {
    setStatus("Saving...");
    const payload = { ...record };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    for (const field of Object.keys(payload)) {
      payload[field] = parseFieldValue(field, payload[field]);
    }

    const request = record.id
      ? supabase!.from(type).update(payload).eq("id", record.id).select("id").single()
      : supabase!.from(type).insert(payload).select("id").single();

    const { data, error } = await request;
    if (error) {
      setStatus(error.message);
      return;
    }

    const savedRecord = { ...record, id: data.id };
    setRecord(savedRecord);

    const hasChineseContent = Object.keys(payload).some((field) => field.endsWith("_zh") && payload[field]);
    if (autoTranslateTables.has(type) && hasChineseContent) {
      setStatus("Saved. Generating English...");
      const { error: translationError } = await supabase!.functions.invoke("generate-english-content", {
        body: { table: type, id: data.id },
      });

      if (translationError) {
        setStatus(`Saved, but English generation failed: ${translationError.message}`);
        return;
      }

      const { data: translatedRecord } = await supabase!.from(type).select("*").eq("id", data.id).single();
      if (translatedRecord) setRecord(translatedRecord);
      setStatus("Saved and English generated. You can review or manually edit the English fields below.");
      return;
    }

    setStatus("Saved.");
    await loadRows();
  };

  const regenerateEnglish = async () => {
    if (!record.id) {
      setStatus("Save this record before generating English.");
      return;
    }

    setStatus("Generating English...");
    const { error } = await supabase!.functions.invoke("generate-english-content", {
      body: { table: type, id: record.id },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("English regenerated. Refresh or reselect the record to review it.");
  };

  if (!canEdit) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-border bg-card p-6">Unsupported table: {type}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold mb-3">{type}</h2>
          {!readOnlyTables.has(type) && (
            <Button className="mb-4 w-full" onClick={() => setRecord({ status: type === "leads" ? "new" : type === "quote_requests" ? "pending" : "draft", sort_order: 0 })}>
              {type === "leads" || type === "quote_requests" ? "Create Manual Record" : "New Chinese Content"}
            </Button>
          )}
          <div className="mb-4 space-y-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search current list..."
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              {availableStatuses.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Button className="w-full" variant="outline" onClick={() => void loadRows()} disabled={isLoading || !isSupabaseConfigured}>
              {isLoading ? "Refreshing..." : "Refresh List"}
            </Button>
          </div>
          {(type === "leads" || type === "quote_requests") && (
            <Button className="mb-4 w-full" variant="outline" onClick={() => exportRowsAsCsv(type, visibleFields, filteredRows)} disabled={filteredRows.length === 0}>
              Export Filtered CSV
            </Button>
          )}
          <p className="mb-3 text-xs text-muted-foreground">
            Showing {filteredRows.length} of {rows.length} latest records
          </p>
          <div className="space-y-2">
            {filteredRows.map((row) => (
              <button
                key={row.id}
                className="block w-full rounded-lg border border-border p-3 text-left text-sm hover:bg-muted"
                onClick={() => setRecord(row)}
              >
                <span className="font-medium">{getRecordLabel(row, type)}</span>
                <span className="block text-xs text-muted-foreground">{getRecordMeta(row, type)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Chinese first, English reviewable</h2>
              <p className="text-sm text-muted-foreground">Fill Chinese fields, save, then review or edit generated English fields.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={regenerateEnglish} disabled={!isSupabaseConfigured || !record.id}>Regenerate English</Button>
              <Button onClick={save} disabled={!isSupabaseConfigured || readOnlyTables.has(type)}>Save</Button>
            </div>
          </div>
          {(type === "leads" || type === "quote_requests") && (
            <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">
              Lead workflow tip: update the status and notes after calling, WhatsApp follow-up, site visit scheduling, quotation, or closing.
            </div>
          )}
          {status && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{status}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            {visibleFields.map((field) => (
              <div key={field} className={field.includes("content") || field.includes("description") ? "md:col-span-2" : ""}>
                <label className="mb-1 block text-sm font-medium">{field}</label>
                {readOnlyFields.has(field) ? (
                  <Input value={formatFieldValue(field, record[field])} readOnly className="bg-muted text-muted-foreground" />
                ) : field.includes("content") || field.includes("description") ? (
                  <Textarea rows={5} value={formatFieldValue(field, record[field])} onChange={(event) => setRecord({ ...record, [field]: event.target.value })} />
                ) : arrayLikeFields.has(field) || jsonFields.has(field) ? (
                  <Textarea rows={4} value={formatFieldValue(field, record[field])} onChange={(event) => setRecord({ ...record, [field]: event.target.value })} />
                ) : imageFields.has(field) ? (
                  <div className="space-y-3">
                    <Input value={formatFieldValue(field, record[field])} onChange={(event) => setRecord({ ...record, [field]: event.target.value })} />
                    <AdminImageUpload value={record[field]} folder={`${type}/${record.id || "draft"}`} onUploaded={(url) => setRecord({ ...record, [field]: url })} />
                  </div>
                ) : (
                  <Input value={formatFieldValue(field, record[field])} onChange={(event) => setRecord({ ...record, [field]: event.target.value })} />
                )}
              </div>
            ))}
          </div>
          {type === "projects" && <AdminProjectImages projectId={record.id} />}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContentEditor;
