import { createFollowupRecord } from "@/backend/modules/followups/repository/followupRepository";

export type AddFollowupInput = {
  followupType: string;
  content: string;
  nextFollowUpAt?: string | null;
};

export type AddLeadFollowupInput = AddFollowupInput & {
  leadId: string;
};

export type AddQuoteFollowupInput = AddFollowupInput & {
  quoteRequestId: string;
};

const cleanFollowupContent = (content: string) => content.trim();

export function addLeadFollowup(input: AddLeadFollowupInput) {
  return createFollowupRecord({
    leadId: input.leadId,
    followupType: input.followupType,
    content: cleanFollowupContent(input.content),
    nextFollowUpAt: input.nextFollowUpAt || null,
  });
}

export function addQuoteFollowup(input: AddQuoteFollowupInput) {
  return createFollowupRecord({
    quoteRequestId: input.quoteRequestId,
    followupType: input.followupType,
    content: cleanFollowupContent(input.content),
    nextFollowUpAt: input.nextFollowUpAt || null,
  });
}
