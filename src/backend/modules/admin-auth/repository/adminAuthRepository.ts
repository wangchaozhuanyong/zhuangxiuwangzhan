import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type AdminBackendRole = "super_admin" | "content_editor" | "lead_manager" | "viewer";

export const hasAdminAuthBackendConfig = () => isSupabaseConfigured;

export async function getCurrentAdminSession() {
  const supabase = requireSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signInAdminWithPassword(email: string, password: string) {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return true;
}

export async function signOutAdminSession() {
  const supabase = requireSupabase();
  await supabase.auth.signOut();
  return true;
}

export async function getCurrentAdminRoleStatus() {
  const supabase = requireSupabase();
  const [{ data: isAdmin, error }, { data: adminRole, error: roleError }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("admin_role"),
  ]);

  return {
    isAdmin: !error && Boolean(isAdmin),
    role: !roleError && adminRole ? (adminRole as AdminBackendRole) : null,
  };
}

export function subscribeAdminAuthStateChange(callback: () => void) {
  const supabase = requireSupabase();
  const { data: listener } = supabase.auth.onAuthStateChange(callback);

  return () => listener.subscription.unsubscribe();
}
