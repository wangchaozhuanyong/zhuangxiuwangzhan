import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";
import { AdminFilters, AdminPageShell } from "./AdminPageShell";

const statuses = ["all", "new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"];
const isZhBrowser = () => typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh");

const copy = {
  en: { title: "Contact Leads", search: "Search name, phone, email...", status: "Status", exportCsv: "Export CSV", empty: "No leads found.", whatsapp: "WhatsApp", call: "Call" },
  zh: { title: "联系线索", search: "搜索姓名、电话、邮箱...", status: "状态", exportCsv: "导出 CSV", empty: "暂无线索。", whatsapp: "WhatsApp", call: "电话" },
};

const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const AdminLeadList = () => {
  const lang = isZhBrowser() ? "zh" : "en";
  const t = copy[lang];
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows(data || []);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const haystack = [row.name, row.phone, row.email, row.location, row.source_path].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [rows, search, status]);

  const exportCsv = () => {
    const fields = ["created_at", "name", "phone", "email", "project_type", "location", "status", "source_path", "message", "notes"];
    const csv = [fields.join(","), ...filtered.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <AdminPageShell
        title={t.title}
        actions={<Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>{t.exportCsv}</Button>}
      >
        <div className="space-y-4">
          <AdminFilters>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item} value={item}>{item === "all" ? t.status : item}</option>)}
            </select>
          </AdminFilters>
          {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}

          <div className="space-y-3">
            {filtered.map((lead) => (
              <div key={lead.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Link to={`/admin/leads/${lead.id}`} className="min-w-0">
                    <p className="font-semibold">{lead.name || "-"} · {lead.phone || "-"}</p>
                    <p className="truncate text-xs text-muted-foreground">{lead.status} · {lead.source_path || "-"} · {new Date(lead.created_at).toLocaleString()}</p>
                  </Link>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${String(lead.phone || "").replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">{t.whatsapp}</a></Button>
                    <Button asChild size="sm" variant="outline"><a href={`tel:${String(lead.phone || "").replace(/[^\d+]/g, "")}`}>{t.call}</a></Button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</div>}
          </div>
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export default AdminLeadList;
