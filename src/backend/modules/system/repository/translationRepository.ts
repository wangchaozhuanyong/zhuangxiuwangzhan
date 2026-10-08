import { requireSupabase } from "@/lib/supabase";

export type GenerateEnglishContentRequest = {
  table: string;
  id: string;
  force: boolean;
};

export type GenerateEnglishContentResponse = {
  ok?: boolean;
  error?: string | null;
  translated?: Record<string, unknown>;
  cache_invalidation?: {
    ok?: boolean;
    revision?: string | null;
    edge_purge_requested?: { ok?: boolean };
  };
  warnings?: string[];
};

export async function invokeGenerateEnglishContent(body: GenerateEnglishContentRequest) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke<GenerateEnglishContentResponse>("generate-english-content", { body });
  if (error) throw error;
  if (data?.ok !== true) throw new Error(data?.error || "English content generation could not be confirmed.");

  return data;
}
