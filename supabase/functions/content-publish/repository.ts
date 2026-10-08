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

// Keep the version predicate in the same UPDATE as the content write.
export async function updateContentRecordAtVersion(
  client: ContentPublishClient,
  table: string,
  id: string,
  expectedUpdatedAt: string,
  payload: Record<string, unknown>,
): Promise<ContentRow | null> {
  const { data, error } = await client.from(table).update(payload)
    .eq("id", id).eq("updated_at", expectedUpdatedAt).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data as ContentRow | null;
}

// These RPCs commit the complete publication, audit, and public revision together.
// A missing migration or a database failure must never fall back to partial writes.
export class PublicationConflictError extends Error {}

async function atomicPublication(
  client: ContentPublishClient,
  name: "publish_material_atomic" | "publish_homepage_atomic",
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await client.rpc(name, args);
  if (error) {
    if (error.code === "40001" || error.code === "23505") {
      throw new PublicationConflictError("Content changed during publication. Refresh before publishing.");
    }
    if (error.code === "PGRST202" || error.code === "42883") {
      throw new PublicationConflictError("The atomic publication migration is required before publishing.");
    }
    throw new Error("Atomic publication could not be confirmed. Read back before retrying.");
  }
  const result = data as unknown;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Atomic publication returned an invalid result. Read back before retrying.");
  }
  return result as Record<string, unknown>;
}

export function publishMaterialAtomic(client: ContentPublishClient, args: Record<string, unknown>) {
  return atomicPublication(client, "publish_material_atomic", args);
}

export function publishHomepageAtomic(client: ContentPublishClient, args: Record<string, unknown>) {
  return atomicPublication(client, "publish_homepage_atomic", args);
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

export async function uploadMediaObject(
  client: ContentPublishClient,
  input: {
    bucket: string;
    objectPath: string;
    bytes: Uint8Array;
    mimeType: string;
  },
): Promise<string> {
  if (!client.storage) throw new Error("Media storage client is unavailable.");
  const bucket = client.storage.from(input.bucket);
  const { error } = await bucket.upload(input.objectPath, input.bytes, {
    cacheControl: "31536000",
    contentType: input.mimeType,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const publicUrl = bucket.getPublicUrl(input.objectPath).data.publicUrl;
  if (!publicUrl) throw new Error("Media upload did not return a public URL.");
  return publicUrl;
}

export async function removeMediaObject(
  client: ContentPublishClient,
  bucketName: string,
  objectPath: string,
): Promise<void> {
  if (!client.storage) throw new Error("Media storage client is unavailable.");
  const { error } = await client.storage.from(bucketName).remove([objectPath]);
  if (error) throw new Error(error.message);
}
