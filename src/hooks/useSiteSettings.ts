import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchSiteSettings, fallbackSiteSettings, resolveSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";

export const useSiteSettings = () => {
  const { language } = useLanguage();
  const { data: settings = fallbackSiteSettings } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      try {
        return await fetchSiteSettings();
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
