import { requireSupabase } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";

export type AdminMutationDbRecord = Record<string, unknown>;

export type PublicContentInvalidationResult = {
  ok?: boolean;
  cache_invalidation?: {
    ok?: boolean;
    revision?: string | null;
    edge_purge_requested?: {
      ok?: boolean;
      attempted?: boolean;
      error?: string;
    };
  };
  error?: string;
};

export async function requestPublicContentInvalidation(args: {
  table: string;
  action: string;
  id?: string | number | null;
}) {
  const supabase = requireSupabase();
  const approvalId = `admin-cache-${args.table}-${String(args.id || "record")}-${new Date().toISOString()}`;
  const { data, error } = await supabase.functions.invoke<PublicContentInvalidationResult>("content-publish", {
    body: {
      contentType: "cache_invalidation",
      mode: "publish",
      nextStatus: "published",
      ownerApproved: true,
      explicitExecution: true,
      approvalId,
      source: `admin-mutation:${args.table}:${args.action}`,
      record: {
        table: args.table,
        action: args.action,
        id: args.id == null ? null : String(args.id),
      },
    },
  });
  if (error) throw error;
  if (!data?.ok || data.cache_invalidation?.ok !== true) {
    throw new Error(data?.error || "Public content cache revision could not be advanced.");
  }

  return data;
}

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
    old_value: (args.oldValue || null) as Json | null,
    new_value: (args.newValue || null) as Json | null,
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
