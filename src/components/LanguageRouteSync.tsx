import { lazy, useLayoutEffect, type PropsWithChildren } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDefaultLanguage, getLanguageFromPath, isLanguage, stripLanguagePrefix, withLanguagePrefix } from "@/i18n/routes";

const MalayContentReady = lazy(() => import("@/i18n/malayContent"));

export const LanguageRouteSync = ({ children }: PropsWithChildren) => {
  const { language, setLanguage } = useLanguage();
  const { lang } = useParams<{ lang?: string }>();

  useLayoutEffect(() => {
    if (isLanguage(lang) && lang !== language) {
      setLanguage(lang);
    }
  }, [lang, language, setLanguage]);

  return lang === "ms" ? <MalayContentReady>{children}</MalayContentReady> : children;
};

export const RootLanguageRedirect = () => {
  const location = useLocation();
  const language = getLanguageFromPath() || getDefaultLanguage();
  return <Navigate to={`/${language}${location.search}${location.hash}`} replace />;
};

export const LegacyLanguageRedirect = () => {
  const location = useLocation();
  const language = getDefaultLanguage();
  const path = stripLanguagePrefix(location.pathname);
  return <Navigate to={`${withLanguagePrefix(path, language)}${location.search}${location.hash}`} replace />;
};

export const ProductsToMaterialsRedirect = () => {
  const location = useLocation();
  const path = location.pathname.replace(/^\/(en|zh|ms)\/products(?=\/|$)/, "/$1/materials");
  return <Navigate to={`${path}${location.search}${location.hash}`} replace />;
};
