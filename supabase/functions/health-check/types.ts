import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type HealthClient = SupabaseClient;

export type Severity = "debug" | "info" | "warn" | "error" | "critical";

export type CheckResult = {
  ok: boolean;
  label: string;
  message?: string;
  count?: number;
};

export type TableCheck = CheckResult & {
  table: string;
  category: string;
};

export type HealthTableDefinition = {
  table: string;
  label: string;
  category: string;
  selectColumn?: string;
};

export type SystemEventRow = {
  id: string;
  event_type: string;
  severity: Severity;
  source: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SystemEventSummary = {
  id: string;
  event_type: string;
  severity: Severity;
  source: string;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  age_hours: number | null;
};

export type BackupStatus = {
  ok: boolean;
  latest_backup: SystemEventSummary | null;
  latest_verify: SystemEventSummary | null;
  latest_restore_dry_run: SystemEventSummary | null;
  message: string;
};

export type HealthCheckResult = {
  status: number;
  body: Record<string, unknown>;
};
