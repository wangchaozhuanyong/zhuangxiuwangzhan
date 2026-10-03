import { withReadSignal } from "@/lib/readRequest";
import { requireSupabase } from "@/lib/supabase";

export async function fetchAdminContentHealthRows(table: string, select: string, signal?: AbortSignal) {
  const supabase = requireSupabase();
  const { data, error } = await withReadSignal(supabase
    .from(table)
    .select(select)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(300), signal);

  if (error) throw error;
  return (data || []) as unknown as Array<Record<string, unknown>>;
}
