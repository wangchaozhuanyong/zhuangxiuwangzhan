import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminAccess } from "../_shared/admin-auth.ts";
import type { AdminAccessResult, GeocodeResult } from "./types.ts";

type SupabaseClient = ReturnType<typeof createClient>;

export const clean = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);

export const requireAdmin = async (req: Request, supabase: SupabaseClient): Promise<AdminAccessResult> => {
  const adminCheck = await requireAdminAccess(req, supabase);
  return { ok: adminCheck.ok, status: adminCheck.status, error: adminCheck.error };
};

const parseGoogleResult = (data: any): GeocodeResult | null => {
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

const geocodeWithGoogle = async (address: string): Promise<GeocodeResult | null> => {
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

const geocodeWithOpenStreetMap = async (address: string): Promise<GeocodeResult | null> => {
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

export const geocodeAddress = async (address: string) =>
  (await geocodeWithGoogle(address)) || (await geocodeWithOpenStreetMap(address));
