import type { QueryClient } from "@tanstack/react-query";
import type { AdminUserRow } from "@/lib/adminEditorData";
import { saveAdminRecord } from "@/lib/adminMutation";
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

export function saveAdminUserRecord(
  payload: Partial<AdminUserRow> & { user_id: string },
  existing: AdminUserRow | null | undefined,
  queryClient?: QueryClient,
) {
  return saveAdminRecord({
    table: "admin_users",
    id: existing?.user_id || null,
    idField: "user_id",
    expectedUpdatedAt: existing?.updated_at || null,
    payload,
    action: existing ? "admin_user_update" : "admin_user_insert",
    queryClient,
    invalidate: "none",
    audit: false,
  });
}
