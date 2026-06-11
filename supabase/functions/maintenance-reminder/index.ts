import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { runMaintenanceReminder } from "./service.ts";

serve(async (req) => {
  const corsOptions = {
    headers: "authorization, x-client-info, apikey, content-type, x-cron-secret",
    methods: "GET, POST, OPTIONS",
  };
  const corsHeaders = corsHeadersFor(req, corsOptions);
  if (req.method === "OPTIONS") return handleCorsPreflight(req, corsOptions);
  if (!isAllowedCorsOrigin(req)) return Response.json({ error: "Origin not allowed" }, { status: 403, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
    }

    const client = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const adminCheck = requireSuperAdminAccess(
      await requireAdminAccess(req, client, { cronSecretEnv: "MAINTENANCE_REMINDER_CRON_SECRET" }),
    );
    if (!adminCheck.ok) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status, headers: corsHeaders });
    }

    const body = (req.method === "GET" ? {} : await req.json().catch(() => ({}))) as Record<string, unknown>;
    const result = await runMaintenanceReminder(
      {
        includeMonthly: Boolean(body.include_monthly),
        isTest: Boolean(body.test),
        mode: adminCheck.mode,
      },
      client,
    );

    return Response.json(result.body, { status: result.status ?? 200, headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Maintenance reminder failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
