import type { QueryClient } from "@tanstack/react-query";
import {
  archiveAdminMutationRecord,
  deleteAdminMutationRecord,
  fetchAdminMutationRecord,
  insertAdminAuditLog,
  insertAdminMutationRecord,
  requestPublicContentInvalidation,
  updateAdminMutationRecord,
  type AdminMutationDbRecord,
} from "@/backend/modules/system/repository/adminMutationRepository";
import { invalidateAdminResource } from "@/lib/adminInvalidate";
import { registerPublicSyncIssue, resolvePublicSyncIssue } from "@/lib/publicSyncRecovery";
import { formatUserFacingError } from "@/lib/userFacingText";
import { getLandingProjectPrivacyIssues } from "@/lib/landingContentPrivacy";

type DbRecord = AdminMutationDbRecord;

type SaveAdminRecordOptions = {
  table: string;
  payload: DbRecord;
  id?: string | number | null;
  idField?: string;
  expectedUpdatedAt?: string | null;
  action?: string;
  queryClient?: QueryClient;
  invalidate?: "published" | "admin-content" | "none";
  audit?: boolean;
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
const publicContentTables = new Set([
  "about_sections",
  "before_after_items",
  "blog_posts",
  "brand_partners",
  "cms_pages",
  "cms_sections",
  "cta_blocks",
  "faqs",
  "hero_slides",
  "home_sections",
  "landing_pages",
  "materials",
  "process_steps",
  "projects",
  "promotions",
  "service_areas",
  "services",
  "site_pages",
  "site_settings",
  "testimonials",
]);

export class AdminMutationError extends Error {
  code: "conflict" | "validation" | "database" | "unknown";
  stage: "read" | "validation" | "write";

  constructor(code: AdminMutationError["code"], message: string, stage: AdminMutationError["stage"] = code === "validation" || code === "conflict" ? "validation" : "write") {
    super(message);
    this.code = code;
    this.stage = stage;
    this.name = "AdminMutationError";
  }
}

export const formatAdminMutationError = (error: unknown) => {
  if (error instanceof AdminMutationError) return error.message;
  const record = error as { message?: string; code?: string; hint?: string; details?: string };
  const raw = record?.message || (error instanceof Error ? error.message : String(error || ""));
  if (!raw) return "操作失败，请稍后再试。";
  if (raw.includes("duplicate key") || record?.code === "23505") return "保存失败：唯一字段已经存在，请换一个。";
  if (raw.includes("violates row-level security") || raw.includes("permission denied")) return "保存失败：当前账号没有这个操作权限。";
  if (raw.includes("invalid input value for enum")) return "保存失败：状态值不合法，请选择后台提供的状态。";
  return formatUserFacingError([raw, record?.hint, record?.details].filter(Boolean).join(" "), "zh");
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

const normalizeDate = (value?: unknown) => {
  if (!value) return "";
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) {
    return String(value);
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? String(value) : String(time);
};

async function invalidateAfterMutation(queryClient: QueryClient | undefined, mode: SaveAdminRecordOptions["invalidate"], table: string) {
  if (!queryClient || mode === "none") return;
  await invalidateAdminResource(queryClient, table);
}

export const mutationAffectsPublishedContent = (
  table: string,
  before: DbRecord | null | undefined,
  after: DbRecord | null | undefined,
) => {
  if (!publicContentTables.has(table)) return false;
  if (table === "site_settings") return true;
  return before?.status === "published" || after?.status === "published";
};

const invalidatePublicDelivery = async (
  table: string,
  action: string,
  id: string | number | null | undefined,
  before: DbRecord | null | undefined,
  after: DbRecord | null | undefined,
  queryClient?: QueryClient,
) => {
  if (!mutationAffectsPublishedContent(table, before, after)) return null;

  try {
    const result = await requestPublicContentInvalidation({ table, action, id });
    return result.cache_invalidation?.revision || null;
  } catch {
    const key = `${table}:${id ?? ""}:${action}`;
    registerPublicSyncIssue({ key, retry: async () => {
      await requestPublicContentInvalidation({ table, action, id });
      if (queryClient) await invalidateAdminResource(queryClient, table);
      resolvePublicSyncIssue(key);
    } });
    // The write already succeeded. Retrying delivery must never repeat the write.
    return null;

  }
};

export async function saveAdminRecord<T extends DbRecord = DbRecord>({
  table,
  payload,
  id,
  idField = "id",
  expectedUpdatedAt,
  action,
  queryClient,
  invalidate = "admin-content",
  audit = true,
}: SaveAdminRecordOptions): Promise<T> {
  const isUpdate = id !== undefined && id !== null && id !== "";
  const clean = cleanPayload(payload, !isUpdate);
  let before: DbRecord | null = null;

  if (isUpdate) {
    try {
      before = await fetchAdminMutationRecord(table, idField, id);
    } catch (error) {
      throw new AdminMutationError("database", formatAdminMutationError(error), "read");
    }

    if (!before) throw new AdminMutationError("validation", "保存失败：这条数据已经不存在，请刷新列表。");

    if (expectedUpdatedAt && before.updated_at && normalizeDate(before.updated_at) !== normalizeDate(expectedUpdatedAt)) {
      throw new AdminMutationError("conflict", "保存失败：这条内容已经被别人修改，请先刷新页面再保存。");
    }
  }

  const effectiveRecord = { ...(before || {}), ...clean };
  if (table === "landing_pages" && effectiveRecord.status === "published") {
    const privacyIssues = getLandingProjectPrivacyIssues(effectiveRecord.slug, effectiveRecord.related_projects);
    if (privacyIssues.length) {
      throw new AdminMutationError(
        "validation",
        `保存失败：办公室落地页案例只能使用匿名标题和吉隆坡、雪兰莪或巴生谷等大区域。请检查：${privacyIssues.join(", ")}。`,
      );
    }
  }

  let saved: DbRecord;
  try {
    saved = isUpdate ? await updateAdminMutationRecord(table, idField, id as string | number, clean) : await insertAdminMutationRecord(table, clean);
  } catch (error) {
    throw new AdminMutationError("database", formatAdminMutationError(error));
  }

  if (audit) {
    try {
      await insertAdminAuditLog({
        table,
        action: action || (isUpdate ? "update" : "insert"),
        id: typeof saved?.[idField] === "string" || typeof saved?.[idField] === "number" ? saved[idField] : id,
        oldValue: before,
        newValue: saved,
      });
    } catch {
      // Audit logging should not erase a successful save in the UI.
    }
  }

  await invalidateAfterMutation(queryClient, invalidate, table);
  const publicRevision = await invalidatePublicDelivery(
    table,
    action || (isUpdate ? "update" : "insert"),
    typeof saved?.[idField] === "string" || typeof saved?.[idField] === "number" ? saved[idField] : id,
    before,
    saved,
    queryClient,
  );
  if (table === "site_settings" && publicRevision) saved.updated_at = publicRevision;
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
  let before: DbRecord | null = null;
  try {
    before = await fetchAdminMutationRecord(table, idField, id);
  } catch (error) {
    throw new AdminMutationError("database", formatAdminMutationError(error), "read");
  }

  if (!before) throw new AdminMutationError("validation", "删除失败：这条数据已经不存在，请刷新列表。");
  if (expectedUpdatedAt && before.updated_at && normalizeDate(before.updated_at) !== normalizeDate(expectedUpdatedAt)) {
    throw new AdminMutationError("conflict", "删除失败：这条内容已经被别人修改，请先刷新页面再操作。");
  }

  const shouldArchive = softDelete && "status" in before;
  let after: DbRecord | null = null;
  try {
    after = shouldArchive ? await archiveAdminMutationRecord(table, idField, id) : await deleteAdminMutationRecord(table, idField, id);
  } catch (error) {
    throw new AdminMutationError("database", formatAdminMutationError(error));
  }

  try {
    await insertAdminAuditLog({
      table,
      action: shouldArchive ? "archive" : "delete",
      id,
      oldValue: before,
      newValue: after,
    });
  } catch {
    // Keep delete/archive result stable even if audit insertion fails.
  }

  await invalidateAfterMutation(queryClient, "admin-content", table);
  await invalidatePublicDelivery(table, shouldArchive ? "archive" : "delete", id, before, after, queryClient);
  return after;
}
