import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminBlogPosts, type AdminBlogRow } from "@/lib/adminQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import SmartImage from "@/components/SmartImage";
import { publishStatusOptions } from "@/lib/adminLocale";

export default function AdminBlogList() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const { data, error, isFetching, refetch } = useAdminBlogPosts({ page, status, search: deferredSearch });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : "";

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, status]);

  const columns: AdminDataTableColumn<AdminBlogRow>[] = [
    {
      key: "post",
      header: "文章",
      cell: (row) => {
        const title = row.title_zh || row.title_en || row.slug;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-14 overflow-hidden rounded-md border border-border bg-muted">
              {row.cover_image_url ? <SmartImage src={row.cover_image_url} alt={title} className="h-full w-full object-cover" width={112} height={80} /> : null}
            </div>
            <div className="min-w-0">
              <Link to={`/admin/blog/${row.id}`} className="font-medium hover:underline">
                {title}
              </Link>
              <div className="mt-0.5 text-xs text-muted-foreground">/{row.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "meta",
      header: "分类 / 发布时间",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <div>{row.category || "-"}</div>
          <div>{row.published_at ? new Date(row.published_at).toLocaleString() : "-"}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "状态",
      className: "w-[120px]",
      cell: (row) => <AdminStatusBadge status={row.status || "draft"} />,
    },
    {
      key: "sort",
      header: "排序",
      className: "w-[100px]",
      cell: (row) => <span className="tabular-nums text-sm text-muted-foreground">{row.sort_order ?? 0}</span>,
    },
    {
      key: "updated",
      header: "更新",
      className: "w-[180px]",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.updated_at ? new Date(row.updated_at).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : "-"}
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="博客文章"
        description="管理博客列表、封面图、发布时间、SEO 与发布状态。发布后会在前台博客页生效。"
        helpText="这里主要管博客文章的发布、排序、封面、分类和搜索优化。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={!isSupabaseConfigured || isFetching}>
              {isFetching ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild>
              <Link to="/admin/blog/new">新建文章</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索标题、链接标识、分类..." />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">全部状态</option>
          {publishStatusOptions().map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{errorMessage}</div>}

      <AdminDataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={
          <AdminEmptyState
            title="暂无文章"
            description="先新建一篇文章并发布，前台博客页会显示。"
            action={
              <Button asChild>
                <Link to="/admin/blog/new">新建文章</Link>
              </Button>
            }
          />
        }
      />
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel="篇文章" onPageChange={setPage} />
    </>
  );
}
