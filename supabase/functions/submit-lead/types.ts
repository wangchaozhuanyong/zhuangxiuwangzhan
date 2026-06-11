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
};

export type SubmitBody = ContactBody | QuoteBody;

export type SubmitLeadClient = SupabaseClient;

export type SubmitLeadResult = {
  status?: number;
  body: {
    ok?: true;
    id?: string;
    error?: string;
  };
};
