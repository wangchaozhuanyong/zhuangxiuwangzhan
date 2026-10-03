import {
  invokeFormAttemptsMaintenance,
  invokeSystemHealthCheck,
} from "@/backend/modules/system/repository/systemHealthRepository";

export function fetchAdminSystemHealth<T>(signal?: AbortSignal) {
  return invokeSystemHealthCheck<T>(signal);
}

export function cleanupAdminFormAttempts<T>(retentionDays: number) {
  return invokeFormAttemptsMaintenance<T>(retentionDays);
}
