import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  loadAdminSeoAuditRows,
  adminSeoSources,
  type AdminSeoAuditRow,
} from "@/backend/modules/seo/service/seoAuditService";
import { adminQueriesEnabled } from "@/lib/adminQueryCore";

const ADMIN_HEAVY_STALE_TIME = 10 * 60 * 1000;
const ADMIN_QUERY_GC_TIME = 30 * 60 * 1000;

export { adminSeoSources };
export type { AdminSeoAuditRow };

export function useAdminSeoAudit() {
  return useQuery({
    queryKey: ["admin", "seo", "audit"],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_HEAVY_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: loadAdminSeoAuditRows,
  });
}
