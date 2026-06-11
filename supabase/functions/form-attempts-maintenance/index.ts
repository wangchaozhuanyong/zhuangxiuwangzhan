import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { cleanupFormSubmissionAttempts } from "./service.ts";

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
    const adminCheck = requireSuperAdminAccess(await requireAdminAccess(req, client));
    if (!adminCheck.ok) {
      return json(req, { error: adminCheck.error || "Super admin access required" }, adminCheck.status);
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await cleanupFormSubmissionAttempts(
      {
        retentionDays: body.retentionDays,
        dryRun: body.dryRun,
        mode: adminCheck.mode,
      },
      client,
    );

    return json(req, result.body, result.status);
  } catch (error) {
    return json(
      req,
      {
        error: error instanceof Error ? error.message : "Form submission attempt cleanup failed",
      },
      500,
    );
  }
});
