import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ContentPublishClient = SupabaseClient;

export type ContentPublishMode = "dry-run" | "publish";
export type ContentPublishType = "service";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentPublishRequest = {
  contentType?: ContentPublishType;
  mode?: ContentPublishMode;
  record?: Record<string, unknown>;
  nextStatus?: ContentStatus;
  expectedUpdatedAt?: string | null;
  ownerApproved?: boolean;
  explicitExecution?: boolean;
  approvalId?: string;
  source?: string;
};

export type ServiceRow = Record<string, unknown> & {
  id?: string;
  slug?: string;
  updated_at?: string | null;
  status?: ContentStatus | null;
};

export type ContentPublishResult = {
  status?: number;
  body: Record<string, unknown>;
};
