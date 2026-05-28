import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminLayout from "./AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

type ServiceRow = {
  id: string;
  title_zh: string | null;
  title_en: string | null;
  slug: string;
  status: string | null;
  sort_order: number | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export default function AdminServiceList() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError("");
    const { data, error } = await supabase!
      .from("services")
      .select("id,title_zh,title_en,slug,status,sort_order,updated_at,created_at")
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((data || []) as ServiceRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || (row.status || "draft") === status;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [row.title_zh, row.title_en, row.slug].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, status]);

  const columns: AdminDataTableColumn<ServiceRow>[] = [
    {
      key: "title",
      header: "服务",
      cell: (row) => (
        <div className="min-w-0">
          <Link to={`/admin/services/${row.id}`} className="font-medium hover:underline">
            {row.title_zh || row.title_en || row.slug}
          </Link>
          <div className="mt-0.5 text-xs text-muted-foreground">/{row.slug}</div>
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
    <AdminLayout>
      <AdminPageHeader
        title="服务项目"
        description="管理服务列表与服务详情内容。保存后前台服务列表与详情会同步更新。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={load} disabled={!isSupabaseConfigured || loading}>
              {loading ? "刷新中..." : "刷新"}
            </Button>
            <Button asChild>
              <Link to="/admin/services/new">新建服务</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索标题或 slug..." />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">全部状态</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
          <option value="archived">archived</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg bg-muted p-3 text-sm">{error}</div>}

      <AdminDataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        empty={
          <AdminEmptyState
            title="暂无服务"
            description="先新建一个服务项目，发布后前台 /services 会显示。"
            action={
              <Button asChild>
                <Link to="/admin/services/new">新建服务</Link>
              </Button>
            }
          />
        }
      />
    </AdminLayout>
  );
}

