import { addLeadFollowup } from "@/backend/modules/followups/service/followupService";
import {
  fetchAdminLeadDetail,
  fetchAdminLeadList,
  fetchAdminLeadReportRows,
  invokeSubmitLeadFunction,
  updateLeadRecord,
  type AdminLeadListRepositoryInput,
  type LeadUpdatePatch,
} from "@/backend/modules/leads/repository/leadRepository";
import type { FormGuardFields } from "@/lib/formGuard";
import { getTurnstileToken } from "@/lib/turnstile";

export type AddAdminLeadFollowupInput = {
  leadId: string;
  followupType: string;
  content: string;
  nextFollowUpAt?: string | null;
};

export type FollowupSyncResult = {
  syncError?: unknown;
};

export interface ContactSubmission {
  name: string;
  phone: string;
  email?: string;
  projectType?: string;
  location?: string;
  message: string;
  sourcePath?: string;
}

export interface QuoteSubmission {
  name: string;
  phone: string;
  email?: string;
  projectType: string;
  location: string;
  propertySize?: string;
  budget?: string;
  details?: string;
  sourcePath?: string;
}

const currentPathWithSearch = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
};

export function updateAdminLead(leadId: string, patch: LeadUpdatePatch) {
  return updateLeadRecord(leadId, patch);
}

export function loadAdminLeads<T extends Record<string, unknown>>(input: AdminLeadListRepositoryInput) {
  return fetchAdminLeadList<T>(input);
}

export function loadAdminLeadDetail(leadId: string) {
  return fetchAdminLeadDetail(leadId);
}

export function loadAdminLeadReportRows(startIso?: string | null) {
  return fetchAdminLeadReportRows(startIso);
}

export const submitContactLead = async (payload: ContactSubmission & FormGuardFields) => {
  const elapsedMs = Math.max(0, Date.now() - payload.startedAt);
  const turnstileToken = await getTurnstileToken("contact");
  const data = await invokeSubmitLeadFunction({
    type: "contact",
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    projectType: payload.projectType,
    location: payload.location,
    message: payload.message,
    sourcePath: payload.sourcePath || currentPathWithSearch(),
    website: payload.website,
    startedAt: payload.startedAt,
    elapsedMs,
    turnstileToken,
  });
  return { id: data.id || "" };
};

export const submitQuoteRequest = async (payload: QuoteSubmission & FormGuardFields) => {
  const elapsedMs = Math.max(0, Date.now() - payload.startedAt);
  const turnstileToken = await getTurnstileToken("quote");
  const data = await invokeSubmitLeadFunction({
    type: "quote",
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    projectType: payload.projectType,
    location: payload.location,
    propertySize: payload.propertySize,
    budget: payload.budget,
    details: payload.details,
    sourcePath: payload.sourcePath || currentPathWithSearch(),
    website: payload.website,
    startedAt: payload.startedAt,
    elapsedMs,
    turnstileToken,
  });
  return { id: data.id || "" };
};

export async function addAdminLeadFollowup(input: AddAdminLeadFollowupInput): Promise<FollowupSyncResult> {
  const nextFollowUpAt = input.nextFollowUpAt || null;

  await addLeadFollowup({
    leadId: input.leadId,
    followupType: input.followupType,
    content: input.content,
    nextFollowUpAt,
  });

  if (!nextFollowUpAt) return {};

  try {
    await updateLeadRecord(input.leadId, { next_follow_up_at: nextFollowUpAt });
    return {};
  } catch (syncError) {
    return { syncError };
  }
}
