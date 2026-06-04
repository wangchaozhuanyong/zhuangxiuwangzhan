import { useDeferredValue, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListPager from "@/components/admin/AdminListPager";
import { useAdminLeads } from "@/lib/adminLeadQueries";
import { getAdminLang } from "@/lib/adminLocale";
import {
  getAdminWorkflowBadges,
  getAdminWorkflowOptions,
  normalizeAdminWorkflowFilter,
  type AdminWorkflowFilter,
} from "@/lib/adminLeadWorkflow";
import { adminLeadListText } from "@/i18n/adminLeadListText";
import { translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";
import { toast } from "@/hooks/use-toast";
import { formatSourcePath, formatUserFacingError } from "@/lib/userFacingText";

const statuses = ["all", "new", "contacted", "site_visit_scheduled", "quoted", "converted", "closed", "spam"];

type AdminLeadListTextKey = keyof typeof adminLeadListText;

const A = (key: AdminLeadListTextKey) => adminLeadListText[key][getAdminLang()];

const formatA = (key: AdminLeadListTextKey, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));

const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const AdminLeadList = () => {
  const lang = getAdminLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [workflow, setWorkflow] = useState<AdminWorkflowFilter>(() => normalizeAdminWorkflowFilter(searchParams.get("filter"), "leads"));
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const { data, error, isFetching } = useAdminLeads({ page, status, workflow, search: deferredSearch });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const message = error ? formatUserFacingError(error, lang) : "";
  const workflowOptions = getAdminWorkflowOptions("leads", lang);

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, status, workflow]);

  useEffect(() => {
    const nextStatus = searchParams.get("status") || "all";
    setStatus(statuses.includes(nextStatus) ? nextStatus : "all");
    setWorkflow(normalizeAdminWorkflowFilter(searchParams.get("filter"), "leads"));
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
    const fields = ["created_at", "name", "phone", "email", "project_type", "location", "status", "source_path", "message", "notes"];
    const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: A("exportSuccess"),
      description: formatA("exportSuccessDescription", { rows: String(rows.length), total: String(total) }),
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={A("title")}
        description={A("description")}
        helpText={A("helpText")}
        actions={
          <Button type="button" variant="outline" onClick={exportCsv} disabled={rows.length === 0} title={formatA("exportCurrentTitle", { rows: String(rows.length), total: String(total) })}>
            {formatA("exportCurrentButton", { rows: String(rows.length), total: String(total) })}
          </Button>
        }
      />

      <div data-admin-filter-bar className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={A("search")} />
        <select value={status} onChange={(event) => handleStatusChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? A("statusAll") : translateStatusLabel("leads", item, lang)}
            </option>
          ))}
        </select>
      </div>
      <div data-admin-card-actions className="flex flex-wrap gap-2">
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
        {rows.map((lead) => {
          const whatsappHref = whatsappHrefFromPhone(lead.phone);
          const telHref = telHrefFromPhone(lead.phone);
          const badges = getAdminWorkflowBadges("leads", lead, lang);
          return (
            <div key={lead.id} className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Link to={`/admin/leads/${lead.id}`} className="min-w-0">
                  <p className="break-words font-semibold">{lead.name || "-"} · {lead.phone || "-"}</p>
                  <p className="break-words text-xs text-muted-foreground md:truncate">{translateStatusLabel("leads", lead.status || "new", lang)} · {formatSourcePath(lead.source_path, lang)} · {new Date(lead.created_at).toLocaleString("zh-CN")}</p>
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
                <div data-admin-card-actions className="flex gap-2 md:justify-end">
                  {whatsappHref ? <Button asChild size="sm" variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">{A("whatsapp")}</a></Button> : <Button size="sm" variant="outline" disabled>{A("whatsapp")}</Button>}
                  {telHref ? <Button asChild size="sm" variant="outline"><a href={telHref}>{A("call")}</a></Button> : <Button size="sm" variant="outline" disabled>{A("call")}</Button>}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{A("empty")}</div>}
      </div>
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel={A("pagerItemLabel")} onPageChange={setPage} />
    </div>
  );
};

export default AdminLeadList;
