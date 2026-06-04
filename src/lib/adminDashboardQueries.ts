import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { loadAdminDashboardStats } from "@/backend/modules/system/service/dashboardService";
import { adminQueriesEnabled, ADMIN_QUERY_GC_TIME } from "@/lib/adminQueryCore";

export type AdminDashboardStats = {
  counts: Record<string, number>;
  recentLeads: unknown[];
  recentQuotes: unknown[];
};

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: (): Promise<AdminDashboardStats> => loadAdminDashboardStats(),
  });
}
