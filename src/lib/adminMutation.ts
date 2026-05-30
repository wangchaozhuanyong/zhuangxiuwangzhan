import type { QueryClient } from "@tanstack/react-query";
import { invalidateAfterAdminContentSave, invalidatePublishedContent } from "@/lib/adminInvalidate";
import { requireSupabase } from "@/lib/supabase";

type DbRecord = Record<string, any>;

type SaveAdminRecordOptions = {
  table: string;
  payload: DbRecord;
  id?: string | number | null;
  idField?: string;
  expectedUpdatedAt?: string | null;
  action?: string;
  queryClient?: QueryClient;
  invalidate?: "published" | "admin-content" | "none";
};

type DeleteAdminRecordOptions = {
  table: string;
  id: string | number;
  idField?: string;
  expectedUpdatedAt?: string | null;
  queryClient?: QueryClient;
  softDelete?: boolean;
};

const readonlyFields = new Set(["id", "created_at", "updated_at", "version"]);

export class AdminMutationError extends Error {
  code: "conflict" | "validation" | "database" | "unknown";

  constructor(code: AdminMutationError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AdminMutationError";
  }
}

export const formatAdminMutationError = (error: unknown) => {
  if (error instanceof AdminMutationError) return error.message;
  const record = error as { message?: string; code?: string; hint?: string; details?: string };
  const raw = record?.message || (error instanceof Error ? error.message : String(error || ""));
  if (!raw) return "操作失败，请稍后再试。";
  if (raw.includes("duplicate key") || record?.code === "23505") return "保存失败：链接标识或唯一字段已经存在，请换一个。";
  if (raw.includes("violates row-level security") || raw.includes("permission denied")) return "保存失败：当前账号没有这个操作权限。";
  if (raw.includes("invalid input value for enum")) return "保存失败：状态值不合法，请选择后台提供的状态。";
  return [raw, record?.hint, record?.details].filter(Boolean).join(" ");
};

const cleanPayload = (payload: DbRecord, keepId = false) => {
  const next: DbRecord = {};
  for (const [key, value] of Object.entries(payload)) {
    if (keepId && key === "id") {
      next[key] = value;
      continue;
    }
    if (readonlyFields.has(key)) continue;
    next[key] = value;
  }
  return next;
};

const normalizeDate = (value?: string | null) => {
  if (!value) return "";
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? String(value) : String(time);
};

async function writeAuditLog(args: {
  table: string;
  action: string;
  id?: string | number | null;
  oldValue?: DbRecord | null;
  newValue?: DbRecord | null;
}) {
  const supabase = requireSupabase();
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("admin_audit_logs").insert({
    admin_user_id: userData.user?.id || null,
    action: args.action,
    table_name: args.table,
    record_id: args.id == null ? null : String(args.id),
    old_value: args.oldValue || null,
    new_value: args.newValue || null,
  });
}

async function invalidateAfterMutation(queryClient: QueryClient | undefined, mode: SaveAdminRecordOptions["invalidate"]) {
  if (!queryClient || mode === "none") return;
  if (mode === "published") {
    await invalidatePublishedContent(queryClient);
    return;
  }
  await invalidateAfterAdminContentSave(queryClient);
}

export async function saveAdminRecord<T extends DbRecord = DbRecord>({
  table,
  payload,
  id,
  idField = "id",
  expectedUpdatedAt,
  action,
  queryClient,
  invalidate = "admin-content",
}: SaveAdminRecordOptions): Promise<T> {
  const supabase = requireSupabase();
  const isUpdate = id !== undefined && id !== null && id !== "";
  const clean = cleanPayload(payload, !isUpdate);
  let before: DbRecord | null = null;

  if (isUpdate) {
    const { data, error } = await supabase.from(table).select("*").eq(idField, id).maybeSingle();
    if (error) throw new AdminMutationError("database", formatAdminMutationError(error));
    if (!data) throw new AdminMutationError("validation", "保存失败：这条数据已经不存在，请刷新列表。");
    before = data as DbRecord;

    if (expectedUpdatedAt && before.updated_at && normalizeDate(before.updated_at) !== normalizeDate(expectedUpdatedAt)) {
      throw new AdminMutationError("conflict", "保存失败：这条内容已经被别人修改。请先刷新页面，确认新内容后再保存。");
    }
  }

  const request = isUpdate
    ? supabase.from(table).update(clean).eq(idField, id).select("*").single()
    : supabase.from(table).insert(clean).select("*").single();

  const { data: saved, error } = await request;
  if (error) throw new AdminMutationError("database", formatAdminMutationError(error));

  try {
    await writeAuditLog({
      table,
      action: action || (isUpdate ? "update" : "insert"),
      id: (saved as DbRecord)?.[idField] ?? id,
      oldValue: before,
      newValue: saved as DbRecord,
    });
  } catch {
    // Audit logging should not erase a successful save in the UI.
  }

  await invalidateAfterMutation(queryClient, invalidate);
  return saved as T;
}

export async function archiveOrDeleteAdminRecord({
  table,
  id,
  idField = "id",
  expectedUpdatedAt,
  queryClient,
  softDelete = true,
}: DeleteAdminRecordOptions) {
  const supabase = requireSupabase();
  const { data: before, error: fetchError } = await supabase.from(table).select("*").eq(idField, id).maybeSingle();
  if (fetchError) throw new AdminMutationError("database", formatAdminMutationError(fetchError));
  if (!before) throw new AdminMutationError("validation", "删除失败：这条数据已经不存在，请刷新列表。");
  if (expectedUpdatedAt && before.updated_at && normalizeDate(before.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    throw new AdminMutationError("conflict", "删除失败：这条内容已经被别人修改。请先刷新页面再操作。");
  }

  const request =
    softDelete && "status" in before
      ? supabase.from(table).update({ status: "archived" }).eq(idField, id).select("*").single()
      : supabase.from(table).delete().eq(idField, id).select("*").single();

  const { data: after, error } = await request;
  if (error) throw new AdminMutationError("database", formatAdminMutationError(error));

  try {
    await writeAuditLog({
      table,
      action: softDelete && "status" in before ? "archive" : "delete",
      id,
      oldValue: before as DbRecord,
      newValue: (after as DbRecord) || null,
    });
  } catch {
    // Keep delete/archive result stable even if audit insertion fails.
  }

  await invalidateAfterMutation(queryClient, "admin-content");
  return after;
}
