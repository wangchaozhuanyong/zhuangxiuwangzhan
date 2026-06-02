import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminContentHealth } from "@/lib/adminContentHealth";

const filters = [
  { key: "all", label: "全部" },
  { key: "required", label: "必填缺失" },
  { key: "english", label: "英文缺失" },
  { key: "seo", label: "SEO 缺失" },
  { key: "media", label: "图片缺失" },
  { key: "ok", label: "健康内容" },
];

export default function AdminContentHealth() {
  const { data: items = [], isFetching, refetch } = useAdminContentHealth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const summary = useMemo(() => {
    const broken = items.filter((item) => item.issues.length > 0);
    return {
      total: items.length,
      broken: broken.length,
      required: items.filter((item) => item.missingRequired.length > 0).length,
      english: items.filter((item) => item.missingEnglish.length > 0).length,
      seo: items.filter((item) => item.missingSeo.length > 0).length,
      media: items.filter((item) => item.missingMedia.length > 0).length,
      ok: items.length - broken.length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
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
  }, [filter, items, search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="内容健康检查"
        description="这里集中检查后台内容有没有缺中文、缺英文、缺 SEO、缺图片。先处理红色和黄色问题，前台展示会更稳定。"
        helpText="这个页面不会直接改内容，只帮你找问题。点击每条内容的“编辑”回到原来的编辑页面修改。"
        actions={
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching} aria-busy={isFetching}>
            <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            {isFetching ? "检查中..." : "重新检查"}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <AdminStatCard label="总内容" value={summary.total} helpText="后台可检查的动态内容总数。" />
        <AdminStatCard label="有问题" value={summary.broken} helpText="存在任意缺失项的内容数量，包含缺必填、缺英文、缺 SEO 和缺图片。" className={summary.broken ? "border-destructive/30" : ""} />
        <AdminStatCard label="缺必填" value={summary.required} helpText="标题、链接、状态等关键字段缺失。" />
        <AdminStatCard label="缺英文" value={summary.english} helpText="英文站需要的字段还没生成或没填写。" href="/admin/english-center" />
        <AdminStatCard label="缺 SEO" value={summary.seo} helpText="搜索标题或描述还没补齐。" href="/admin/seo" />
        <AdminStatCard label="缺图片" value={summary.media} helpText="前台卡片、封面或页面区块需要的图片还没设置。" />
        <AdminStatCard label="健康" value={summary.ok} helpText="基础字段都已经补齐的内容。" />
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="content-health-filter-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 id="content-health-filter-title" className="text-base font-semibold">筛选内容</h2>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              当前显示 {filtered.length} / {items.length} 条内容。
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-3 lg:max-w-4xl lg:flex-row lg:items-center lg:justify-end">
            <div className="relative min-w-0 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索内容名称、来源表或问题..."
                aria-label="搜索内容健康记录"
                className="min-h-10 pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="内容健康筛选">
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

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="内容健康结果">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_1.6fr_auto] gap-3 border-b border-border bg-muted/60 px-4 py-3 text-xs font-bold text-muted-foreground max-lg:hidden">
          <span>内容</span>
          <span>来源</span>
          <span>状态</span>
          <span>问题</span>
          <span>操作</span>
        </div>
        {filtered.map((item) => (
          <article
            key={`${item.table}-${item.id}`}
            className="grid gap-3 border-b border-border px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/35 lg:grid-cols-[1.2fr_0.8fr_0.6fr_1.6fr_auto] lg:items-start"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground lg:hidden">{item.tableLabel}</p>
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">{item.tableLabel}</p>
            <div>
              <AdminStatusBadge status={item.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {item.issues.length ? (
                item.issues.slice(0, 6).map((issue) => (
                  <span key={issue} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
                    {issue}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                  正常
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild size="sm" variant="outline" className="min-h-10">
                <Link to={item.editHref} aria-label={`编辑 ${item.title}`}>编辑</Link>
              </Button>
              {item.frontHref && (
                <Button asChild size="sm" variant="ghost" className="min-h-10">
                  <Link to={item.frontHref} aria-label={`查看前台 ${item.title}`}>前台</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="p-6">
            <AdminEmptyState title="没有符合条件的内容" description="可以换一个筛选条件，或清空搜索关键词后再检查。" />
          </div>
        )}
      </section>
    </div>
  );
}
