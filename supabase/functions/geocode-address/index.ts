import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, handleCorsPreflight, isAllowedCorsOrigin } from "../_shared/cors.ts";
import { clean, geocodeAddress, requireAdmin } from "./service.ts";

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req, { methods: "POST, OPTIONS" }), "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflight(req, { methods: "POST, OPTIONS" });
  if (!isAllowedCorsOrigin(req)) return json(req, { error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl || !serviceRoleKey) {
      return json(req, { error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const adminCheck = await requireAdmin(req, supabase);
    if (!adminCheck.ok) return json(req, { error: adminCheck.error }, adminCheck.status);

    const body = await req.json();
    const address = clean(body?.address, 500);
    if (address.length < 8) return json(req, { error: "Address is too short for map lookup" }, 400);

    const result = await geocodeAddress(address);
    if (!result) return json(req, { error: "No map coordinates found for this address" }, 404);

    return json(req, { ok: true, ...result });
  } catch (error) {
    return json(req, { error: error instanceof Error ? error.message : "Geocoding failed" }, 500);
  }
});
