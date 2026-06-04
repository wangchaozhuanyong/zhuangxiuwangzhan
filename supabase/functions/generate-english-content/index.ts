import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEnglishContent } from "./service.ts";
import type { GenerateEnglishRequest } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getServiceRoleKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = (await req.json()) as GenerateEnglishRequest;
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    return Response.json({ error: "Service role key is not configured" }, { status: 500, headers: corsHeaders });
  }

  const client = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
  const result = await generateEnglishContent(req, body, client);
  return Response.json(result.body, { status: result.status ?? 200, headers: corsHeaders });
});
