import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, Globe2 } from "lucide-react";
import { prepareMalayContent } from "@/components/LanguageRouteSync";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageOptions, languageSelectorText } from "@/i18n/languageSelectorText";
import "@/styles/components/language-selector.css";

const loadDrawer = () => import("@/components/LanguageDrawer");
const LanguageDrawer = lazy(loadDrawer);

const isCatalogLanguageSwitch = (pathname: string) =>
  /^\/(?:en|zh)\/(?:custom-cabinets|furniture(?:\/[^/]+){0,2})\/?$/.test(pathname);

function warmCatalogMalayContent() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return;
  // Use the same readiness promise as an actual Malay route. A failed warmup
  // is optional and must leave the normal navigation retry available.
  void prepareMalayContent().catch(() => undefined);
}

export default function LanguageSelector({ placement = "header" }: { placement?: "header" | "footer" }) {
  const { language } = useLanguage();
  const location = useLocation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const routeContentKey = `${location.pathname}${location.search}`;
  const routeKey = `${routeContentKey}${location.hash}`;
  const open = openPath === routeKey;
  const text = languageSelectorText[language];
  const selected = languageOptions.find((option) => option.code === language)!;
  const catalogLanguageSwitch = isCatalogLanguageSwitch(location.pathname);
  useEffect(() => {
    if (placement !== "header" || !catalogLanguageSwitch) return;

    // The current page's first render and critical images take precedence.
    const onRouteReady = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.routeKey === routeContentKey && event.detail.degraded === false) {
        warmCatalogMalayContent();
      }
    };
    if (document.querySelector('.public-route-content[data-route-visual-state="ready"]')) warmCatalogMalayContent();
    window.addEventListener("public-route-ready", onRouteReady);
    return () => window.removeEventListener("public-route-ready", onRouteReady);
  }, [catalogLanguageSwitch, routeContentKey, placement]);

  const warmDrawer = () => {
    void loadDrawer().catch(() => undefined);
    if (catalogLanguageSwitch) warmCatalogMalayContent();
  };

  return <>
    <button ref={triggerRef} type="button" className={`language-selector language-selector--${placement}`}
      aria-label={`${text.trigger}: ${text.names[language]}`} aria-haspopup="dialog" aria-expanded={open}
      onPointerEnter={warmDrawer} onFocus={warmDrawer}
      onKeyDown={(event) => { if (event.key === "Escape") setOpenPath(null); }}
      onClick={() => { warmDrawer(); setOpenPath(routeKey); }}>
      <Globe2 aria-hidden="true" /><span lang={selected.tag}>{text.shortNames[language]}</span><ChevronDown aria-hidden="true" />
    </button>
    {open && <Suspense fallback={null}><LanguageDrawer triggerRef={triggerRef} close={() => setOpenPath(null)} /></Suspense>}
  </>;
}
