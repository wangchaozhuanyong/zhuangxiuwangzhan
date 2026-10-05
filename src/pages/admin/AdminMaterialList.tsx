import AdminFurnitureCatalog from "@/pages/admin/AdminFurnitureCatalog";
import { useAdminListingState } from "@/hooks/useAdminListingState";

import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAdminMaterials, type AdminMaterialRow } from "@/lib/adminBusinessContentQueries";
import AdminFilterSummary from "@/components/admin/AdminFilterSummary";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminAlert from "@/components/admin/AdminAlert";
import AdminDataTable, { type AdminDataTableColumn } from "@/components/admin/AdminDataTable";
import AdminListPager from "@/components/admin/AdminListPager";
import AdminLoadingState from "@/components/admin/AdminLoadingState";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import SmartImage from "@/components/SmartImage";
import { adminMaterialListText } from "@/i18n/adminMaterialListText";
import { adminFurnitureListText } from "@/i18n/adminFurnitureText";
import { furnitureCategoryName, furnitureSubcategoryName, furnitureText } from "@/i18n/furnitureText";
import { FURNITURE_MATERIAL_CATEGORY } from "@/lib/furnitureCatalogConfig";
import { getAdminLang, publishStatusOptions } from "@/lib/adminLocale";
import { formatUserFacingError } from "@/lib/userFacingText";

type AdminMaterialListTextKey = keyof typeof adminMaterialListText;

export default function AdminMaterialList({ furnitureMode = false }: { furnitureMode?: boolean }) {
  return furnitureMode ? <AdminFurnitureCatalog /> : <MaterialList />;
}

function MaterialList() {
  const furnitureMode = false;
  const language = getAdminLang();
  const A = (key: AdminMaterialListTextKey) => (furnitureMode ? adminFurnitureListText : adminMaterialListText)[key][language];
  const basePath = furnitureMode ? "/admin/furniture" : "/admin/materials";
  const list = useAdminListingState();
  const { search, setSearch, deferredSearch, page, setPage } = list;
  const status = list.filter("status");
  const setStatus = (value: string) => list.setFilter("status", value);

  const { data, error, isFetching, isPlaceholderData, refetch } = useAdminMaterials({ page, status, search: deferredSearch, category: furnitureMode ? FURNITURE_MATERIAL_CATEGORY : undefined });
  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const errorMessage = error ? formatUserFacingError(error, language) : "";
  const initialLoading = isFetching && !data;


  const columns: AdminDataTableColumn<AdminMaterialRow>[] = [
    {
      key: "material",
      mobileRole: "title",
      header: A("materialHeader"),
      cell: (row) => {
        const title = row.title_zh || row.title_en || row.slug;
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {row.image_url ? <SmartImage src={row.image_url} alt={title} width={112} height={80} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <Link to={`${basePath}/${row.id}`} className="font-medium hover:underline">
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
      header: A("categoryHeader"),
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <div>{furnitureMode ? furnitureText[language].title : row.category === FURNITURE_MATERIAL_CATEGORY ? furnitureText[language].title : row.category || "-"}</div>
          <div>{furnitureMode && row.subcategory ? furnitureCategoryName(row.subcategory, language) : row.subcategory || "-"}</div>
          <div>{furnitureMode && row.material_type ? furnitureSubcategoryName(row.material_type, language, row.material_type) : row.material_type || "-"}</div>
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
              <Link to={`${basePath}/new`}>{A("newMaterial")}</Link>
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
                  <Link to={`${basePath}/new`}>{A("newMaterial")}</Link>
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
