import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminProjects, type AdminProjectRow } from "@/lib/adminQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import SmartImage from "@/components/SmartImage";
import { publishStatusOptions } from "@/lib/adminLocale";

const pickThumbnail = (row: AdminProjectRow) => {
  const images = (row.project_images || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const cover = images.find((img) => img.image_type === "cover");
  const gallery = images.find((img) => img.image_type === "gallery");
  return cover?.image_url || gallery?.image_url || row.image_url || "";
};

export default function AdminProjectList() {
  const { data: rows = [], error, isFetching, refetch } = useAdminProjects();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || (row.status || "draft") === status;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [row.title_zh, row.title_en, row.slug, row.location, row.project_type].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, status]);

  const columns: AdminDataTableColumn<AdminProjectRow>[] = [
    {
      key: "project",
      header: "案例",
      cell: (row) => {
        const thumb = pickThumbnail(row);
        const title = row.title_zh || row.title_en || row.slug;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-14 overflow-hidden rounded-md border border-border bg-muted">
              {thumb ? <SmartImage src={thumb} alt={title} className="h-full w-full object-cover" width={112} height={80} /> : null}
            </div>
            <div className="min-w-0">
              <Link to={`/admin/projects/${row.id}`} className="font-medium hover:underline">
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
      header: "类型 / 地区",
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <div>{row.project_type || "—"}</div>
          <div>{row.location || "—"}</div>
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
          {row.updated_at ? new Date(row.updated_at).toLocaleString() : row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <>
    <AdminPageHeader
        title="装修案例"
        description="管理案例列表、封面/图库/Before-After 图片、SEO 与发布状态。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={!isSupabaseConfigured || isFetching}>
              {isFetching ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild>
              <Link to="/admin/projects/new">新建案例</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索标题、slug、地区、类型..." />
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
        rows={filtered}
        rowKey={(r) => r.id}
        empty={
          <AdminEmptyState
            title="暂无案例"
            description="先新建一个案例并发布，前台 /projects 将显示该案例。"
            action={
              <Button asChild>
                <Link to="/admin/projects/new">新建案例</Link>
              </Button>
            }
          />
        }
      />
    </>
  );
}

