import { requireSupabase } from "@/lib/supabase";
import type { FormGuardFields } from "@/lib/formGuard";

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

const invokeSubmitLead = async (body: Record<string, unknown>) => {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke("submit-lead", { body });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as { ok?: boolean; id?: string };
};

export const submitContactLead = async (payload: ContactSubmission & FormGuardFields) => {
  const elapsedMs = Math.max(0, Date.now() - payload.startedAt);
  const data = await invokeSubmitLead({
    type: "contact",
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    projectType: payload.projectType,
    location: payload.location,
    message: payload.message,
    sourcePath: payload.sourcePath || (typeof window !== "undefined" ? window.location.pathname : ""),
    website: payload.website,
    startedAt: payload.startedAt,
    elapsedMs,
  });
  return { id: data.id || "" };
};

export const submitQuoteRequest = async (payload: QuoteSubmission & FormGuardFields) => {
  const elapsedMs = Math.max(0, Date.now() - payload.startedAt);
  const data = await invokeSubmitLead({
    type: "quote",
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    projectType: payload.projectType,
    location: payload.location,
    propertySize: payload.propertySize,
    budget: payload.budget,
    details: payload.details,
    sourcePath: payload.sourcePath || (typeof window !== "undefined" ? window.location.pathname : ""),
    website: payload.website,
    startedAt: payload.startedAt,
    elapsedMs,
  });
  return { id: data.id || "" };
};
