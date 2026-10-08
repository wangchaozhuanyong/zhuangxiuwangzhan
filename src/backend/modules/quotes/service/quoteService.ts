import { AdminMutationError, persistAdminRecord } from "@/backend/modules/system";
import { addQuoteFollowup } from "@/backend/modules/followups";
import {
  fetchAdminQuoteDetail,
  fetchAdminQuoteList,
  fetchAdminQuoteReportRows,
  type AdminQuoteListRepositoryInput,
  type QuoteUpdatePatch,
} from "@/backend/modules/quotes/repository/quoteRepository";

export type AddAdminQuoteFollowupInput = {
  quoteRequestId: string;
  followupType: string;
  content: string;
  nextFollowUpAt?: string | null;
  expectedUpdatedAt?: string | null;
};

export type QuoteFollowupSyncResult = {
  syncError?: unknown;
  record?: Record<string, unknown>;
};

export async function updateAdminQuote(quoteRequestId: string, patch: QuoteUpdatePatch, expectedUpdatedAt: string | null | undefined) {
  if (!expectedUpdatedAt) throw new AdminMutationError("conflict", "An editing version is required.", "validation", { reason: "stale", operation: "save" });
  const result = await persistAdminRecord({ table: "quote_requests", id: quoteRequestId, payload: patch, expectedUpdatedAt });
  return result.record;
}

export function loadAdminQuotes<T extends Record<string, unknown>>(input: AdminQuoteListRepositoryInput, signal?: AbortSignal) {
  return fetchAdminQuoteList<T>(input, signal);
}

export function loadAdminQuoteDetail(quoteRequestId: string, signal?: AbortSignal) {
  return fetchAdminQuoteDetail(quoteRequestId, signal);
}

export function loadAdminQuoteReportRows(startIso?: string | null, signal?: AbortSignal) {
  return fetchAdminQuoteReportRows(startIso, signal);
}

export async function addAdminQuoteFollowup(input: AddAdminQuoteFollowupInput): Promise<QuoteFollowupSyncResult> {
  const nextFollowUpAt = input.nextFollowUpAt || null;

  await addQuoteFollowup({
    quoteRequestId: input.quoteRequestId,
    followupType: input.followupType,
    content: input.content,
    nextFollowUpAt,
  });

  if (!nextFollowUpAt) return {};

  try {
    const record = await updateAdminQuote(input.quoteRequestId, { next_follow_up_at: nextFollowUpAt }, input.expectedUpdatedAt);
    return { record };
  } catch (syncError) {
    return { syncError };
  }
}
