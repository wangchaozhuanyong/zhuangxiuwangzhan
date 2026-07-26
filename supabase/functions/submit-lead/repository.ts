import type { CleanLeadAttribution, ContactBody, QuoteBody, SubmitLeadClient } from "./types.ts";

type DenoRuntime = { env?: { get?: (name: string) => string | undefined } };

const getRuntimeEnv = (name: string) =>
  (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno?.env?.get?.(name);

const getServiceRoleKey = () =>
  getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY") || getRuntimeEnv("SERVICE_ROLE_KEY");

export async function countRecentAttemptsByIp(client: SubmitLeadClient, ipHash: string, sinceIso: string) {
  const { count, error } = await client
    .from("form_submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", sinceIso);

  if (error) throw error;
  return count ?? 0;
}

export async function countRecentAttemptsByPhone(client: SubmitLeadClient, phoneHash: string, sinceIso: string) {
  const { count, error } = await client
    .from("form_submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("phone_hash", phoneHash)
    .gte("created_at", sinceIso);

  if (error) throw error;
  return count ?? 0;
}

export async function recordSubmissionAttempt(
  client: SubmitLeadClient,
  formType: ContactBody["type"] | QuoteBody["type"],
  ipHash: string,
  phoneHash: string | null,
) {
  const { error } = await client.from("form_submission_attempts").insert({
    form_type: formType,
    ip_hash: ipHash,
    phone_hash: phoneHash,
  });

  if (error) throw error;
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
    attribution: CleanLeadAttribution;
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
    first_touch_source: input.attribution.firstTouchSource || null,
    first_touch_medium: input.attribution.firstTouchMedium || null,
    first_touch_campaign: input.attribution.firstTouchCampaign || null,
    first_touch_term: input.attribution.firstTouchTerm || null,
    first_touch_content: input.attribution.firstTouchContent || null,
    last_touch_source: input.attribution.lastTouchSource || null,
    last_touch_medium: input.attribution.lastTouchMedium || null,
    last_touch_campaign: input.attribution.lastTouchCampaign || null,
    last_touch_term: input.attribution.lastTouchTerm || null,
    last_touch_content: input.attribution.lastTouchContent || null,
    landing_page: input.attribution.landingPage || null,
    gclid: input.attribution.gclid || null,
    gbraid: input.attribution.gbraid || null,
    wbraid: input.attribution.wbraid || null,
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
    attribution: CleanLeadAttribution;
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
    first_touch_source: input.attribution.firstTouchSource || null,
    first_touch_medium: input.attribution.firstTouchMedium || null,
    first_touch_campaign: input.attribution.firstTouchCampaign || null,
    first_touch_term: input.attribution.firstTouchTerm || null,
    first_touch_content: input.attribution.firstTouchContent || null,
    last_touch_source: input.attribution.lastTouchSource || null,
    last_touch_medium: input.attribution.lastTouchMedium || null,
    last_touch_campaign: input.attribution.lastTouchCampaign || null,
    last_touch_term: input.attribution.lastTouchTerm || null,
    last_touch_content: input.attribution.lastTouchContent || null,
    landing_page: input.attribution.landingPage || null,
    gclid: input.attribution.gclid || null,
    gbraid: input.attribution.gbraid || null,
    wbraid: input.attribution.wbraid || null,
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
