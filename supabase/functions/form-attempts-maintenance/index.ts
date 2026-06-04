import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getServiceRoleKey, requireAdminAccess, requireSuperAdminAccess } from "../_shared/admin-auth.ts";
import { cleanupFormSubmissionAttempts } from "./service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = getServiceRoleKey();
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase server credentials are not configured" }, 500);
    }

    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const adminCheck = requireSuperAdminAccess(await requireAdminAccess(req, client));
    if (!adminCheck.ok) {
      return json({ error: adminCheck.error || "Super admin access required" }, adminCheck.status);
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

    return json(result.body, result.status);
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Form submission attempt cleanup failed",
      },
      500,
    );
  }
});
