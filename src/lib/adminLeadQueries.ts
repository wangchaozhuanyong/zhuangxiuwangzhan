import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { loadAdminLeadDetail, loadAdminLeadReportRows, loadAdminLeads } from "@/backend/modules/leads/service/leadService";
import { loadAdminQuoteDetail, loadAdminQuoteReportRows, loadAdminQuotes } from "@/backend/modules/quotes/service/quoteService";
import {
  buildAdminLeadReport,
  getAdminLeadReportStartIso,
  normalizeAdminLeadReportPeriod,
  type AdminLeadReportPeriod,
} from "@/lib/adminLeadReports";
import { normalizeAdminWorkflowFilter } from "@/lib/adminLeadWorkflow";
import {
  ADMIN_LIST_STALE_TIME,
  ADMIN_QUERY_GC_TIME,
  adminQueriesEnabled,
  clampPage,
  clampPageSize,
  normalizeAdminSearch,
  type AdminListQuery,
} from "@/lib/adminQueryCore";
import type { Language } from "@/i18n/routes";

export type AdminLeadListRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email?: string | null;
  status: string | null;
  source_path: string | null;
  project_type?: string | null;
  location?: string | null;
  created_at: string;
  next_follow_up_at?: string | null;
};

export type AdminQuoteListRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  status: string | null;
  source_path: string | null;
  project_type?: string | null;
  location?: string | null;
  created_at: string;
  next_follow_up_at?: string | null;
};

export function useAdminLeads(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  const workflow = normalizeAdminWorkflowFilter(options.workflow, "leads");
  return useQuery({
    queryKey: ["admin", "leads", { page, pageSize, status: options.status || "all", workflow, search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      loadAdminLeads<AdminLeadListRow>({
        page,
        pageSize,
        status: options.status,
        workflow,
        search,
      }),
  });
}

export function useAdminQuotes(options: AdminListQuery = {}) {
  const search = normalizeAdminSearch(options.search);
  const page = clampPage(options.page);
  const pageSize = clampPageSize(options.pageSize);
  const workflow = normalizeAdminWorkflowFilter(options.workflow, "quote_requests");
  return useQuery({
    queryKey: ["admin", "quotes", { page, pageSize, status: options.status || "all", workflow, search }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_LIST_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: () =>
      loadAdminQuotes<AdminQuoteListRow>({
        page,
        pageSize,
        status: options.status,
        workflow,
        search,
      }),
  });
}

export function useAdminLeadReport(options: { period?: AdminLeadReportPeriod | string; language?: Language } = {}) {
  const period = normalizeAdminLeadReportPeriod(options.period);
  const language = options.language || "zh";
  return useQuery({
    queryKey: ["admin", "lead-report", { period, language }],
    enabled: adminQueriesEnabled,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async () => {
      const startIso = getAdminLeadReportStartIso(period);
      const [leads, quotes] = await Promise.all([
        loadAdminLeadReportRows(startIso),
        loadAdminQuoteReportRows(startIso),
      ]);

      return buildAdminLeadReport({
        leads,
        quotes,
        period,
        language,
      });
    },
  });
}

export function useAdminLead(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "leads", id],
    enabled: adminQueriesEnabled && Boolean(id),
    placeholderData: keepPreviousData,
    queryFn: () => loadAdminLeadDetail(id!),
  });
}

export function useAdminQuote(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "quotes", id],
    enabled: adminQueriesEnabled && Boolean(id),
    placeholderData: keepPreviousData,
    queryFn: () => loadAdminQuoteDetail(id!),
  });
}
