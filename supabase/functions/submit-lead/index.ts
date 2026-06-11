import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { BodyTooLargeError, readJsonBody } from "../_shared/request-body.ts";
import { getRequestIp, verifyTurnstileToken } from "../_shared/turnstile.ts";
import { submitLead } from "./service.ts";
import type { SubmitBody } from "./types.ts";

const MAX_BODY_BYTES = 32 * 1024;

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req, { methods: "POST, OPTIONS" }), "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return json(req, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json(req, { error: "Server configuration error" }, 500);
  }

  let body: SubmitBody;
  try {
    body = await readJsonBody<SubmitBody>(req, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return json(req, { error: "Request body too large" }, 413);
    }
    return json(req, { error: "Invalid JSON body" }, 400);
  }

  const turnstile = await verifyTurnstileToken(body.turnstileToken, getRequestIp(req));
  if (!turnstile.ok) return json(req, { error: turnstile.error }, turnstile.status);

  const client = createClient(supabaseUrl, serviceKey);
  const result = await submitLead(req, body, client);
  return json(req, result.body, result.status);
});
