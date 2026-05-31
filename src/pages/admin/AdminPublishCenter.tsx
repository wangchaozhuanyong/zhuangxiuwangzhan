import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { useAdminContentHealth } from "@/lib/adminQueries";

const statusFilters = [
  { key: "all", label: "全部" },
  { key: "draft", label: "草稿" },
  { key: "published", label: "已发布" },
  { key: "archived", label: "已归档" },
  { key: "issues", label: "发布前有问题" },
];

const formatTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function AdminPublishCenter() {
  const { data: items = [], isFetching, refetch } = useAdminContentHealth();
  const [filter, setFilter] = useState("all");

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
        title="发布中心"
        description="这里集中看哪些内容是草稿、哪些已发布、哪些归档，以及发布前还有没有缺英文、缺 SEO、缺图片。"
        helpText="这个页面先做发布总览和风险提醒。真正修改内容请点“编辑”，进入对应编辑器保存或发布。"
        actions={
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "刷新中..." : "刷新发布状态"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="全部内容" value={summary.total} helpText="发布中心可看到的内容总数。" />
        <AdminStatCard label="草稿" value={summary.draft} helpText="还没有正式发布到前台的内容。" />
        <AdminStatCard label="已发布" value={summary.published} helpText="理论上前台可以读取到的内容。" />
        <AdminStatCard label="已归档" value={summary.archived} helpText="已从正常展示流程移出的内容。" />
        <AdminStatCard label="发布风险" value={summary.issues} helpText="只统计草稿和已发布内容的缺失项，已归档内容不算发布风险。" href="/admin/content-health" />
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-5">
        {statusFilters.map((item) => (
          <Button key={item.key} type="button" variant={filter === item.key ? "default" : "outline"} size="sm" onClick={() => setFilter(item.key)}>
            {item.label}
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
                <p className="mt-1 text-xs text-muted-foreground">最近更新：{formatTime(item.updated_at)}</p>
                {item.issues.length > 0 && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">发布前建议修复：{item.issues.slice(0, 4).join("、")}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={item.editHref}>编辑</Link>
                </Button>
                {item.frontHref && (
                  <Button asChild size="sm" variant="ghost">
                    <Link to={item.frontHref}>看前台</Link>
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">没有符合条件的发布内容。</div>}
      </div>
    </div>
  );
}
