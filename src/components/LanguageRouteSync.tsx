import { useLayoutEffect, type PropsWithChildren } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDefaultLanguage, getLanguageFromPath, isLanguage, stripLanguagePrefix, withLanguagePrefix } from "@/i18n/routes";
import { loadMalayContent } from "@/i18n/malayContentRuntime";

let malayReady = false;
let malayError: unknown;
let malayLoad: Promise<unknown> | undefined;
let navigationLoad: Promise<unknown> | undefined;
export const prepareMalayContent = () => malayLoad ??= loadMalayContent()
  .then(() => { malayReady = true; }, (error: unknown) => { malayLoad = undefined; throw error; });

export const LanguageRouteSync = ({ children, preparePage }: PropsWithChildren<{ preparePage?: () => Promise<unknown> }>) => {
  const { language, setLanguage } = useLanguage();
  const { lang } = useParams<{ lang?: string }>();

  useLayoutEffect(() => {
    if (isLanguage(lang) && lang !== language) {
      setLanguage(lang);
    }
  }, [lang, language, setLanguage]);

  // Keep exactly the same child tree across languages so inputs, gallery state
  // and focus are not remounted by adding/removing a locale-only wrapper.
  if (lang === "ms" && !malayReady) {
    if (malayError) throw malayError;
    // Discover the current page's code/CSS while its required dictionary loads.
    // The shared loader deduplicates this work; React.lazy still owns errors.
    void preparePage?.().catch(() => {});
    // Speculation may fail before the user navigates. Give the real navigation
    // its own attempt; only a failure of that attempt reaches route recovery.
    throw navigationLoad ??= prepareMalayContent().catch((error: unknown) => { malayError = error; throw error; });
  }
  return children;
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
