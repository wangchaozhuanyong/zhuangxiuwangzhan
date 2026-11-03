import { useAdminListingState } from "@/hooks/useAdminListingState";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminContentHealthFilters, adminContentHealthText } from "@/i18n/adminContentHealthText";
import { adminAuditScopeText } from "@/i18n/adminAuditScopeText";
import { useAdminContentHealth } from "@/lib/adminContentHealth";
import { useAdminLang } from "@/lib/adminLocale";
import { adminAuditScopes, matchesAdminAuditScope, resolveAdminAuditScope } from "@/lib/adminAuditScope";

type AdminContentHealthTextKey = keyof typeof adminContentHealthText;
type AdminContentHealthFilterKey = (typeof adminContentHealthFilters)[number]["key"];

const emptyContentHealthItems: NonNullable<ReturnType<typeof useAdminContentHealth>["data"]> = [];

export default function AdminContentHealth() {
  const language = useAdminLang();
  const A = (key: AdminContentHealthTextKey) => adminContentHealthText[key][language];
  const formatA = (key: AdminContentHealthTextKey, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));
  const { data, isLoading, isFetching, isInitialError, refreshError, refetch } = useAdminContentHealth();
  const items = data ?? emptyContentHealthItems;
  const initialLoading = isLoading || (data === undefined && !isInitialError);
  const list = useAdminListingState();
  const scope = resolveAdminAuditScope(list.filter("scope") as string);
  const filter = list.filter("filter") as AdminContentHealthFilterKey;
  const setFilter = (value: AdminContentHealthFilterKey) => list.setFilter("filter", value);
  const { search, setSearch } = list;
  const filters = adminContentHealthFilters.map((item) => ({
    key: item.key,
    label: item.label[language],
  }));
  const failedSources = useMemo(() => items.filter((item) => item.status === "error"), [items]);
  const scopedItems = useMemo(() => items.filter((item) => item.status !== "error" && matchesAdminAuditScope(item.status, scope)), [items, scope]);
  const incomplete = failedSources.length > 0;
  const displayCount = (count: number) => data === undefined || incomplete && count === 0 ? A("pendingCount") : count;

  const summary = useMemo(() => {
    const broken = scopedItems.filter((item) => item.issues.length > 0);
    return {
      total: scopedItems.length,
      broken: broken.length,
      required: scopedItems.filter((item) => item.missingRequired.length > 0).length,
      english: scopedItems.filter((item) => item.missingEnglish.length > 0).length,
      seo: scopedItems.filter((item) => item.missingSeo.length > 0).length,
      media: scopedItems.filter((item) => item.missingMedia.length > 0).length,
      ok: scopedItems.length - broken.length,
    };
  }, [scopedItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedItems.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "required" && item.missingRequired.length > 0) ||
        (filter === "english" && item.missingEnglish.length > 0) ||
        (filter === "seo" && item.missingSeo.length > 0) ||
        (filter === "media" && item.missingMedia.length > 0) ||
        (filter === "ok" && item.issues.length === 0);
      const haystack = [item.tableLabel, item.table, item.title, item.status, ...item.issues].join(" ").toLowerCase();
      return matchesFilter && (!q || haystack.includes(q));
    });
  }, [filter, scopedItems, search]);

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <AdminPageHeader
        title={A("pageTitle")}
        description={A("pageDescription")}
        helpText={A("pageHelpText")}
        actions={
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching} aria-busy={isFetching}>
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            {isFetching ? A("checking") : A("recheck")}
          </Button>
        }
      />

      {initialLoading ? (
        <AdminLoadingState label={A("checking")} />
      ) : isInitialError ? (
        <AdminAlert tone="error">{A("loadFailed")}</AdminAlert>
      ) : (
      <>

      <p className="text-sm text-muted-foreground">{adminAuditScopeText.recordNotice[language]}</p>
      {incomplete && (
        <AdminAlert tone="warning">{formatA("incompleteRead", { sources: failedSources.map((item) => item.tableLabel).join(language === "zh" ? "、" : ", ") })}</AdminAlert>
      )}
      {refreshError && <AdminAlert tone="error">{A("refreshFailed")}</AdminAlert>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <AdminStatCard label={A("totalContent")} value={displayCount(summary.total)} helpText={A("totalContentHelp")} />
        <AdminStatCard label={A("brokenContent")} value={displayCount(summary.broken)} helpText={A("brokenContentHelp")} className={summary.broken ? "border-destructive/30" : ""} />
        <AdminStatCard label={A("requiredMissing")} value={displayCount(summary.required)} helpText={A("requiredMissingHelp")} />
        <AdminStatCard label={A("englishMissing")} value={displayCount(summary.english)} helpText={A("englishMissingHelp")} href="/admin/english-center" />
        <AdminStatCard label={A("seoMissing")} value={displayCount(summary.seo)} helpText={A("seoMissingHelp")} href="/admin/seo" />
        <AdminStatCard label={A("mediaMissing")} value={displayCount(summary.media)} helpText={A("mediaMissingHelp")} />
        <AdminStatCard label={A("healthy")} value={displayCount(summary.ok)} helpText={A("healthyHelp")} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="content-health-filter-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 id="content-health-filter-title" className="text-base font-semibold">{A("filterTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {incomplete && scopedItems.length === 0
                ? A("incompleteEmptyTitle")
                : formatA("currentCount", { filtered: String(filtered.length), total: String(scopedItems.length) })}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-3 lg:max-w-4xl lg:flex-row lg:items-center lg:justify-end">
            <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
              {adminAuditScopeText.scopeLabel[language]}
              <select
                aria-label={adminAuditScopeText.scopeLabel[language]}
                value={scope}
                onChange={(event) => list.setFilter("scope", event.target.value)}
                className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {adminAuditScopes.map((value) => <option key={value} value={value}>{adminAuditScopeText[value][language]}</option>)}
              </select>
            </label>
            <div className="relative min-w-0 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={A("searchPlaceholder")}
                aria-label={A("searchAria")}
                className="min-h-10 pl-9"
              />
            </div>
            <div data-admin-card-actions className="flex flex-wrap gap-2" role="group" aria-label={A("filterAria")}>
            {filters.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={filter === item.key ? "default" : "outline"}
                size="sm"
                className="min-h-10"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label={A("resultsAria")}>
        <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_1.6fr_auto] gap-3 border-b border-border bg-muted/60 px-4 py-3 text-xs font-bold text-muted-foreground max-lg:hidden">
          <span>{A("columnContent")}</span>
          <span>{A("columnSource")}</span>
          <span>{A("columnStatus")}</span>
          <span>{A("columnIssues")}</span>
          <span>{A("columnActions")}</span>
        </div>
        {filtered.map((item) => (
          <article
            key={`${item.table}-${item.id}`}
            className="grid gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/35 lg:grid-cols-[1.2fr_0.8fr_0.6fr_1.6fr_auto] lg:items-start"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground lg:hidden">{item.tableLabel}</p>
              {item.notice && <p className="mt-2 break-words text-xs text-muted-foreground">{item.notice}</p>}
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">{item.tableLabel}</p>
            <div>
              <AdminStatusBadge status={item.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {item.issues.length ? (
                item.issues.slice(0, 6).map((issue) => (
                  <span key={issue} className="rounded-full border px-2.5 py-1 text-xs admin-tone-warning">
                    {issue}
                  </span>
                ))
              ) : (
                <span className="rounded-full border px-2.5 py-1 text-xs admin-tone-success">
                  {A("normal")}
                </span>
              )}
            </div>
            <div data-admin-card-actions className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild size="sm" variant="outline" className="min-h-10">
                <Link to={item.editHref} aria-label={formatA("editAria", { title: item.title })}>{A("edit")}</Link>
              </Button>
              {item.frontHref && (
                <Button asChild size="sm" variant="ghost" className="min-h-10">
                  <Link to={item.frontHref} aria-label={formatA("frontendAria", { title: item.title })}>{A("frontend")}</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="p-6">
            <AdminEmptyState title={A(incomplete ? "incompleteEmptyTitle" : "emptyTitle")} description={A(incomplete ? "incompleteEmptyDescription" : "emptyDescription")} />
          </div>
        )}
      </section>
      </>
      )}
    </div>
  );
}
