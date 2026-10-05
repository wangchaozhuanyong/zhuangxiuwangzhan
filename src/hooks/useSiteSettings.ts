import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchSiteSettings, fallbackSiteSettings, resolveSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";

// The fallback can paint immediately, but the first brand handoff waits for the
// actual logo/name decision. Cached data and background refreshes do not block.
export const useSiteSettingsReadiness = () => useSiteSettingsQuery().isLoading;

export const useSiteSettings = () => {
  const { language } = useLanguage();
  const { data: settings = fallbackSiteSettings } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async ({ signal }) => {
      try {
        return await fetchSiteSettings(signal);
      } catch {
        return fallbackSiteSettings;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: fallbackSiteSettings,
  });

  return useMemo(() => resolveSiteSettings(settings, language), [language, settings]);
};
