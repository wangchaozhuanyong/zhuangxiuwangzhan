import { useInteractionQuery as useQuery } from "@/hooks/useInteractionQuery";
import { useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchSiteSettings, fallbackSiteSettings, resolveSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";
import { INTERACTION_POLICY } from "@/lib/interactionPolicy";

// All consumers share the same remote result. Rendering a fallback must never
// turn a failed request into a successful cache write or replace confirmed data.
export const useSiteSettingsQuery = () => useQuery<SiteSettings>({
  queryKey: ["site-settings"],
  queryFn: ({ signal }) => fetchSiteSettings(signal),
  staleTime: INTERACTION_POLICY.adminListStaleTime,
  gcTime: INTERACTION_POLICY.gcTime,
  refetchOnWindowFocus: false,
});

// The fallback can paint immediately, but the first brand handoff waits for the
// actual logo/name decision. Cached data and background refreshes do not block.
export const useSiteSettingsReadiness = () => useSiteSettingsQuery().isLoading;

export const useSiteSettings = () => {
  const { language } = useLanguage();
  const { data: settings = fallbackSiteSettings } = useSiteSettingsQuery();

  return useMemo(() => resolveSiteSettings(settings, language), [language, settings]);
};
