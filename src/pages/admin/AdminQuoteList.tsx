import { useAdminListingState } from "@/hooks/useAdminListingState";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterSummary from "@/components/admin/AdminFilterSummary";
import { adminMobileSaveText } from "@/i18n/adminMobileSaveText";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import { useAdminQuotes } from "@/lib/adminLeadQueries";
import { getAdminLang } from "@/lib/adminLocale";
import {
  getAdminWorkflowBadges,
  getAdminWorkflowOptions,
  normalizeAdminWorkflowFilter,
  type AdminWorkflowFilter,
} from "@/lib/adminLeadWorkflow";
import { adminQuoteListText } from "@/i18n/adminQuoteListText";
import { translateProjectType, translateStatusLabel } from "@/i18n/displayLabels";
import { telHrefFromPhone, whatsappHrefFromPhone } from "@/lib/contactLinks";
import { toast } from "@/hooks/use-toast";
import { formatSourcePath, formatUserFacingError } from "@/lib/userFacingText";

const statuses = ["all", "pending", "contacted", "site_visit_scheduled", "quoted", "accepted", "rejected", "closed"];
const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
type AdminQuoteListTextKey = keyof typeof adminQuoteListText;

const AdminQuoteList = () => {
  const lang = getAdminLang();
  const mobileText = adminMobileSaveText[lang];
  const A = (key: AdminQuoteListTextKey) => adminQuoteListText[key][lang];
  const formatA = (key: AdminQuoteListTextKey, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));
  const list = useAdminListingState();
  const { search, setSearch, page, setPage, deferredSearch } = list;
  const status = statuses.includes(list.filter("status")) ? list.filter("status") : "all";
  const workflow = normalizeAdminWorkflowFilter(list.filter("filter"), "quote_requests");

  const { data, error, isLoading, isFetching, isPlaceholderData } = useAdminQuotes({ page, status, workflow, search: deferredSearch });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const message = error ? formatUserFacingError(error, lang) : "";
  const initialLoading = isLoading;
  const workflowOptions = getAdminWorkflowOptions("quote_requests", lang);
  const activeFilters = [
    search.trim(),
    status !== "all" ? translateStatusLabel("quote_requests", status, lang) : "",
    workflow !== "all" ? workflowOptions.find((item) => item.value === workflow)?.label : "",
  ].filter((value): value is string => Boolean(value));

  const handleStatusChange = (value: string) => list.update({ status: value, filter: "all", page: 0 });
  const handleWorkflowChange = (value: AdminWorkflowFilter) => list.update({ status: "all", filter: value, page: 0 });

  const exportCsv = () => {
    const fields = ["created_at", "customer_name", "customer_phone", "customer_email", "project_type", "location", "property_size", "estimated_budget", "quoted_amount", "status", "source_path", "notes"];
    const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `quote-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: A("exportSuccess"),
      description: formatA("exportSuccessDescription", { rows: String(rows.length), total: String(total) }),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminPageHeader
        title={A("title")}
        description={A("description")}
        helpText={A("helpText")}
        actions={
          <Button type="button" variant="outline" onClick={exportCsv} disabled={rows.length === 0 || isPlaceholderData} title={formatA("exportCurrentTitle", { rows: String(rows.length), total: String(total) })}>
            {formatA("exportCurrentButton", { rows: String(rows.length), total: String(total) })}
          </Button>
        }
      />

      <div data-admin-filter-bar data-admin-filter-columns="2" className="grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <Input className="col-span-2 md:col-span-1" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={A("search")} aria-label={A("search")} />
        <label className="min-w-0 space-y-1 text-sm font-medium">
          <span className="block md:hidden">{A("status")}</span>
        <select
          value={status}
          onChange={(event) => handleStatusChange(event.target.value)}
          aria-label={A("status")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? A("statusAll") : translateStatusLabel("quote_requests", item, lang)}
            </option>
          ))}
        </select>
        </label>
        <label className="min-w-0 space-y-1 text-sm font-medium md:hidden">
          <span className="block">{mobileText.workflow}</span>
          <select value={workflow} onChange={(event) => handleWorkflowChange(normalizeAdminWorkflowFilter(event.target.value, "quote_requests"))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {workflowOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="hidden flex-wrap gap-2 md:flex" role="group" aria-label={mobileText.workflow}>
        {workflowOptions.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={workflow === item.value ? "default" : "outline"}
            aria-pressed={workflow === item.value}
            title={item.help}
            onClick={() => handleWorkflowChange(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <AdminFilterSummary filters={activeFilters} onClear={() => { setSearch(""); list.update({ status: "all", filter: "all", page: 0 }); }} />
      {message && <AdminAlert tone="error">{message}</AdminAlert>}

      {initialLoading ? (
        <AdminLoadingState />
      ) : (
      <div ref={(node) => node?.toggleAttribute("inert", isPlaceholderData)} aria-busy={isPlaceholderData} className="space-y-3">
        {rows.map((quote) => {
          const whatsappHref = whatsappHrefFromPhone(quote.customer_phone);
          const telHref = telHrefFromPhone(quote.customer_phone);
          const badges = getAdminWorkflowBadges("quote_requests", quote, lang);
          return (
            <div key={quote.id} className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Link to={`/admin/quotes/${quote.id}`} className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{quote.customer_name || "-"} · {quote.customer_phone || "-"}</p>
                  <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">{translateStatusLabel("quote_requests", quote.status || "pending", lang)} · {quote.project_type ? translateProjectType(quote.project_type, lang) : "-"} · {quote.location || "-"} · {formatSourcePath(quote.source_path, lang)} · {new Date(quote.created_at).toLocaleString("zh-CN")}</p>
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
                <div data-admin-card-actions className="flex gap-2 md:shrink-0 md:justify-end">
                  {whatsappHref ? <Button asChild size="sm" variant="outline"><a href={whatsappHref} target="_blank" rel="noreferrer">{A("whatsapp")}</a></Button> : <Button size="sm" variant="outline" disabled>{A("whatsapp")}</Button>}
                  {telHref ? <Button asChild size="sm" variant="outline"><a href={telHref}>{A("call")}</a></Button> : <Button size="sm" variant="outline" disabled>{A("call")}</Button>}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{A("empty")}</div>}
      </div>
      )}
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel={A("itemLabel")} onPageChange={setPage} />
    </div>
  );
};

export default AdminQuoteList;
