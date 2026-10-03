import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { loadAdminEditorRows, loadAdminSimpleCmsRows } from "@/backend/modules/cms/service/cmsService";
import { fetchAdminAboutEditorData, fetchAdminHomeEditorData } from "@/lib/adminEditorData";
import { ADMIN_LIST_STALE_TIME, ADMIN_QUERY_GC_TIME, adminQueriesEnabled } from "@/lib/adminQueryCore";

export type AdminSimpleCmsTable = "site_pages" | "home_sections" | "faqs" | "before_after_items" | "brand_partners";

export function useAdminSimpleCmsRows(table: AdminSimpleCmsTable) {
  return useQuery({
    queryKey: ["admin", table, "rows"],
    enabled: adminQueriesEnabled,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) => loadAdminSimpleCmsRows(table, signal),
  });
}

export function useAdminEditorRows(type: string, canLoad: boolean, limit = 50) {
  return useQuery({
    queryKey: ["admin", type, "rows", { limit }],
    enabled: adminQueriesEnabled && canLoad && Boolean(type),
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }) => loadAdminEditorRows(type, limit, signal),
  });
}

export function useAdminHomeEditorData() {
  return useQuery({
    queryKey: ["admin", "home_editor"],
    enabled: adminQueriesEnabled,
    queryFn: ({ signal }) => fetchAdminHomeEditorData(signal),
  });
}

export function useAdminAboutEditorData() {
  return useQuery({
    queryKey: ["admin", "about_editor"],
    enabled: adminQueriesEnabled,
    queryFn: ({ signal }) => fetchAdminAboutEditorData(signal),
  });
}
