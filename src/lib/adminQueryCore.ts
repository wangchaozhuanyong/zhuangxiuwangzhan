import type { AdminWorkflowFilter } from "@/lib/adminLeadWorkflow";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const adminQueriesEnabled = isSupabaseConfigured && Boolean(supabase);
export const ADMIN_LIST_STALE_TIME = 5 * 60 * 1000;
export const ADMIN_QUERY_GC_TIME = 30 * 60 * 1000;
export const ADMIN_DEFAULT_PAGE_SIZE = 30;
const ADMIN_MAX_PAGE_SIZE = 80;
export const COUNT_ONLY_SELECT = "id";

export type AdminListQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  workflow?: AdminWorkflowFilter | string;
};

export type AdminListPage<T> = {
  rows: T[];
  count: number;
  page: number;
  pageSize: number;
};

export const clampPage = (value?: number) => Math.max(0, Number.isFinite(value || 0) ? Math.floor(value || 0) : 0);

export const clampPageSize = (value?: number) => {
  if (!Number.isFinite(value || 0)) return ADMIN_DEFAULT_PAGE_SIZE;
  return Math.min(ADMIN_MAX_PAGE_SIZE, Math.max(10, Math.floor(value || ADMIN_DEFAULT_PAGE_SIZE)));
};

export const normalizeAdminSearch = (value?: string) =>
  String(value || "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 60);
