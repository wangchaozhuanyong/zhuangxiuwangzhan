import { useEffect } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDefaultLanguage, getLanguageFromPath, isLanguage, stripLanguagePrefix, withLanguagePrefix } from "@/i18n/routes";

export const LanguageRouteSync = () => {
  const { language, setLanguage } = useLanguage();
  const { lang } = useParams<{ lang?: string }>();

  useEffect(() => {
    if (isLanguage(lang) && lang !== language) {
      setLanguage(lang);
    }
  }, [lang, language, setLanguage]);

  return null;
};

export const RootLanguageRedirect = () => {
  const language = getLanguageFromPath() || getDefaultLanguage();
  return <Navigate to={`/${language}`} replace />;
};

export const LegacyLanguageRedirect = () => {
  const location = useLocation();
  const language = getDefaultLanguage();
  const path = stripLanguagePrefix(location.pathname);
  return <Navigate to={`${withLanguagePrefix(path, language)}${location.search}${location.hash}`} replace />;
};
