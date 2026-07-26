import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess } from "../_shared/admin-auth.ts";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { BodyTooLargeError, readJsonBody } from "../_shared/request-body.ts";
import { notifyGrowthEvent } from "./service.ts";
import type { GrowthNotifyRequest } from "./types.ts";

const MAX_BODY_BYTES = 16 * 1024;

const json = (req: Request, body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req, {
        methods: "POST, OPTIONS",
        headers: "authorization, x-client-info, apikey, content-type, x-cron-secret",
      }),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight(req, {
      methods: "POST, OPTIONS",
      headers: "authorization, x-client-info, apikey, content-type, x-cron-secret",
    });
  }
  if (!isAllowedCorsOrigin(req)) return json(req, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = getServiceRoleKey();
    if (!supabaseUrl || !serviceRoleKey) return json(req, { error: "Server configuration error" }, 500);

    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const access = await requireAdminAccess(req, client, { cronSecretEnv: "GROWTH_NOTIFY_SECRET" });
    if (!access.ok) return json(req, { error: access.error || "Admin access required" }, access.status);

    let body: GrowthNotifyRequest;
    try {
      body = await readJsonBody<GrowthNotifyRequest>(req, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof BodyTooLargeError) return json(req, { error: "Request body too large" }, 413);
      return json(req, { error: "Invalid JSON body" }, 400);
    }
    const result = await notifyGrowthEvent(body, client);
    return json(req, result.body, result.status || 200);
  } catch {
    return json(req, { error: "Growth notification failed" }, 500);
  }
});
