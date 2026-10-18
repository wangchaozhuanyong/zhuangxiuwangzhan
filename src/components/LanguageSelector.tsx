import { lazy, Suspense, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, Globe2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { languageOptions, languageSelectorText } from "@/i18n/languageSelectorText";
import "@/styles/components/language-selector.css";

const loadDrawer = () => import("@/components/LanguageDrawer");
const LanguageDrawer = lazy(loadDrawer);

export default function LanguageSelector({ placement = "header" }: { placement?: "header" | "footer" }) {
  const { language } = useLanguage();
  const location = useLocation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const open = openPath === routeKey;
  const text = languageSelectorText[language];
  const selected = languageOptions.find((option) => option.code === language)!;
  const warmDrawer = () => { void loadDrawer().catch(() => undefined); };

  return <>
    <button ref={triggerRef} type="button" className={`language-selector language-selector--${placement}`}
      aria-label={`${text.trigger}: ${selected.name}`} aria-haspopup="dialog" aria-expanded={open}
      onPointerEnter={warmDrawer} onFocus={warmDrawer}
      onKeyDown={(event) => { if (event.key === "Escape") setOpenPath(null); }}
      onClick={() => setOpenPath(routeKey)}>
      <Globe2 aria-hidden="true" /><span lang={selected.tag}>{selected.shortName}</span><ChevronDown aria-hidden="true" />
    </button>
    {open && <Suspense fallback={null}><LanguageDrawer triggerRef={triggerRef} close={() => setOpenPath(null)} /></Suspense>}
  </>;
}
