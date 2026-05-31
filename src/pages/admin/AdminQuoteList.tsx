import { useDeferredValue, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListPager from "@/components/admin/AdminListPager";
import { useAdminQuotes } from "@/lib/adminQueries";
import { getAdminLang } from "@/lib/adminLocale";
import {
  getAdminWorkflowBadges,
  getAdminWorkflowOptions,
  normalizeAdminWorkflowFilter,
  type AdminWorkflowFilter,
} from "@/lib/adminLeadWorkflow";
import { translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";

const statuses = ["all", "pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"];
const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const copy = {
  en: { title: "Quote Requests", search: "Search customer, phone, project, location...", statusAll: "All statuses", exportCsv: "Export CSV", empty: "No quote requests found.", whatsapp: "WhatsApp", call: "Call" },
  zh: { title: "报价请求", search: "搜索客户、电话、项目、地区...", statusAll: "全部状态", exportCsv: "导出 CSV", empty: "暂无报价请求。", whatsapp: "WhatsApp 联系", call: "拨打电话" },
};

const AdminQuoteList = () => {
  const lang = getAdminLang();
  const t = copy[lang];
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [workflow, setWorkflow] = useState<AdminWorkflowFilter>(() => normalizeAdminWorkflowFilter(searchParams.get("filter"), "quote_requests"));
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const { data, error, isFetching } = useAdminQuotes({ page, status, workflow, search: deferredSearch });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const message = error ? (error as Error).message : "";
  const workflowOptions = getAdminWorkflowOptions("quote_requests", lang);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, status, workflow]);

  useEffect(() => {
    const nextStatus = searchParams.get("status") || "all";
    setStatus(statuses.includes(nextStatus) ? nextStatus : "all");
    setWorkflow(normalizeAdminWorkflowFilter(searchParams.get("filter"), "quote_requests"));
  }, [searchParams]);

  const updateListParams = (next: { status?: string; filter?: AdminWorkflowFilter }) => {
    const params = new URLSearchParams(searchParams);
    if (next.status !== undefined) {
      if (next.status === "all") params.delete("status");
      else params.set("status", next.status);
    }
    if (next.filter !== undefined) {
      if (next.filter === "all") params.delete("filter");
      else params.set("filter", next.filter);
    }
    setSearchParams(params, { replace: true });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setWorkflow("all");
    updateListParams({ status: value, filter: "all" });
  };

  const handleWorkflowChange = (value: AdminWorkflowFilter) => {
    setWorkflow(value);
    setStatus("all");
    updateListParams({ status: "all", filter: value });
  };

  const exportCsv = () => {
    const fields = ["created_at", "customer_name", "customer_phone", "customer_email", "project_type", "location", "property_size", "estimated_budget", "quoted_amount", "status", "source_path", "notes"];
    const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `quote-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description="查看报价请求，适合先看项目类型、地区和预算，再安排报价回复。"
        helpText="这里收的是用户主动提交的报价表单，信息比咨询页更完整，方便直接做预算判断。"
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            {t.exportCsv}
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} />
        <select value={status} onChange={(event) => handleStatusChange(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? t.statusAll : translateStatusLabel("quote_requests", item, lang)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {workflowOptions.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={workflow === item.value ? "default" : "outline"}
            title={item.help}
            onClick={() => handleWorkflowChange(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {message && <p className="rounded-lg bg-muted p-3 text-sm">{message}</p>}

      <div className="space-y-3">
        {rows.map((quote) => {
          const whatsappHref = whatsappHrefFromPhone(quote.customer_phone);
          const telHref = telHrefFromPhone(quote.customer_phone);
          const badges = getAdminWorkflowBadges("quote_requests", quote, lang);
          return (
            <div key={quote.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Link to={`/admin/quotes/${quote.id}`} className="min-w-0">
                  <p className="font-semibold">{quote.customer_name || "-"} · {quote.customer_phone || "-"}</p>
                  <p className="truncate text-xs text-muted-foreground">{translateStatusLabel("quote_requests", quote.status || "pending", lang)} · {quote.project_type || "-"} · {quote.location || "-"} · {quote.source_path || "-"} · {new Date(quote.created_at).toLocaleString("zh-CN")}</p>
                  {badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <Badge key={badge.label} variant={badge.variant}>
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Link>
                <div className="flex gap-2">
                  {whatsappHref ? <Button asChild size="sm" variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">{t.whatsapp}</a></Button> : <Button size="sm" variant="outline" disabled>{t.whatsapp}</Button>}
                  {telHref ? <Button asChild size="sm" variant="outline"><a href={telHref}>{t.call}</a></Button> : <Button size="sm" variant="outline" disabled>{t.call}</Button>}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</div>}
      </div>
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel="条报价" onPageChange={setPage} />
    </div>
  );
};

export default AdminQuoteList;
