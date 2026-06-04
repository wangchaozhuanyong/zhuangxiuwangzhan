import {
  invokeFormAttemptsMaintenance,
  invokeSystemHealthCheck,
} from "@/backend/modules/system/repository/systemHealthRepository";

export function fetchAdminSystemHealth<T>() {
  return invokeSystemHealthCheck<T>();
}

export function cleanupAdminFormAttempts<T>(retentionDays: number) {
  return invokeFormAttemptsMaintenance<T>(retentionDays);
}
