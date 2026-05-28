import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";
import { AdminFilters, AdminPageShell } from "./AdminPageShell";

const statuses = ["all", "pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"];
const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const AdminQuoteList = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");

  const loadRows = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase!.from("quote_requests").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) setMessage(error.message);
    else setRows(data || []);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const haystack = [row.customer_name, row.customer_phone, row.customer_email, row.location, row.project_type].join(" ").toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [rows, search, status]);

  const exportCsv = () => {
    const fields = ["created_at", "customer_name", "customer_phone", "customer_email", "project_type", "location", "property_size", "estimated_budget", "quoted_amount", "status", "notes"];
    const csv = [fields.join(","), ...filtered.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `quote-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <AdminPageShell
        title="报价请求 / Quote Requests"
        actions={<Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>导出 CSV</Button>}
      >
        <div className="space-y-4">
          <AdminFilters>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索客户、电话、项目、地区..." />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </AdminFilters>
          {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}

          <div className="space-y-3">
            {filtered.map((quote) => (
              <div key={quote.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Link to={`/admin/quotes/${quote.id}`} className="min-w-0">
                    <p className="font-semibold">{quote.customer_name || "-"} · {quote.customer_phone || "-"}</p>
                    <p className="truncate text-xs text-muted-foreground">{quote.status} · {quote.project_type || "-"} · {quote.location || "-"} · {new Date(quote.created_at).toLocaleString()}</p>
                  </Link>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${String(quote.customer_phone || "").replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></Button>
                    <Button asChild size="sm" variant="outline"><a href={`tel:${String(quote.customer_phone || "").replace(/[^\d+]/g, "")}`}>电话</a></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminPageShell>
    </AdminLayout>
  );
};

export default AdminQuoteList;
