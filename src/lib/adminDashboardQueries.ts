import { INTERACTION_POLICY } from "@/lib/interactionPolicy";
import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { keepPreviousData } from "@tanstack/react-query";
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
    staleTime: INTERACTION_POLICY.defaultStaleTime,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: ({ signal }): Promise<AdminDashboardStats> => loadAdminDashboardStats(signal),
  });
}
