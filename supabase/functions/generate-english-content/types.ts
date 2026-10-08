import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type GenerateEnglishClient = SupabaseClient;

export type TranslationRecordGuard =
  | { kind: "updated_at"; updatedAt: string }
  | { kind: "project_image_snapshot"; snapshot: Record<string, string | number | null> };

export type GenerateEnglishRequest = {
  table: string;
  id: string;
  force?: boolean;
};

export type GenerateEnglishResult = {
  status?: number;
  body: {
    ok?: true;
    translated?: Record<string, unknown>;
    skipped_existing_english?: true;
    cache_invalidation?: { ok: boolean; revision: string | null; [key: string]: unknown };
    warnings?: string[];
    error?: string | null;
  };
};

export type TranslationJobStatus = "processing" | "completed" | "failed";

export type AdminCheckResult =
  | { ok: true; status: 200; error: null }
  | { ok: false; status: number; error: string };
