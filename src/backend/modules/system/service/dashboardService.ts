import { fetchAdminDashboardStatsData } from "@/backend/modules/system/repository/dashboardRepository";

export function loadAdminDashboardStats() {
  return fetchAdminDashboardStatsData();
}
