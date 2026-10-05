import { addQuoteFollowup } from "@/backend/modules/followups";
import {
  fetchAdminQuoteDetail,
  fetchAdminQuoteList,
  fetchAdminQuoteReportRows,
  updateQuoteRecord,
  type AdminQuoteListRepositoryInput,
  type QuoteUpdatePatch,
} from "@/backend/modules/quotes/repository/quoteRepository";

export type AddAdminQuoteFollowupInput = {
  quoteRequestId: string;
  followupType: string;
  content: string;
  nextFollowUpAt?: string | null;
};

export type QuoteFollowupSyncResult = {
  syncError?: unknown;
};

export function updateAdminQuote(quoteRequestId: string, patch: QuoteUpdatePatch) {
  return updateQuoteRecord(quoteRequestId, patch);
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
    await updateQuoteRecord(input.quoteRequestId, { next_follow_up_at: nextFollowUpAt });
    return {};
  } catch (syncError) {
    return { syncError };
  }
}
