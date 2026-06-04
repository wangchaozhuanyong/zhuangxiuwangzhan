import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function invokeGeocodeAddressFunction<T>(address: string): Promise<T | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const response = await supabase.functions.invoke<T>("geocode-address", {
    body: { address },
  });
  if (response.error) throw response.error;

  return response.data ?? null;
}
