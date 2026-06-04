import { useDeferredValue, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminServices, type AdminServiceRow } from "@/lib/adminBusinessContentQueries";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import { adminServiceListText } from "@/i18n/adminServiceListText";
import { getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { formatUserFacingError } from "@/lib/userFacingText";

type AdminServiceListTextKey = keyof typeof adminServiceListText;

export default function AdminServiceList() {
  const language = getAdminLang();
  const A = (key: AdminServiceListTextKey) => adminServiceListText[key][language];
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const { data, error, isFetching, refetch } = useAdminServices({ page, status, search: deferredSearch });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const errorMessage = error ? formatUserFacingError(error, language) : "";

  useEffect(() => {
    setPage(0);
  }, [deferredSearch, status]);

  const columns: AdminDataTableColumn<AdminServiceRow>[] = [
    {
      key: "title",
      header: A("serviceHeader"),
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
      header: A("statusHeader"),
      className: "w-[120px]",
      cell: (row) => <AdminStatusBadge status={row.status || "draft"} />,
    },
    {
      key: "sort",
      header: A("sortHeader"),
      className: "w-[100px]",
      cell: (row) => <span className="tabular-nums text-sm text-muted-foreground">{row.sort_order ?? 0}</span>,
    },
    {
      key: "updated",
      header: A("updatedHeader"),
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
        title={A("title")}
        description={A("description")}
        helpText={A("helpText")}
        actions={
          <div data-admin-mobile-actions className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={!isSupabaseConfigured || isFetching}>
              {isFetching ? A("refreshing") : A("refresh")}
            </Button>
            <Button asChild>
              <Link to="/admin/services/new">{A("newService")}</Link>
            </Button>
          </div>
        }
      />

      <div data-admin-filter-bar className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={A("searchPlaceholder")} />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{A("allStatuses")}</option>
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
            title={A("emptyTitle")}
            description={A("emptyDescription")}
            action={
              <Button asChild>
                <Link to="/admin/services/new">{A("newService")}</Link>
              </Button>
            }
          />
        }
      />
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel={A("itemLabel")} onPageChange={setPage} />
    </>
  );
}
