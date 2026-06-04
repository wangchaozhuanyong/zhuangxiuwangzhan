import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type FormAttemptsClient = SupabaseClient;

export type FormAttemptsCleanupInput = {
  retentionDays?: unknown;
  dryRun?: unknown;
  mode?: string;
};

export type FormAttemptsCleanupResult = {
  status?: number;
  body: Record<string, unknown>;
};
