import { requireSupabase } from "@/lib/supabase";

export async function invokeSystemHealthCheck<T>() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke<T>("health-check", { method: "GET" });
  if (error) throw error;

  return data || ({} as T);
}

export async function invokeFormAttemptsMaintenance<T>(retentionDays: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke<T>("form-attempts-maintenance", {
    body: { retentionDays },
  });

  if (error) throw error;
  return data || ({} as T);
}
