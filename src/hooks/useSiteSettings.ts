import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchSiteSettings, fallbackSiteSettings, resolveSiteSettings, type SiteSettings } from "@/lib/siteSettingsApi";

export const useSiteSettings = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<SiteSettings>(fallbackSiteSettings);

  useEffect(() => {
    let active = true;
    void fetchSiteSettings().then((data) => {
      if (active) setSettings(data);
    });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => resolveSiteSettings(settings, language), [language, settings]);
};
