import { fetchAdminDashboardStatsData } from "@/backend/modules/system/repository/dashboardRepository";

export function loadAdminDashboardStats(signal?: AbortSignal) {
  return fetchAdminDashboardStatsData(signal);
}
