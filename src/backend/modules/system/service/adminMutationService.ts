import {
  archiveAdminMutationRecord,
  deleteAdminMutationRecord,
  fetchAdminMutationRecord,
  insertAdminAuditLog,
  insertAdminMutationRecord,
  updateAdminMutationRecord,
  type AdminMutationDbRecord,
  type AdminMutationVersion,
} from "@/backend/modules/system/repository/adminMutationRepository";
import { getLandingProjectPrivacyIssues } from "@/lib/landingContentPrivacy";

type DbRecord = AdminMutationDbRecord;

export type PersistAdminRecordOptions = {
  table: string;
  payload: DbRecord;
  id?: string | number | null;
  idField?: string;
  expectedUpdatedAt?: string | null;
  action?: string;
  audit?: boolean;
};

export type PersistAdminRecordRemovalOptions = {
  table: string;
  id: string | number;
  idField?: string;
  expectedUpdatedAt?: string | null;
  softDelete?: boolean;
};

const readonlyFields = new Set(["id", "created_at", "updated_at", "version"]);
export type AdminMutationResult<T extends DbRecord = DbRecord> = {
  record: T;
  before: DbRecord | null;
  table: string;
  action: string;
  id: string | number | null | undefined;
};

type MutationErrorContext = {
  reason?: "missing" | "stale" | "privacy";
  operation?: "save" | "remove";
  sourceError?: unknown;
  details?: string[];
};

export class AdminMutationError extends Error {
  code: "conflict" | "validation" | "database" | "unknown";
  stage: "read" | "validation" | "write";
  context: MutationErrorContext;

  constructor(code: AdminMutationError["code"], message: string,
    stage: AdminMutationError["stage"] = code === "validation" || code === "conflict" ? "validation" : "write",
    context: MutationErrorContext = {}) {
    super(message);
    this.code = code;
    this.stage = stage;
    this.context = context;
    this.name = "AdminMutationError";
  }
}

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

const normalizeDate = (value: unknown) => {
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) return String(value);
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return String(value);
  // PostgreSQL timestamps retain microseconds; Date alone loses their last digits.
  const fraction = typeof value === "string" ? value.match(/[T ]\d{2}:\d{2}:\d{2}\.(\d+)/)?.[1] || "" : "";
  return `${time}:${fraction.slice(3).padEnd(6, "0")}`;
};

const readVersion = (record: DbRecord): AdminMutationVersion | undefined => {
  if (Object.prototype.hasOwnProperty.call(record, "updated_at") && (record.updated_at === null || typeof record.updated_at === "string")) {
    return { field: "updated_at", value: record.updated_at as string | null };
  }
  if (Object.prototype.hasOwnProperty.call(record, "version") && typeof record.version === "number"
    && Number.isSafeInteger(record.version) && record.version >= 0 && record.version < Number.MAX_SAFE_INTEGER) {
    return { field: "version", value: record.version };
  }
  return undefined;
};

const expectedVersionChanged = (record: DbRecord, expectedUpdatedAt?: string | null) =>
  Boolean(expectedUpdatedAt && Object.prototype.hasOwnProperty.call(record, "updated_at") && normalizeDate(record.updated_at) !== normalizeDate(expectedUpdatedAt));

const conflict = (operation: "save" | "remove", stage: "validation" | "write" = "validation") =>
  new AdminMutationError("conflict", "Record changed before the mutation completed.", stage, { reason: "stale", operation });

export async function persistAdminRecord<T extends DbRecord = DbRecord>({
  table,
  payload,
  id,
  idField = "id",
  expectedUpdatedAt,
  action,
  audit = true,
}: PersistAdminRecordOptions): Promise<AdminMutationResult<T>> {
  const isUpdate = id !== undefined && id !== null && id !== "";
  const clean = cleanPayload(payload, !isUpdate);
  let before: DbRecord | null = null;

  if (isUpdate) {
    try {
      before = await fetchAdminMutationRecord(table, idField, id);
    } catch (error) {
      throw new AdminMutationError("database", "Record could not be read.", "read", { sourceError: error });
    }

    if (!before) throw new AdminMutationError("validation", "Record no longer exists.", "validation", { reason: "missing", operation: "save" });

    if (expectedVersionChanged(before, expectedUpdatedAt)) throw conflict("save");
  }

  const effectiveRecord = { ...(before || {}), ...clean };
  if (table === "landing_pages" && effectiveRecord.status === "published") {
    const privacyIssues = getLandingProjectPrivacyIssues(effectiveRecord.slug, effectiveRecord.related_projects);
    if (privacyIssues.length) {
      throw new AdminMutationError(
        "validation",
        "Landing project privacy validation failed.",
        "validation", { reason: "privacy", operation: "save", details: privacyIssues },
      );
    }
  }

  let saved: DbRecord;
  try {
    const result = isUpdate
      ? await updateAdminMutationRecord(table, idField, id as string | number, clean, before ? readVersion(before) : undefined)
      : await insertAdminMutationRecord(table, clean);
    if (!result) throw conflict("save", "write");
    saved = result;
  } catch (error) {
    if (error instanceof AdminMutationError) throw error;
    throw new AdminMutationError("database", "Record could not be written.", "write", { sourceError: error });
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

  return {
    record: saved as T, before, table, action: action || (isUpdate ? "update" : "insert"),
    id: typeof saved[idField] === "string" || typeof saved[idField] === "number" ? saved[idField] : id,
  };
}

export async function persistAdminRecordRemoval({
  table,
  id,
  idField = "id",
  expectedUpdatedAt,
  softDelete = true,
}: PersistAdminRecordRemovalOptions): Promise<AdminMutationResult> {
  let before: DbRecord | null = null;
  try {
    before = await fetchAdminMutationRecord(table, idField, id);
  } catch (error) {
    throw new AdminMutationError("database", "Record could not be read.", "read", { sourceError: error });
  }

  if (!before) throw new AdminMutationError("validation", "Record no longer exists.", "validation", { reason: "missing", operation: "remove" });
  if (expectedVersionChanged(before, expectedUpdatedAt)) throw conflict("remove");

  const shouldArchive = softDelete && "status" in before;
  let after: DbRecord | null = null;
  try {
    const version = readVersion(before);
    after = shouldArchive ? await archiveAdminMutationRecord(table, idField, id, version) : await deleteAdminMutationRecord(table, idField, id, version);
    if (!after) throw conflict("remove", "write");
  } catch (error) {
    if (error instanceof AdminMutationError) throw error;
    throw new AdminMutationError("database", "Record could not be written.", "write", { sourceError: error });
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

  return { record: after, before, table, action: shouldArchive ? "archive" : "delete", id };
}
