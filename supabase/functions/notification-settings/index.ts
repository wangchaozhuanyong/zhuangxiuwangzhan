import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { handleNotificationSettingsAction } from "./service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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
