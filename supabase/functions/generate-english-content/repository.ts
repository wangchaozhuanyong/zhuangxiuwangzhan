import type { AdminCheckResult, GenerateEnglishClient, TranslationJobStatus } from "./types.ts";
import { requireAdminAccess } from "../_shared/admin-auth.ts";

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
  const adminCheck = await requireAdminAccess(req, client);
  if (!adminCheck.ok) {
    return { ok: false, status: adminCheck.status, error: adminCheck.error || "Admin access required" };
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
) {
  const { error } = await client.from(table).update(translated).eq("id", id);
  if (error) throw error;
}
