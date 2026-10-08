import type { ContactBody, QuoteBody, SubmitLeadClient } from "./types.ts";

export async function findSubmittedTest(client: SubmitLeadClient, type: "contact" | "quote", id: string) {
  const { data, error } = await client.from(type === "contact" ? "leads" : "quote_requests")
    .select("id,source_path").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as { id: string; source_path: string | null } | null;
}

const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

export async function consumeSubmissionAttempt(
  client: SubmitLeadClient,
  formType: ContactBody["type"] | QuoteBody["type"],
  ipHash: string,
  phoneHash: string | null,
): Promise<"accepted" | "ip_limit" | "phone_limit"> {
  const { data, error } = await client.rpc("consume_form_submission_attempt", {
    p_form_type: formType, p_ip_hash: ipHash, p_phone_hash: phoneHash,
  });
  if (error) throw error;
  if (data !== "accepted" && data !== "ip_limit" && data !== "phone_limit") {
    throw new Error("Submission limit could not be verified");
  }
  return data;
}

export async function createContactLead(
  client: SubmitLeadClient,
  input: {
    id: string;
    name: string;
    phone: string;
    email: string;
    projectType: string;
    location: string;
    message: string;
    sourcePath: string;
  },
) {
  const { error } = await client.from("leads").insert({
    id: input.id,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    project_type: input.projectType || null,
    location: input.location || null,
    message: input.message,
    source: "website_contact",
    source_path: input.sourcePath || null,
    status: "new",
  });

  if (error) throw error;
}

export async function createQuoteRequest(
  client: SubmitLeadClient,
  input: {
    id: string;
    name: string;
    phone: string;
    email: string;
    projectType: string;
    location: string;
    propertySize: string;
    budget: string;
    details: string;
    sourcePath: string;
  },
) {
  const { error } = await client.from("quote_requests").insert({
    id: input.id,
    customer_name: input.name,
    customer_phone: input.phone,
    customer_email: input.email || null,
    project_type: input.projectType,
    location: input.location,
    property_size: input.propertySize || null,
    estimated_budget: input.budget || null,
    project_details: input.details || null,
    source_path: input.sourcePath || null,
    status: "pending",
  });

  if (error) throw error;
}

export async function notifySubmittedLead(client: SubmitLeadClient, type: ContactBody["type"] | QuoteBody["type"], id: string) {
  const serviceRoleKey = getServiceRoleKey();
  const { error } = await client.functions.invoke("notify-lead", {
    body: { type, id },
    headers: serviceRoleKey ? { Authorization: `Bearer ${serviceRoleKey}` } : undefined,
  });
  if (error) throw error;
}
