import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyLead } from "./service.ts";
import type { NotifyLeadRequest } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getServiceRoleKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
    }

    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (token !== serviceRoleKey) {
      return Response.json({ error: "Internal notification access required" }, { status: 403, headers: corsHeaders });
    }

    const body = (await req.json()) as NotifyLeadRequest;
    if (body.type !== "contact" && body.type !== "quote") {
      return Response.json({ error: "Invalid notification type" }, { status: 400, headers: corsHeaders });
    }

    const client = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    const result = await notifyLead(body, client);
    return Response.json(result.body, { status: result.status ?? 200, headers: corsHeaders });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to notify lead",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
