import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clean, geocodeAddress, requireAdmin } from "./service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const adminCheck = await requireAdmin(req, supabase);
    if (!adminCheck.ok) return json({ error: adminCheck.error }, adminCheck.status);

    const body = await req.json();
    const address = clean(body?.address, 500);
    if (address.length < 8) return json({ error: "Address is too short for map lookup" }, 400);

    const result = await geocodeAddress(address);
    if (!result) return json({ error: "No map coordinates found for this address" }, 404);

    return json({ ok: true, ...result });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Geocoding failed" }, 500);
  }
});
