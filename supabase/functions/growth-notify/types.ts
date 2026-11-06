import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type GrowthNotifyClient = SupabaseClient;
export type GrowthEventType = "system_test" | "seo_publish" | "negative_keyword" | "campaign_pause" | "rollback" | "execution_failure";
export type GrowthNotifyRequest = {
  eventType?: unknown;
  evidence?: unknown;
  changeId?: unknown;
  title?: unknown;
  reason?: unknown;
  before?: unknown;
  after?: unknown;
  reportPath?: unknown;
  rollbackId?: unknown;
};
export type GrowthNotifyResult = { status?: number; body: Record<string, unknown> };
