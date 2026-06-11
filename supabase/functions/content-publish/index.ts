import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess } from "../_shared/admin-auth.ts";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { BodyTooLargeError, readJsonBody } from "../_shared/request-body.ts";
import { publishContent } from "./service.ts";
import type { ContentPublishRequest } from "./types.ts";

const MAX_BODY_BYTES = 512 * 1024;

const json = (req: Request, body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req, { methods: "POST, OPTIONS" }), "Content-Type": "application/json; charset=utf-8" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return json(req, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = getServiceRoleKey();
    if (!supabaseUrl || !serviceRoleKey) {
      return json(req, { error: "Supabase server credentials are not configured" }, 500);
    }

    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const adminCheck = await requireAdminAccess(req, client, { cronSecretEnv: "CONTENT_PUBLISH_SECRET" });
    if (!adminCheck.ok) return json(req, { error: adminCheck.error || "Admin access required" }, adminCheck.status);

    let body: ContentPublishRequest;
    try {
      body = await readJsonBody<ContentPublishRequest>(req, MAX_BODY_BYTES);
    } catch (error) {
      if (error instanceof BodyTooLargeError) return json(req, { error: "Request body too large" }, 413);
      return json(req, { error: "Invalid JSON body" }, 400);
    }

    const result = await publishContent(body, client, {
      adminUserId: adminCheck.userId || null,
      role: adminCheck.mode === "cron" ? "content_editor" : adminCheck.role || null,
      authMode: adminCheck.mode,
    });
    return json(req, result.body, result.status || 200);
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Content publish failed" }, 500);
  }
});
