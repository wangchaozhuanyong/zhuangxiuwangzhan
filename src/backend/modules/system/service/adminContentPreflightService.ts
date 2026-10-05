import {
  requestAdminContentPreflight,
  type AdminContentPreflightRequest,
} from "@/backend/modules/system/repository/adminMutationRepository";

export type AdminContentPreflightResult = {
  recordId: string;
  expectedUpdatedAt: string;
  fieldCount: number;
  warningCount: number;
};

export type AdminContentPreflightFailure =
  | "missingVersion"
  | "conflict"
  | "protectedContent"
  | "permission"
  | "validation"
  | "invalidResponse"
  | "unavailable";

export class AdminContentPreflightError extends Error {
  constructor(public readonly reason: AdminContentPreflightFailure) {
    super(reason);
    this.name = "AdminContentPreflightError";
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

export const getAdminContentPreflightFailure = (error: unknown): AdminContentPreflightFailure =>
  error instanceof AdminContentPreflightError ? error.reason : "unavailable";

async function failureReason(error: unknown, data: unknown): Promise<AdminContentPreflightFailure> {
  let body = isRecord(data) ? data : null;
  let status = 0;
  if (isRecord(error) && error.context instanceof Response) {
    status = error.context.status;
    try {
      const parsed: unknown = await error.context.clone().json();
      if (isRecord(parsed)) body = parsed;
    } catch { /* A transport failure may not have a JSON response. */ }
  }
  const message = typeof body?.error === "string" ? body.error : "";
  // Classify privately; never expose backend errors or response bodies in the UI.
  if (/managed|locked|candidate|permit/i.test(message)) return "protectedContent";
  if (/changed by someone else|refresh before|currentUpdatedAt/i.test(message)
    || (status === 409 && typeof body?.currentUpdatedAt === "string")) return "conflict";
  if (status === 401 || status === 403 || /access required|unauthorized|forbidden/i.test(message)) return "permission";
  if (status === 400 || status === 404 || status === 409 || message) return "validation";
  return "unavailable";
}

export async function previewAdminContent(input: AdminContentPreflightRequest): Promise<AdminContentPreflightResult> {
  const recordId = input.record.id;
  if (typeof recordId !== "string" || !recordId.trim()
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(input.expectedUpdatedAt)) {
    throw new AdminContentPreflightError("missingVersion");
  }

  let response: Awaited<ReturnType<typeof requestAdminContentPreflight>>;
  try {
    response = await requestAdminContentPreflight(input);
  } catch {
    throw new AdminContentPreflightError("unavailable");
  }
  const { data, error } = response;
  if (error || data?.ok === false) {
    throw new AdminContentPreflightError(await failureReason(error, data));
  }
  if (!data || data.ok !== true || data.dry_run !== true
    || data.content_type !== input.contentType || data.existing_id !== recordId
    || data.status !== input.nextStatus || data.slug !== input.record.slug
    || !isRecord(data.payload_preview) || Object.keys(data.payload_preview).length === 0
    || (data.performed_write !== undefined && data.performed_write !== false)
    || ["saved_id", "saved_record", "saved_updated_at", "cache_invalidation"].some((key) => key in data)) {
    throw new AdminContentPreflightError("invalidResponse");
  }
  return {
    recordId,
    // Preserve PostgreSQL microseconds; Date/toISOString would truncate this value.
    expectedUpdatedAt: input.expectedUpdatedAt,
    fieldCount: Object.keys(data.payload_preview).length,
    warningCount: Array.isArray(data.warnings) ? data.warnings.length : 0,
  };
}
