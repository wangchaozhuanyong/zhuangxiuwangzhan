import type { AdminCheckResult, GenerateEnglishClient, TranslationJobStatus, TranslationRecordGuard } from "./types.ts";
import { requireAdminAccess } from "../_shared/admin-auth.ts";

export class TranslationConflictError extends Error {}

// This existing child table has no updated_at. Match its complete editable
// snapshot in the same UPDATE, including source and destination translations.
const projectImageSnapshotFields = [
  "project_id", "image_url", "image_type", "alt_zh", "alt_en", "sort_order", "created_at",
] as const;

export function createTranslationRecordGuard(table: string, record: Record<string, unknown>): TranslationRecordGuard | null {
  if (table !== "project_images") {
    return typeof record.updated_at === "string" && record.updated_at
      ? { kind: "updated_at", updatedAt: record.updated_at } : null;
  }
  const snapshot: Record<string, string | number | null> = {};
  for (const field of projectImageSnapshotFields) {
    const value = record[field];
    if (value === null) snapshot[field] = null;
    else if (typeof value === "string" || typeof value === "number") snapshot[field] = value;
    else return null;
  }
  return { kind: "project_image_snapshot", snapshot };
}

export async function createTranslationJob(
  client: GenerateEnglishClient,
  table: string,
  id: string,
  status: TranslationJobStatus,
  errorMessage?: string,
) {
  return client.from("translation_jobs").insert({
    table_name: table,
    record_id: id,
    status,
    error_message: errorMessage ?? null,
    regenerated_at: status === "completed" ? new Date().toISOString() : null,
  });
}

export async function requireAdmin(req: Request, client: GenerateEnglishClient): Promise<AdminCheckResult> {
  const authClient = client as unknown as Parameters<typeof requireAdminAccess>[1];
  const adminCheck = await requireAdminAccess(req, authClient);
  if (!adminCheck.ok) {
    return { ok: false, status: adminCheck.status, error: adminCheck.error || "Admin access required" };
  }

  if (adminCheck.role !== "super_admin" && adminCheck.role !== "content_editor") {
    return { ok: false, status: 403, error: "Content editor access required" };
  }
  return { ok: true, status: 200, error: null };
}

export async function fetchTranslationRecord(client: GenerateEnglishClient, table: string, id: string) {
  const { data, error } = await client.from(table).select("*").eq("id", id).single();
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function updateTranslationRecord(
  client: GenerateEnglishClient,
  table: string,
  id: string,
  translated: Record<string, unknown>,
  guard: TranslationRecordGuard,
) {
  let query = client.from(table).update(translated).eq("id", id);
  if (guard.kind === "updated_at") {
    query = query.eq("updated_at", guard.updatedAt);
  } else {
    if (table !== "project_images") throw new TranslationConflictError("Content version is unavailable.");
    for (const [field, value] of Object.entries(guard.snapshot)) {
      query = value === null ? query.is(field, null) : query.eq(field, value);
    }
  }
  const { data, error } = await query.select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new TranslationConflictError("Content has changed. Reload before translating again.");
  return data;
}
