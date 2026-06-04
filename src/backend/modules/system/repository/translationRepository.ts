import { requireSupabase } from "@/lib/supabase";

export type GenerateEnglishContentRequest = {
  table: string;
  id: string;
  force: boolean;
};

export async function invokeGenerateEnglishContent(body: GenerateEnglishContentRequest) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("generate-english-content", { body });
  if (error) throw error;

  return data;
}
