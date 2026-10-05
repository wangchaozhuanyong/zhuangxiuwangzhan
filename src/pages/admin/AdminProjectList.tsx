import { useAdminListingState } from "@/hooks/useAdminListingState";

import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminProjects, type AdminProjectRow } from "@/lib/adminBusinessContentQueries";
import AdminFilterSummary from "@/components/admin/AdminFilterSummary";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import SmartImage from "@/components/SmartImage";
import { adminProjectListText } from "@/i18n/adminProjectListText";
import { translateProjectType } from "@/i18n/displayLabels";
import { getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { formatUserFacingError } from "@/lib/userFacingText";

type AdminProjectListTextKey = keyof typeof adminProjectListText;

const pickThumbnail = (row: AdminProjectRow) => {
  const images = (row.project_images || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const cover = images.find((img) => img.image_type === "cover");
  const gallery = images.find((img) => img.image_type === "gallery");
  return cover?.image_url || gallery?.image_url || row.image_url || "";
};

export default function AdminProjectList() {
  const language = getAdminLang();
  const A = (key: AdminProjectListTextKey) => adminProjectListText[key][language];
  const list = useAdminListingState();
  const { search, setSearch, deferredSearch, page, setPage } = list;
  const status = list.filter("status");
  const setStatus = (value: string) => list.setFilter("status", value);

  const { data, error, isLoading, isFetching, isPlaceholderData, refetch } = useAdminProjects({ page, status, search: deferredSearch });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const errorMessage = error ? formatUserFacingError(error, language) : "";
  const initialLoading = isLoading;


  const columns: AdminDataTableColumn<AdminProjectRow>[] = [
    {
      key: "project",
      mobileRole: "title",
      header: A("projectHeader"),
      cell: (row) => {
        const thumb = pickThumbnail(row);
        const title = row.title_zh || row.title_en || row.slug;
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {thumb ? <SmartImage src={thumb} alt={title} className="h-full w-full object-cover" width={112} height={80} /> : null}
            </div>
            <div className="min-w-0">
              <Link to={`/admin/projects/${row.id}`} className="font-medium hover:underline">
                {title}
              </Link>
              <div className="mt-0.5 hidden text-xs text-muted-foreground md:block">/{row.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "meta",
      header: A("metaHeader"),
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <div>{row.project_type ? translateProjectType(row.project_type, language) : "-"}</div>
          <div>{row.location || "-"}</div>
        </div>
      ),
    },
    {
      key: "status",
      mobileRole: "badge",
      header: A("statusHeader"),
      className: "w-[120px]",
      cell: (row) => <AdminStatusBadge status={row.status || "draft"} />,
    },
    {
      key: "sort",
      mobileRole: "detail",
      header: A("sortHeader"),
      className: "w-[100px]",
      cell: (row) => <span className="tabular-nums text-sm text-muted-foreground">{row.sort_order ?? 0}</span>,
    },
    {
      key: "updated",
      mobileRole: "detail",
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
              <Link to="/admin/projects/new">{A("newProject")}</Link>
            </Button>
          </div>
        }
      />

      <div data-admin-filter-bar className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={A("searchPlaceholder")} aria-label={A("searchPlaceholder")} />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label={A("statusHeader")}
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

      <AdminFilterSummary
        filters={[
          ...(status !== "all" ? [publishStatusOptions().find((option) => option.value === status)?.label || ""] : []),
          ...(search.trim() ? [search.trim()] : []),
        ].filter(Boolean)}
        onClear={() => { setSearch(""); setStatus("all"); setPage(0); }}
      />

      {errorMessage && <AdminAlert tone="error" className="mb-4">{errorMessage}</AdminAlert>}

      {initialLoading ? (
        <AdminLoadingState />
      ) : (
        <AdminDataTable busy={isPlaceholderData}
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty={
            <AdminEmptyState
              title={A("emptyTitle")}
              description={A("emptyDescription")}
              action={
                <Button asChild>
                  <Link to="/admin/projects/new">{A("newProject")}</Link>
                </Button>
              }
            />
          }
        />
      )}
      <AdminListPager page={page} pageSize={pageSize} total={total} isFetching={isFetching} itemLabel={A("itemLabel")} onPageChange={setPage} />
    </>
  );
}
