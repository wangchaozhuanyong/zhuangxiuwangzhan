import type { ContentPublishClient, ServiceRow } from "./types.ts";

export async function fetchServiceById(client: ContentPublishClient, id: string): Promise<ServiceRow | null> {
  const { data, error } = await client.from("services").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ServiceRow | null) || null;
}

export async function fetchServiceBySlug(client: ContentPublishClient, slug: string): Promise<ServiceRow | null> {
  const { data, error } = await client.from("services").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ServiceRow | null) || null;
}

export async function insertServiceRecord(client: ContentPublishClient, payload: Record<string, unknown>): Promise<ServiceRow> {
  const { data, error } = await client.from("services").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as ServiceRow;
}

export async function updateServiceRecord(
  client: ContentPublishClient,
  id: string,
  payload: Record<string, unknown>,
): Promise<ServiceRow> {
  const { data, error } = await client.from("services").update(payload).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as ServiceRow;
}

export async function insertAdminAuditLog(
  client: ContentPublishClient,
  input: {
    adminUserId?: string | null;
    action: string;
    tableName: string;
    recordId?: string | null;
    oldValue?: ServiceRow | null;
    newValue?: ServiceRow | null;
  },
) {
  const { error } = await client.from("admin_audit_logs").insert({
    admin_user_id: input.adminUserId || null,
    action: input.action,
    table_name: input.tableName,
    record_id: input.recordId || null,
    old_value: input.oldValue || null,
    new_value: input.newValue || null,
  });
  if (error) throw new Error(error.message);
}
