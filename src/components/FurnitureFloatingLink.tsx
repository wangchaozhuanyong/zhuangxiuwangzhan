import { lazy, Suspense, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFloatingOcclusion } from "@/hooks/useFloatingOcclusion";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import { furnitureShopUrlForLanguage, isFurniturePublicPath } from "@/lib/furnitureCatalogConfig";
import type { ContactEntryPanelProps } from "./ContactEntryPanel";
import { trackCtaClick } from "@/lib/analytics";
import "@/styles/components/contact-entry.css";


function FurnitureShopFallback() {
  const { language } = useLanguage();
  const text = contactEntryText[language];
  return <a className="fc-furniture-floating fc-furniture-floating--fallback" lang={language}
    href={furnitureShopUrlForLanguage(language)} target="_blank" rel="noopener noreferrer">
    <span>{text.furniture}</span>{text.shopLanguage && <small>{text.shopLanguage}</small>}
  </a>;
}
const FurnitureShopEntry = lazy(() => import("./FurnitureShopEntry").catch(() => ({ default: FurnitureShopFallback })));

/** One shared position and collision boundary for the public contact/shop entries. */
export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const text = contactEntryText[language];
  const { menuOpen, hasOpenDialog, pageWhatsAppMessage } = usePublicChrome();
  const entryRef = useRef<HTMLButtonElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [owner] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [Panel, setPanel] = useState<ComponentType<ContactEntryPanelProps> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [returnFocus, setReturnFocus] = useState(false);
  const openedPath = useRef("");
  const currentPath = useRef("");
  currentPath.current = `${location.pathname}${location.search}`;
  const opening = useRef(false);
  const closing = useRef(false);
  const mounted = useRef(true);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const state = location.state as { contactEntry?: string } | null;
  const open = state?.contactEntry === owner;
  const obstructed = useFloatingOcclusion(stackRef, `${location.pathname}${location.search}`);
  useLayoutEffect(() => { opening.current = open; if (open) closing.current = false; }, [open]);
  useLayoutEffect(() => {
    if (!returnFocus || open || menuOpen || hasOpenDialog || obstructed) return;
    entryRef.current?.focus({ preventScroll: true });
    setReturnFocus(false);
  }, [returnFocus, open, menuOpen, hasOpenDialog, obstructed]);
  const close = () => {
    if (!open || closing.current) return;
    closing.current = true;
    void navigate(-1);
  };
  const suppressed = open || menuOpen || hasOpenDialog || obstructed;
  if (/^\/admin(?:\/|$)/.test(location.pathname)) return null;
  return <>
    <div ref={stackRef} className="fc-contact-stack" data-obstructed={suppressed || undefined}
      aria-hidden={suppressed || undefined}>
    {isFurniturePublicPath(location.pathname) && <Suspense fallback={<FurnitureShopFallback />}><FurnitureShopEntry /></Suspense>}
    <button ref={entryRef} type="button" className="fc-contact-entry" lang={language}
      disabled={loading} aria-busy={loading || undefined} aria-haspopup="dialog" aria-expanded={open}
      onClick={async () => {
        if (opening.current) return;
        opening.current = true;
        setLoadError(false);
        openedPath.current = `${location.pathname}${location.search}`;
        const title = document.querySelector("main h1")?.textContent?.trim();
        const service = location.pathname.includes("/services/") ? title : undefined;
        setMessage(pageWhatsAppMessage || text.message(service || text.genericService));
        if (!Panel) {
          setLoading(true);
          try {
            const { default: ContactPanel } = await import("./ContactEntryPanel");
            if (!mounted.current) return;
            setPanel(() => ContactPanel);
          } catch {
            opening.current = false;
            setLoadError(true);
            setLoading(false);
            return;
          }
          setLoading(false);
          if (currentPath.current !== openedPath.current) { opening.current = false; return; }
        }
        void navigate(`${location.pathname}${location.search}${location.hash}`, {
          state: { ...location.state, contactEntry: owner }, preventScrollReset: true,
        });
        trackCtaClick("contact_open", "contact_entry");
      }}><MessageCircle aria-hidden="true" /><span aria-live="polite">{loading ? text.loading : loadError ? text.loadError : text.trigger}</span></button>
    </div>
    {open && Panel && <Panel message={message} onClose={close}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          setReturnFocus(openedPath.current === currentPath.current);
        }} />}
  </>;
}
