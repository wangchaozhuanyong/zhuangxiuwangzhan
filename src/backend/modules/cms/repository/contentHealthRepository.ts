import { requireSupabase } from "@/lib/supabase";

export async function fetchAdminContentHealthRows(table: string, select: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(300);

  if (error) throw error;
  return (data || []) as unknown as Array<Record<string, unknown>>;
}
