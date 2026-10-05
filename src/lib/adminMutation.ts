import type { QueryClient } from "@tanstack/react-query";
import {
  AdminMutationError,
  persistAdminRecord,
  persistAdminRecordRemoval,
  requestPublicContentInvalidation,
  type AdminMutationDbRecord,
  type AdminMutationResult,
  type PersistAdminRecordOptions,
  type PersistAdminRecordRemovalOptions,
} from "@/backend/modules/system";
import { adminMutationText } from "@/i18n/adminMutationText";
import type { Language } from "@/i18n/routes";
import { invalidateAdminResource } from "@/lib/adminInvalidate";
import { getPublicSyncIssues, registerPublicSyncIssue, resolvePublicSyncIssue, type PublicSyncIssue } from "@/lib/publicSyncRecovery";
import { formatUserFacingError } from "@/lib/userFacingText";

export { AdminMutationError, requestPublicContentInvalidation };

type SaveAdminRecordOptions = PersistAdminRecordOptions & {
  queryClient?: QueryClient;
  invalidate?: "published" | "admin-content" | "none";
};
type DeleteAdminRecordOptions = PersistAdminRecordRemovalOptions & { queryClient?: QueryClient };

export const formatAdminMutationError = (error: unknown, language: Language = "zh"): string => {
  const text = adminMutationText[language];
  if (error instanceof AdminMutationError) {
    const { reason, operation, sourceError, details } = error.context;
    if (reason === "missing") return operation === "remove" ? text.missingRemove : text.missingSave;
    if (reason === "stale") return operation === "remove" ? text.staleRemove : text.staleSave;
    if (reason === "privacy") return text.privacy.replace("{fields}", (details || []).join(", "));
    if (sourceError) return formatAdminMutationError(sourceError, language);
    return error.message;
  }
  const record = error as { message?: string; code?: string; hint?: string; details?: string };
  const raw = record?.message || (error instanceof Error ? error.message : String(error || ""));
  if (raw.includes("duplicate key") || record?.code === "23505") return text.duplicate;
  if (raw.includes("violates row-level security") || raw.includes("permission denied")) return text.permission;
  if (raw.includes("invalid input value for enum")) return text.invalidStatus;
  return formatUserFacingError([raw, record?.hint, record?.details].filter(Boolean).join(" "), language);
};

const publicContentTables = new Set([
  "about_sections", "before_after_items", "blog_posts", "brand_partners", "cms_pages", "cms_sections",
  "cta_blocks", "faqs", "hero_slides", "home_sections", "landing_pages", "materials", "process_steps",
  "projects", "promotions", "service_areas", "services", "site_pages", "site_settings", "testimonials",
]);

export const mutationAffectsPublishedContent = (
  table: string, before: AdminMutationDbRecord | null | undefined, after: AdminMutationDbRecord | null | undefined,
) => publicContentTables.has(table) && (table === "site_settings" || before?.status === "published" || after?.status === "published");

async function completeMutationDelivery(result: AdminMutationResult, queryClient?: QueryClient, mode: SaveAdminRecordOptions["invalidate"] = "admin-content") {
  const { table, action, id, before, record } = result;
  const key = `${table}:${id ?? ""}:${action}`;
  const previousIssue = getPublicSyncIssues().find((issue) => issue.key === key) || null;
  let clientCacheFailed = false;
  let publicSyncFailed = false;
  let publicRevision: string | null = null;
  if (queryClient && mode !== "none") {
    try { await invalidateAdminResource(queryClient, table); }
    catch { clientCacheFailed = true; }
  }
  if (mutationAffectsPublishedContent(table, before, record)) {
    try {
      const delivery = await requestPublicContentInvalidation({ table, action, id });
      publicRevision = delivery.cache_invalidation?.revision || null;
    } catch { publicSyncFailed = true; }
  }
  if (clientCacheFailed || publicSyncFailed) {
    const retryClientCache = queryClient && (mode !== "none" || publicSyncFailed) ? queryClient : undefined;
    const issue: PublicSyncIssue = { key, retry: async () => {
      if (publicSyncFailed) {
        await requestPublicContentInvalidation({ table, action, id });
        publicSyncFailed = false;
      }
      if (retryClientCache) await invalidateAdminResource(retryClientCache, table);
      resolvePublicSyncIssue(key, issue);
    } };
    registerPublicSyncIssue(issue);
  } else {
    resolvePublicSyncIssue(key, previousIssue);
  }
  // Delivery recovery cannot repeat or erase the committed write.
  return publicRevision;
}

function displayMutationError(error: unknown): never {
  if (error instanceof AdminMutationError) {
    error.message = formatAdminMutationError(error);
    throw error;
  }
  throw error;
}

/** Browser compatibility adapter: the persistence core has no QueryClient or UI dependency. */
export async function saveAdminRecord<T extends AdminMutationDbRecord = AdminMutationDbRecord>(
  { queryClient, invalidate = "admin-content", ...options }: SaveAdminRecordOptions,
): Promise<T> {
  let result: AdminMutationResult<T>;
  try { result = await persistAdminRecord<T>(options); }
  catch (error) { displayMutationError(error); }
  const revision = await completeMutationDelivery(result, queryClient, invalidate);
  if (result.table === "site_settings" && revision) {
    const record: AdminMutationDbRecord = result.record;
    record.updated_at = revision;
  }
  return result.record;
}

export async function archiveOrDeleteAdminRecord({ queryClient, ...options }: DeleteAdminRecordOptions) {
  let result: AdminMutationResult;
  try { result = await persistAdminRecordRemoval(options); }
  catch (error) { displayMutationError(error); }
  await completeMutationDelivery(result, queryClient);
  return result.record;
}
export {
  AdminContentPreflightError,
  getAdminContentPreflightFailure,
  previewAdminContent,
  type AdminContentPreflightFailure,
  type AdminContentPreflightResult,
} from "@/backend/modules/system/service/adminContentPreflightService";
