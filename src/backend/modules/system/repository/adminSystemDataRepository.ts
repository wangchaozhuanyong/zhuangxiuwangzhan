import { withReadSignal } from "@/lib/readRequest";
import { requireSupabase } from "@/lib/supabase";

export async function invokeNotificationSettingsGet(signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("notification-settings", { signal,
    body: { action: "get" },
  });
  if (error) throw error;
  return data;
}

export async function fetchTranslationJobRows(limit: number, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase
    .from("translation_jobs")
    .select("id, table_name, record_id, status, error_message, regenerated_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit), signal);
  if (error) throw error;
  return data || [];
}

export async function fetchTranslationLabelRows(table: string, select: string, ids: string[], signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data } = await withReadSignal(supabase.from(table).select(select).in("id", ids), signal);
  return (data || []) as unknown as Array<Record<string, unknown>>;
}

export async function fetchAdminUserRows(signal?: AbortSignal) {
  const supabase = requireSupabase();
  const withVersion = await withReadSignal(supabase
    .from("admin_users")
    .select("user_id, email, role, active, created_at, updated_at, version")
    .order("created_at", { ascending: false }), signal);
  if (!withVersion.error) return withVersion.data ?? [];

  const { data, error } = await withReadSignal(supabase
    .from("admin_users")
    .select("user_id, email, role, active, created_at")
    .order("created_at", { ascending: false }), signal);
  if (error) throw error;
  return data ?? [];
}
