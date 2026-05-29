import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminLeads } from "@/lib/adminQueries";
import { getAdminLang } from "@/lib/adminLocale";
import { translateStatusLabel } from "@/i18n/displayLabels";

const statuses = ["all", "new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"];

const copy = {
  en: { title: "Contact Leads", search: "Search name, phone, email...", status: "Status", statusAll: "All statuses", exportCsv: "Export CSV", empty: "No leads found.", whatsapp: "WhatsApp", call: "Call" },
  zh: { title: "联系线索", search: "搜索姓名、电话、邮箱...", status: "状态", statusAll: "全部状态", exportCsv: "导出 CSV", empty: "暂无线索。", whatsapp: "WhatsApp 联系", call: "拨打电话" },
};

const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const AdminLeadList = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const { data: rows = [], error } = useAdminLeads();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const message = error ? (error as Error).message : "";

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
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="font-display text-2xl font-bold">{t.title}</h1>
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>{t.exportCsv}</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? t.statusAll : translateStatusLabel("leads", item, lang)}
              </option>
            ))}
          </select>
        </div>
        {message && <p className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
      </div>

      <div className="space-y-3">
        {filtered.map((lead) => (
          <div key={lead.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Link to={`/admin/leads/${lead.id}`} className="min-w-0">
                <p className="font-semibold">{lead.name || "-"} · {lead.phone || "-"}</p>
                <p className="truncate text-xs text-muted-foreground">{translateStatusLabel("leads", lead.status || "new", lang)} · {lead.source_path || "-"} · {new Date(lead.created_at).toLocaleString("zh-CN")}</p>
              </Link>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${String(lead.phone || "").replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">{t.whatsapp}</a></Button>
                <Button asChild size="sm" variant="outline"><a href={`tel:${String(lead.phone || "").replace(/[^\d+]/g, "")}`}>{t.call}</a></Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</div>}
      </div>
    </div>
  );
};

export default AdminLeadList;
