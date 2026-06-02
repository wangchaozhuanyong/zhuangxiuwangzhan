import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { useAdminSeoAudit } from "@/lib/adminSeoAudit";
import { adminStatusLabel } from "@/lib/adminLocale";

const AdminSeoManager = () => {
  const { data: rows = [], isFetching, isError, error, refetch } = useAdminSeoAudit();
  const [status, setStatus] = useState("all");

  const checkedRows = useMemo(() => rows.map((row) => {
    const issues: string[] = [];
    if (row.error) issues.push(String(row.error));
    if (!row.seo_title_zh) issues.push("缺中文 SEO 标题");
    if (!row.seo_description_zh) issues.push("缺中文 SEO 描述");
    if (!row.seo_title_en) issues.push("缺英文 SEO 标题");
    if (!row.seo_description_en) issues.push("缺英文 SEO 描述");
    if (row.seo_description_zh && String(row.seo_description_zh).length < 50) issues.push("中文描述偏短");
    if (row.seo_description_en && String(row.seo_description_en).length < 50) issues.push("英文描述偏短");
    if (row.table !== "site_pages" && !row.slug) issues.push("缺链接标识");
    if ((row.image_url || row.cover_image_url || row.hero_image_url) && !row.alt_zh && !row.alt_en) issues.push("图片说明缺失");
    return { ...row, issues };
  }), [rows]);

  const filtered = checkedRows.filter((row) => {
    if (status === "missing") return row.issues.length > 0;
    if (status === "ok") return row.issues.length === 0;
    return true;
  });

  const duplicateSlugs = useMemo(() => {
    const seen = new Map<string, number>();
    checkedRows.forEach((row) => {
      if (row.slug) seen.set(`${row.table}:${row.slug}`, (seen.get(`${row.table}:${row.slug}`) || 0) + 1);
    });
    return seen;
  }, [checkedRows]);

  const loadMessage = isError
    ? (error instanceof Error ? error.message : String(error))
    : isFetching
      ? "正在加载 SEO 数据..."
      : "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="搜索优化管理"
        description="检查服务、案例、材料、博客、地区和落地页的搜索优化缺失项。"
        helpText="这里用来检查每个页面有没有补齐标题、描述、链接标识和图片说明。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "刷新中..." : "刷新"}
            </Button>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="all">全部</option>
              <option value="missing">只看缺失</option>
              <option value="ok">只看通过</option>
            </select>
          </div>
        }
      />

      {loadMessage && <p className="rounded-lg bg-muted p-3 text-sm">{loadMessage}</p>}

      <div className="space-y-3">
        {filtered.map((row) => {
          const rowRecord = row as typeof row & { path?: string; page_key?: string };
          const duplicate = row.slug && (duplicateSlugs.get(`${row.table}:${row.slug}`) || 0) > 1;
          const issues = duplicate ? [...row.issues, "链接标识重复"] : row.issues;
          const editUrl = row.table === "site_pages" ? row.source.route : `${row.source.route}/${row.id}`;
          const frontUrl = row.table === "site_pages" ? String(rowRecord.path || row.source.front || "/") : row.slug ? `${row.source.front}/${row.slug}` : row.source.front;
          return (
            <article key={`${row.table}-${row.id || row.error}`} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{row.title_zh || row.title_en || row.name || rowRecord.page_key || row.slug || row.source.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.source.label} · {rowRecord.path || row.slug || "-"} · {adminStatusLabel("default", row.status || "-")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {issues.length ? issues.map((issue) => <span key={issue} className="rounded-full bg-destructive/10 px-2 py-1 text-xs text-destructive">{issue}</span>) : <span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">搜索优化通过</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link to={editUrl}>编辑</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to={frontUrl}>前台页</Link></Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default AdminSeoManager;
