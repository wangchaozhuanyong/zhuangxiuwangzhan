import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { handleNotificationSettingsAction } from "./service.ts";

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req, { methods: "GET, POST, OPTIONS" });
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "GET, POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return Response.json({ error: "Origin not allowed" }, { status: 403, headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const body = req.method === "GET" ? { action: "get" } : await req.json().catch(() => ({ action: "get" }));
    const action = body.action || "get";
    const adminCheck = await requireAdminAccess(req, supabase);
    const permissionCheck = action === "get" ? adminCheck : requireSuperAdminAccess(adminCheck);

    if (!permissionCheck.ok) {
      return Response.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status, headers: corsHeaders },
      );
    }

    const result = await handleNotificationSettingsAction(supabase, body);
    return Response.json(result.body, { status: result.status, headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Notification settings request failed" },
      { status: 500, headers: corsHeaders },
    );
  }
});
