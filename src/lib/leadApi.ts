import { requireSupabase } from "@/lib/supabase";

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

const notifyLead = async (type: "contact" | "quote", id: string) => {
  const supabase = requireSupabase();

  try {
    await supabase.functions.invoke("notify-lead", {
      body: { type, id },
    });
  } catch (error) {
    console.warn("Lead notification failed. Submission was still saved.", error);
  }
};

const createSubmissionId = () => crypto.randomUUID();

export const submitContactLead = async (payload: ContactSubmission) => {
  const supabase = requireSupabase();
  const id = createSubmissionId();
  const { error } = await supabase
    .from("leads")
    .insert({
      id,
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      project_type: payload.projectType || null,
      location: payload.location || null,
      message: payload.message,
      source: "website_contact",
      source_path: payload.sourcePath || window.location.pathname,
      status: "new",
    });

  if (error) throw error;
  await notifyLead("contact", id);
  return { id };
};

export const submitQuoteRequest = async (payload: QuoteSubmission) => {
  const supabase = requireSupabase();
  const id = createSubmissionId();
  const { error } = await supabase
    .from("quote_requests")
    .insert({
      id,
      customer_name: payload.name,
      customer_phone: payload.phone,
      customer_email: payload.email || null,
      project_type: payload.projectType,
      location: payload.location,
      property_size: payload.propertySize || null,
      estimated_budget: payload.budget || null,
      project_details: payload.details || null,
      source_path: payload.sourcePath || window.location.pathname,
      status: "pending",
    });

  if (error) throw error;
  await notifyLead("quote", id);
  return { id };
};
