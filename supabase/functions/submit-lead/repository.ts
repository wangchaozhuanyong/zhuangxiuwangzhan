import type { ContactBody, QuoteBody, SubmittedLeadIdentity, SubmitLeadClient } from "./types.ts";

export async function findSubmittedLead(client: SubmitLeadClient, type: "contact" | "quote", id: string): Promise<SubmittedLeadIdentity | null> {
  const columns = type === "contact"
    ? "id,name,phone,email,project_type,location,message,source_path"
    : "id,customer_name,customer_phone,customer_email,project_type,location,property_size,estimated_budget,project_details,source_path";
  const { data, error } = await client.from(type === "contact" ? "leads" : "quote_requests")
    .select(columns).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Record<string, string | null>;
  const common = { id: row.id!, sourcePath: row.source_path, projectType: row.project_type, location: row.location };
  return type === "contact"
    ? { ...common, name: row.name!, phone: row.phone!, email: row.email, message: row.message! }
    : { ...common, name: row.customer_name!, phone: row.customer_phone!, email: row.customer_email, propertySize: row.property_size, budget: row.estimated_budget, details: row.project_details };
}

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
  const { data, error } = await client.functions.invoke("notify-lead", {
    body: { type, id },
    headers: serviceRoleKey ? { Authorization: `Bearer ${serviceRoleKey}` } : undefined,
  });
  if (error) throw error;
  // A handled dispatch can include nested provider rejection. This confirms function processing only.
  if (!data || typeof data !== "object" || data.ok !== true) throw new Error("Notification dispatch acknowledgement could not be verified");
}

export async function recordNotificationDispatchUnknown(
  client: SubmitLeadClient,
  type: ContactBody["type"] | QuoteBody["type"],
  id: string,
  reason: "dispatch_error" | "dispatch_timeout",
) {
  const { error } = await client.from("system_event_logs").insert({
    event_type: "lead_notification_delivery_failed",
    severity: "warn",
    source: "submit-lead",
    message: "Lead notification dispatch could not be verified. Manual verification is required.",
    metadata: {
      category: "notifications", categoryLabel: "通知",
      channel: "dispatch", type, id, table: type === "quote" ? "quote_requests" : "leads",
      delivery_status: "unknown", retry_policy: "manual_verify", reason,
    },
  });
  if (error) throw error;
}
