import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { adminPublishCenterStatusFilters, adminPublishCenterText } from "@/i18n/adminPublishCenterText";
import { getAdminLang } from "@/lib/adminLocale";
import { useAdminContentHealth } from "@/lib/adminContentHealth";

const statusFilters = ["all", "draft", "published", "archived", "issues"] as const;
type StatusFilter = (typeof statusFilters)[number];
type AdminPublishCenterTextKey = keyof typeof adminPublishCenterText;

const formatTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function AdminPublishCenter() {
  const language = getAdminLang();
  const A = (key: AdminPublishCenterTextKey) => adminPublishCenterText[key][language];
  const formatA = (key: AdminPublishCenterTextKey, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), A(key));
  const filterLabel = (key: StatusFilter) => adminPublishCenterStatusFilters[key][language];
  const { data: items = [], isFetching, refetch } = useAdminContentHealth();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const summary = useMemo(
    () => {
      const publishableItems = items.filter((item) => item.status !== "archived");
      return {
        total: items.length,
        draft: items.filter((item) => item.status === "draft").length,
        published: items.filter((item) => item.status === "published").length,
        archived: items.filter((item) => item.status === "archived").length,
        issues: publishableItems.filter((item) => item.issues.length > 0).length,
      };
    },
    [items],
  );

  const filtered = useMemo(() => {
    return items
      .filter((item) => filter === "all" || (filter === "issues" ? item.status !== "archived" && item.issues.length > 0 : item.status === filter))
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  }, [filter, items]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={A("title")}
        description={A("description")}
        helpText={A("helpText")}
        actions={
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? A("refreshing") : A("refreshStatus")}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label={A("totalContent")} value={summary.total} helpText={A("totalContentHelp")} />
        <AdminStatCard label={A("drafts")} value={summary.draft} helpText={A("draftsHelp")} />
        <AdminStatCard label={A("published")} value={summary.published} helpText={A("publishedHelp")} />
        <AdminStatCard label={A("archived")} value={summary.archived} helpText={A("archivedHelp")} />
        <AdminStatCard label={A("publishRisk")} value={summary.issues} helpText={A("publishRiskHelp")} href="/admin/content-health" />
      </div>

      <div data-admin-card-actions className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4 sm:p-5">
        {statusFilters.map((item) => (
          <Button key={item} type="button" variant={filter === item ? "default" : "outline"} size="sm" onClick={() => setFilter(item)}>
            {filterLabel(item)}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((item) => (
          <article key={`${item.table}-${item.id}`} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <AdminStatusBadge status={item.status} />
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{item.tableLabel}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatA("updatedAt", { time: formatTime(item.updated_at) })}</p>
                {item.issues.length > 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{formatA("issuesBeforePublish", { issues: item.issues.slice(0, 4).join(language === "zh" ? "、" : ", ") })}</p>}
              </div>
              <div data-admin-card-actions className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={item.editHref}>{A("edit")}</Link>
                </Button>
                {item.frontHref && (
                  <Button asChild size="sm" variant="ghost">
                    <Link to={item.frontHref}>{A("viewFrontend")}</Link>
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">{A("empty")}</div>}
      </div>
    </div>
  );
}
