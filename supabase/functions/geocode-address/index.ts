import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

const requireAdmin = async (req: Request, supabase: ReturnType<typeof createClient>) => {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Missing authorization token" };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { ok: false, status: 401, error: "Invalid authorization token" };

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return { ok: false, status: 500, error: adminError.message };
  if (!adminRow) return { ok: false, status: 403, error: "Admin access required" };

  return { ok: true, status: 200, error: null };
};

const parseGoogleResult = (data: any) => {
  const first = Array.isArray(data?.results) ? data.results[0] : null;
  const location = first?.geometry?.location;
  if (!location) return null;
  return {
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: first.formatted_address || "",
    provider: "google",
  };
};

const geocodeWithGoogle = async (address: string) => {
  const key = Deno.env.get("GOOGLE_MAPS_API_KEY") || Deno.env.get("GOOGLE_GEOCODING_API_KEY");
  if (!key) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("region", "my");
  url.searchParams.set("key", key);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google geocoding request failed: ${response.status}`);

  const data = await response.json();
  if (data.status === "ZERO_RESULTS") return null;
  if (data.status !== "OK") throw new Error(data.error_message || `Google geocoding failed: ${data.status}`);

  return parseGoogleResult(data);
};

const geocodeWithOpenStreetMap = async (address: string) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "my");
  url.searchParams.set("q", address);

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "flashcast-website-admin-geocoder/1.0",
      Referer: Deno.env.get("SITE_URL") || "https://flashcast.com.my",
    },
  });
  if (!response.ok) throw new Error(`OpenStreetMap geocoding request failed: ${response.status}`);

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return {
    latitude: first.lat,
    longitude: first.lon,
    formattedAddress: first.display_name || "",
    provider: "openstreetmap",
  };
};

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

    const result = (await geocodeWithGoogle(address)) || (await geocodeWithOpenStreetMap(address));
    if (!result) return json({ error: "No map coordinates found for this address" }, 404);

    return json({ ok: true, ...result });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Geocoding failed" }, 500);
  }
});
