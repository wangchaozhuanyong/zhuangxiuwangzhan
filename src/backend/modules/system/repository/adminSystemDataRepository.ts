import { requireSupabase } from "@/lib/supabase";

export async function invokeNotificationSettingsGet() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("notification-settings", {
    body: { action: "get" },
  });
  if (error) throw error;
  return data;
}

export async function fetchTranslationJobRows(limit: number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("translation_jobs")
    .select("id, table_name, record_id, status, error_message, regenerated_at, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function fetchTranslationLabelRows(table: string, select: string, ids: string[]) {
  const supabase = requireSupabase();
  const { data } = await supabase.from(table).select(select).in("id", ids);
  return (data || []) as unknown as Array<Record<string, unknown>>;
}

export async function fetchAdminUserRows() {
  const supabase = requireSupabase();
  const withVersion = await supabase
    .from("admin_users")
    .select("user_id, email, role, active, created_at, updated_at, version")
    .order("created_at", { ascending: false });
  if (!withVersion.error) return withVersion.data ?? [];

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, role, active, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
