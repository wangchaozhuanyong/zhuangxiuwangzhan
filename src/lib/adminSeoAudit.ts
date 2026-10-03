import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useCallback } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  loadAdminSeoAuditRows,
  adminSeoSources,
  type AdminSeoAuditRow as RawAdminSeoAuditRow,
} from "@/backend/modules/seo/service/seoAuditService";
import { adminQueriesEnabled } from "@/lib/adminQueryCore";
import { adminSeoSourceLabels } from "@/i18n/adminSeoManagerText";
import { useAdminLang } from "@/lib/adminLocale";

const ADMIN_HEAVY_STALE_TIME = 10 * 60 * 1000;
const ADMIN_QUERY_GC_TIME = 30 * 60 * 1000;

export { adminSeoSources };
export type AdminSeoAuditRow = RawAdminSeoAuditRow & { source: RawAdminSeoAuditRow["source"] & { label: string } };

export function useAdminSeoAudit() {
  const language = useAdminLang();
  const select = useCallback((rows: RawAdminSeoAuditRow[]): AdminSeoAuditRow[] => rows.map((row) => ({
    ...row,
    source: { ...row.source, label: adminSeoSourceLabels[language][row.source.table] },
  })), [language]);
  return useQuery({
    queryKey: ["admin", "seo", "audit"],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_HEAVY_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    select,
    queryFn: ({ signal }) => loadAdminSeoAuditRows(signal),
  });
}
