import { AdminMutationError, persistAdminRecord } from "@/backend/modules/system";
import { addLeadFollowup } from "@/backend/modules/followups";
import {
  fetchAdminLeadDetail,
  fetchAdminLeadList,
  fetchAdminLeadReportRows,
  invokeSubmitLeadFunction,
  type AdminLeadListRepositoryInput,
  type LeadUpdatePatch,
} from "@/backend/modules/leads/repository/leadRepository";
import type { FormGuardFields } from "@/lib/formGuard";
import { getTurnstileToken } from "@/lib/turnstile";
import { getLeadSubmissionId } from "@/lib/leadSubmissionIdentity";

export type AddAdminLeadFollowupInput = {
  leadId: string;
  followupType: string;
  content: string;
  nextFollowUpAt?: string | null;
  expectedUpdatedAt?: string | null;
};

export type FollowupSyncResult = {
  syncError?: unknown;
  record?: Record<string, unknown>;
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

export async function updateAdminLead(leadId: string, patch: LeadUpdatePatch, expectedUpdatedAt: string | null | undefined) {
  if (!expectedUpdatedAt) throw new AdminMutationError("conflict", "An editing version is required.", "validation", { reason: "stale", operation: "save" });
  const result = await persistAdminRecord({ table: "leads", id: leadId, payload: patch, expectedUpdatedAt });
  return result.record;
}

export function loadAdminLeads<T extends Record<string, unknown>>(input: AdminLeadListRepositoryInput, signal?: AbortSignal) {
  return fetchAdminLeadList<T>(input, signal);
}

export function loadAdminLeadDetail(leadId: string, signal?: AbortSignal) {
  return fetchAdminLeadDetail(leadId, signal);
}

export function loadAdminLeadReportRows(startIso?: string | null, signal?: AbortSignal) {
  return fetchAdminLeadReportRows(startIso, signal);
}

export const submitContactLead = async (payload: ContactSubmission & FormGuardFields) => {
  const elapsedMs = Math.max(0, Date.now() - payload.startedAt);
  const sourcePath = payload.sourcePath || currentPathWithSearch();
  const submissionId = await getLeadSubmissionId("contact", sourcePath, {
    name: payload.name, phone: payload.phone, email: payload.email,
    projectType: payload.projectType, location: payload.location, message: payload.message,
  });
  const turnstileToken = await getTurnstileToken("contact");
  const data = await invokeSubmitLeadFunction({
    type: "contact",
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    projectType: payload.projectType,
    location: payload.location,
    message: payload.message,
    sourcePath,
    submissionId,
    website: payload.website,
    startedAt: payload.startedAt,
    elapsedMs,
    turnstileToken,
  });
  return data;
};

export const submitQuoteRequest = async (payload: QuoteSubmission & FormGuardFields) => {
  const elapsedMs = Math.max(0, Date.now() - payload.startedAt);
  const sourcePath = payload.sourcePath || currentPathWithSearch();
  const submissionId = await getLeadSubmissionId("quote", sourcePath, {
    name: payload.name, phone: payload.phone, email: payload.email,
    projectType: payload.projectType, location: payload.location,
    propertySize: payload.propertySize, budget: payload.budget, details: payload.details,
  });
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
    sourcePath,
    submissionId,
    website: payload.website,
    startedAt: payload.startedAt,
    elapsedMs,
    turnstileToken,
  });
  return data;
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
    const record = await updateAdminLead(input.leadId, { next_follow_up_at: nextFollowUpAt }, input.expectedUpdatedAt);
    return { record };
  } catch (syncError) {
    return { syncError };
  }
}
