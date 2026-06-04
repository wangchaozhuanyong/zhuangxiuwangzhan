import type { Database } from "@/lib/database.types";
import { requireSupabase } from "@/lib/supabase";

type LeadFollowupInsert = Database["public"]["Tables"]["lead_followups"]["Insert"];

export type CreateFollowupRecordInput = {
  leadId?: string | null;
  quoteRequestId?: string | null;
  followupType: string;
  content: string;
  nextFollowUpAt?: string | null;
};

export async function createFollowupRecord(input: CreateFollowupRecordInput) {
  const supabase = requireSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const payload: LeadFollowupInsert = {
    lead_id: input.leadId || null,
    quote_request_id: input.quoteRequestId || null,
    followup_type: input.followupType,
    content: input.content,
    next_follow_up_at: input.nextFollowUpAt || null,
    created_by: userData.user?.id || null,
  };

  const { error } = await supabase.from("lead_followups").insert(payload);
  if (error) throw error;

  return true;
}
