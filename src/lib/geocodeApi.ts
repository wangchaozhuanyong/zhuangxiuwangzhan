import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type GeocodeResult = {
  latitude: string;
  longitude: string;
  formattedAddress?: string;
  provider?: string;
};

const formatCoordinate = (value: unknown) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return Number(number.toFixed(7)).toString();
};

const geocodeAddressInBrowser = async (address: string): Promise<GeocodeResult> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "my");
  url.searchParams.set("q", address);

  const response = await fetch(url, {
    headers: { "Accept-Language": "en" },
  });
  if (!response.ok) {
    throw new Error(`OpenStreetMap lookup failed: ${response.status}`);
  }

  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first?.lat || !first?.lon) {
    throw new Error("No map coordinates found for this address.");
  }

  return {
    latitude: formatCoordinate(first.lat),
    longitude: formatCoordinate(first.lon),
    formattedAddress: first.display_name || "",
    provider: "openstreetmap-browser",
  };
};

export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  const cleanAddress = address.trim();
  if (!cleanAddress) {
    throw new Error("Please enter an address before updating map coordinates.");
  }

  if (!isSupabaseConfigured || !supabase) {
    return geocodeAddressInBrowser(cleanAddress);
  }

  let data: unknown;
  try {
    const response = await supabase.functions.invoke("geocode-address", {
      body: { address: cleanAddress },
    });
    if (response.error) throw response.error;
    data = response.data;
  } catch {
    return geocodeAddressInBrowser(cleanAddress);
  }

  const result = data as {
    ok?: boolean;
    error?: string;
    latitude?: string | number;
    longitude?: string | number;
    formattedAddress?: string;
    provider?: string;
  } | null;

  if (!result?.ok) {
    throw new Error(result?.error || "Automatic map coordinate lookup failed.");
  }

  const latitude = formatCoordinate(result.latitude);
  const longitude = formatCoordinate(result.longitude);
  if (!latitude || !longitude) {
    throw new Error("The map service did not return usable coordinates.");
  }

  return {
    latitude,
    longitude,
    formattedAddress: result.formattedAddress,
    provider: result.provider,
  };
};
