import { requireSupabase } from "@/lib/supabase";

export type AdminMutationDbRecord = Record<string, any>;

export async function insertAdminAuditLog(args: {
  table: string;
  action: string;
  id?: string | number | null;
  oldValue?: AdminMutationDbRecord | null;
  newValue?: AdminMutationDbRecord | null;
}) {
  const supabase = requireSupabase();
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("admin_audit_logs").insert({
    admin_user_id: userData.user?.id || null,
    action: args.action,
    table_name: args.table,
    record_id: args.id == null ? null : String(args.id),
    old_value: (args.oldValue || null) as any,
    new_value: (args.newValue || null) as any,
  });
}

export async function fetchAdminMutationRecord(table: string, idField: string, id: string | number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).select("*").eq(idField, id).maybeSingle();
  if (error) throw error;
  return (data as AdminMutationDbRecord | null) || null;
}

export async function insertAdminMutationRecord(table: string, payload: AdminMutationDbRecord) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).insert(payload).select("*").single();
  if (error) throw error;
  return data as AdminMutationDbRecord;
}

export async function updateAdminMutationRecord(
  table: string,
  idField: string,
  id: string | number,
  payload: AdminMutationDbRecord,
) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).update(payload).eq(idField, id).select("*").single();
  if (error) throw error;
  return data as AdminMutationDbRecord;
}

export async function archiveAdminMutationRecord(table: string, idField: string, id: string | number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).update({ status: "archived" }).eq(idField, id).select("*").single();
  if (error) throw error;
  return data as AdminMutationDbRecord;
}

export async function deleteAdminMutationRecord(table: string, idField: string, id: string | number) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).delete().eq(idField, id).select("*").single();
  if (error) throw error;
  return data as AdminMutationDbRecord;
}
