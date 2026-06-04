import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient>;

export async function getUserFromToken(supabase: SupabaseClient, token: string) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function findAdminUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data || null;
}
