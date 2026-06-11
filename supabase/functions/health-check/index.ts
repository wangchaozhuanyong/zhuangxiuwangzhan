import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { missingServerCredentialsResult, runHealthCheck } from "./service.ts";

const json = (req: Request, payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeadersFor(req, { methods: "GET, POST, OPTIONS" }), "Content-Type": "application/json; charset=utf-8" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "GET, POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return json(req, { error: "Origin not allowed" }, 403);

  const checkedAt = new Date().toISOString();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    const result = missingServerCredentialsResult(checkedAt);
    return json(req, result.body, result.status);
  }

  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const result = await runHealthCheck(req, client, checkedAt);
  return json(req, result.body, result.status);
});
