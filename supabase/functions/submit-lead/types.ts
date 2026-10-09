import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ContactBody = {
  type: "contact";
  name: string;
  phone: string;
  email?: string;
  projectType?: string;
  location?: string;
  message: string;
  sourcePath?: string;
  website?: string;
  startedAt?: number;
  elapsedMs?: number;
  turnstileToken?: string;
  submissionId?: string;
};

export type QuoteBody = {
  type: "quote";
  name: string;
  phone: string;
  email?: string;
  projectType: string;
  location: string;
  propertySize?: string;
  budget?: string;
  details?: string;
  sourcePath?: string;
  website?: string;
  startedAt?: number;
  elapsedMs?: number;
  turnstileToken?: string;
  submissionId?: string;
};

export type SubmitBody = ContactBody | QuoteBody;

export type SubmitLeadClient = SupabaseClient;

export type SubmittedLeadIdentity = {
  id: string;
  sourcePath: string | null;
  name: string;
  phone: string;
  email: string | null;
  projectType: string | null;
  location: string | null;
  message?: string;
  propertySize?: string | null;
  budget?: string | null;
  details?: string | null;
};

export type SubmitLeadResult = {
  status?: number;
  body: {
    ok?: true;
    id?: string;
    error?: string;
    deduplicated?: true;
    internal?: true;
  };
};
