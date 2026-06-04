import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type GenerateEnglishClient = SupabaseClient;

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
    error?: string | null;
  };
};

export type TranslationJobStatus = "processing" | "completed" | "failed";

export type AdminCheckResult =
  | { ok: true; status: 200; error: null }
  | { ok: false; status: number; error: string };
