import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { keepPreviousData } from "@tanstack/react-query";
import {
  fetchAdminUsers,
  fetchNotificationSettings,
  fetchTranslationJobs,
} from "@/lib/adminEditorData";
import { adminQueriesEnabled } from "@/lib/adminQueryCore";

export function useAdminNotificationSettings() {
  return useQuery({
    queryKey: ["admin", "notification_settings"],
    enabled: adminQueriesEnabled,
    queryFn: ({ signal }) => fetchNotificationSettings(signal),
  });
}

export function useAdminTranslationJobs(limit = 100) {
  return useQuery({
    queryKey: ["admin", "translation_jobs", { limit }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => fetchTranslationJobs(limit, signal),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => fetchAdminUsers(signal),
  });
}
