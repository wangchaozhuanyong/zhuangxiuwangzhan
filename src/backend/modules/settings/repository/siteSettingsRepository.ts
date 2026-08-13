import { isSupabaseConfigured } from "@/lib/supabaseConfig";
import type { SiteSettings } from "@/lib/siteSettingsApi";

export const hasSiteSettingsDatabaseClient = () => isSupabaseConfigured;

const getSiteSettingsClient = async () => {
  if (!isSupabaseConfigured) return null;
  return (await import("@/lib/supabase")).supabase;
};

export async function fetchDefaultSiteSettingsRecord() {
  const supabase = await getSiteSettingsClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", "default").maybeSingle();
  if (error) return null;
  return (data as Partial<SiteSettings> | null) || null;
}

export async function upsertDefaultSiteSettingsRecord(settings: SiteSettings) {
  const supabase = await getSiteSettingsClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("site_settings").upsert({ id: "default", ...settings }, { onConflict: "id" });
  if (error) throw error;
}
