import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type GrowthExportClient = SupabaseClient;
export type GrowthExportRequest = { startDate?: unknown; endDate?: unknown; limit?: unknown };
export type GrowthExportResult = { status?: number; body: Record<string, unknown> };
export type GrowthSourceRow = Record<string, unknown>;
