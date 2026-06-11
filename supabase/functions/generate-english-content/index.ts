import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { generateEnglishContent } from "./service.ts";
import type { GenerateEnglishRequest } from "./types.ts";

const getServiceRoleKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req, { methods: "POST, OPTIONS" });
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return Response.json({ error: "Origin not allowed" }, { status: 403, headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.match(/^Bearer\s+\S+/i)) {
    return Response.json({ error: "Missing authorization token" }, { status: 401, headers: corsHeaders });
  }

  let body: GenerateEnglishRequest;
  try {
    body = (await req.json()) as GenerateEnglishRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }

  const serviceRoleKey = getServiceRoleKey();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!serviceRoleKey || !supabaseUrl) {
    return Response.json({ error: "Server configuration error" }, { status: 500, headers: corsHeaders });
  }

  const client = createClient(supabaseUrl, serviceRoleKey);
  const result = await generateEnglishContent(req, body, client);
  return Response.json(result.body, { status: result.status ?? 200, headers: corsHeaders });
});
