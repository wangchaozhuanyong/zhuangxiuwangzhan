import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminContentHealth } from "@/lib/adminQueries";

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
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
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

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索内容名称、来源表或问题..." className="lg:max-w-md" />
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <Button key={item.key} type="button" variant={filter === item.key ? "default" : "outline"} size="sm" onClick={() => setFilter(item.key)}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_1.6fr_auto] gap-3 border-b border-border bg-muted/50 px-4 py-3 text-xs font-bold text-muted-foreground max-lg:hidden">
          <span>内容</span>
          <span>来源</span>
          <span>状态</span>
          <span>问题</span>
          <span>操作</span>
        </div>
        {filtered.map((item) => (
          <article key={`${item.table}-${item.id}`} className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 lg:grid-cols-[1.2fr_0.8fr_0.6fr_1.6fr_auto] lg:items-start">
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.title}</p>
            </div>
            <p className="text-sm text-muted-foreground">{item.tableLabel}</p>
            <AdminStatusBadge status={item.status} />
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
              <Button asChild size="sm" variant="outline">
                <Link to={item.editHref}>编辑</Link>
              </Button>
              {item.frontHref && (
                <Button asChild size="sm" variant="ghost">
                  <Link to={item.frontHref}>前台</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="p-8 text-sm text-muted-foreground">没有符合条件的内容。</div>}
      </div>
    </div>
  );
}
