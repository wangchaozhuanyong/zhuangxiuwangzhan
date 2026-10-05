import type { AdminUserRow } from "@/lib/adminEditorData";
import { requireSupabase } from "@/lib/supabase";

export async function findAdminUserByUserId(userId: string) {
  const supabase = requireSupabase();
  const withUpdatedAt = await supabase
    .from("admin_users")
    .select("user_id,email,role,active,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!withUpdatedAt.error) return (withUpdatedAt.data as AdminUserRow | null) || null;

  if (!String(withUpdatedAt.error.message || "").includes("updated_at")) {
    throw withUpdatedAt.error;
  }

  const fallback = await supabase.from("admin_users").select("user_id,email,role,active").eq("user_id", userId).maybeSingle();
  if (fallback.error) throw fallback.error;

  return (fallback.data as AdminUserRow | null) || null;
}
