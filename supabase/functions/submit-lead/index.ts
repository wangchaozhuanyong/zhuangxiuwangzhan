import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_SUBMIT_MS = 3000;
const MAX_PER_IP_HOUR = 8;
const MAX_PER_PHONE_DAY = 5;

type ContactBody = {
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
};

type QuoteBody = {
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
};

type SubmitBody = ContactBody | QuoteBody;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

const phoneOk = (phone: string) => /^[+]?[\d\s-]{7,20}$/.test(phone);

const hashText = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const getClientIp = (req: Request) => {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
};

const checkRateLimit = async (
  supabase: ReturnType<typeof createClient>,
  formType: string,
  ipHash: string,
  phoneHash: string | null,
) => {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: ipCount, error: ipError } = await supabase
    .from("form_submission_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", hourAgo);

  if (ipError) throw ipError;
  if ((ipCount ?? 0) >= MAX_PER_IP_HOUR) {
    return { ok: false as const, message: "Too many submissions. Please try again later." };
  }

  if (phoneHash) {
    const { count: phoneCount, error: phoneError } = await supabase
      .from("form_submission_attempts")
      .select("id", { count: "exact", head: true })
      .eq("phone_hash", phoneHash)
      .gte("created_at", dayAgo);

    if (phoneError) throw phoneError;
    if ((phoneCount ?? 0) >= MAX_PER_PHONE_DAY) {
      return { ok: false as const, message: "This phone number has reached the daily submission limit." };
    }
  }

  const { error: logError } = await supabase.from("form_submission_attempts").insert({
    form_type: formType,
    ip_hash: ipHash,
    phone_hash: phoneHash,
  });
  if (logError) throw logError;

  return { ok: true as const };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Server configuration error" }, 500);
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (clean(body.website)) {
    return json({ error: "Submission rejected" }, 400);
  }

  const startedAt = Number(body.startedAt || 0);
  const elapsedMs = Number(body.elapsedMs || 0);
  const serverAgeMs = startedAt ? Date.now() - startedAt : 0;
  const isTooFast = elapsedMs > 0 ? elapsedMs < MIN_SUBMIT_MS : !startedAt || serverAgeMs < MIN_SUBMIT_MS;
  if (isTooFast) {
    return json({ error: "Please wait a moment before submitting." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const ipHash = await hashText(getClientIp(req));
  const phone = clean(body.phone, 40);
  if (!phoneOk(phone)) return json({ error: "Invalid phone number" }, 400);
  const phoneHash = await hashText(phone);

  const rate = await checkRateLimit(supabase, body.type, ipHash, phoneHash);
  if (!rate.ok) return json({ error: rate.message }, 429);

  if (body.type === "contact") {
    const name = clean(body.name, 120);
    const message = clean(body.message, 4000);
    if (!name || message.length < 10) return json({ error: "Invalid form data" }, 400);

    const id = crypto.randomUUID();
    const { error } = await supabase.from("leads").insert({
      id,
      name,
      phone,
      email: clean(body.email, 200) || null,
      project_type: clean(body.projectType, 120) || null,
      location: clean(body.location, 200) || null,
      message,
      source: "website_contact",
      source_path: clean(body.sourcePath, 300) || null,
      status: "new",
    });
    if (error) return json({ error: error.message }, 500);

    try {
      await supabase.functions.invoke("notify-lead", { body: { type: "contact", id } });
    } catch {
      // submission saved
    }
    return json({ ok: true, id });
  }

  if (body.type === "quote") {
    const name = clean(body.name, 120);
    const projectType = clean(body.projectType, 120);
    const location = clean(body.location, 200);
    if (!name || !projectType || !location) return json({ error: "Invalid form data" }, 400);

    const id = crypto.randomUUID();
    const { error } = await supabase.from("quote_requests").insert({
      id,
      customer_name: name,
      customer_phone: phone,
      customer_email: clean(body.email, 200) || null,
      project_type: projectType,
      location,
      property_size: clean(body.propertySize, 80) || null,
      estimated_budget: clean(body.budget, 80) || null,
      project_details: clean(body.details, 4000) || null,
      source_path: clean(body.sourcePath, 300) || null,
      status: "pending",
    });
    if (error) return json({ error: error.message }, 500);

    try {
      await supabase.functions.invoke("notify-lead", { body: { type: "quote", id } });
    } catch {
      // submission saved
    }
    return json({ ok: true, id });
  }

  return json({ error: "Unknown form type" }, 400);
});
