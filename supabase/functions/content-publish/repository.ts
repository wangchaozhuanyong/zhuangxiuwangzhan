import type { ContentPublishClient, ContentRow, ServiceRow } from "./types.ts";

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

export async function fetchRecordByField(
  client: ContentPublishClient,
  table: string,
  field: string,
  value: string,
): Promise<ContentRow | null> {
  const { data, error } = await client.from(table).select("*").eq(field, value).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ContentRow | null) || null;
}

export async function fetchRecordsByField(
  client: ContentPublishClient,
  table: string,
  field: string,
  value: string,
): Promise<ContentRow[]> {
  const { data, error } = await client.from(table).select("*").eq(field, value);
  if (error) throw new Error(error.message);
  return (data as ContentRow[] | null) || [];
}

export async function insertContentRecord(
  client: ContentPublishClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<ContentRow> {
  const { data, error } = await client.from(table).insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as ContentRow;
}

export async function updateContentRecord(
  client: ContentPublishClient,
  table: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<ContentRow> {
  const { data, error } = await client.from(table).update(payload).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  return data as ContentRow;
}

export async function archiveRecordsByField(
  client: ContentPublishClient,
  table: string,
  field: string,
  value: string,
): Promise<ContentRow[]> {
  const { data, error } = await client.from(table).update({ status: "archived" }).eq(field, value).eq("status", "published").select("*");
  if (error) throw new Error(error.message);
  return (data as ContentRow[] | null) || [];
}

export async function insertAdminAuditLog(
  client: ContentPublishClient,
  input: {
    adminUserId?: string | null;
    action: string;
    tableName: string;
    recordId?: string | null;
    oldValue?: ContentRow | ServiceRow | ContentRow[] | ServiceRow[] | null;
    newValue?: ContentRow | ServiceRow | ContentRow[] | ServiceRow[] | null;
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
