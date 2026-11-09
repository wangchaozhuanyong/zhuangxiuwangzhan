import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFloatingOcclusion } from "@/hooks/useFloatingOcclusion";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import type { ContactEntryPanelProps } from "./ContactEntryPanel";
import { trackCtaClick } from "@/lib/analytics";
import "@/styles/components/contact-entry.css";


/** The same contact entry and position on every public page. */
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
  const [returnFocus, setReturnFocus] = useState(false);
  const openedPath = useRef("");
  const currentPath = useRef("");
  currentPath.current = `${location.pathname}${location.search}`;
  const opening = useRef(false);
  const closing = useRef(false);
  const [ContactPanel, setContactPanel] = useState<ComponentType<ContactEntryPanelProps> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const state = location.state as { contactEntry?: string } | null;
  const open = state?.contactEntry === owner;
  const obstructed = useFloatingOcclusion(stackRef, `${location.pathname}${location.search}`, "fixed");
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
    <button ref={entryRef} type="button" className="fc-contact-entry" lang={language}
      aria-haspopup="dialog" aria-expanded={open} aria-busy={loading} aria-disabled={loading || undefined}
      onClick={() => {
        if (opening.current) return;
        opening.current = true;
        const path = `${location.pathname}${location.search}`;
        const showPanel = () => {
          if (!active.current || currentPath.current !== path) return;
          openedPath.current = path;
          const title = document.querySelector("main h1")?.textContent?.trim();
          const service = location.pathname.includes("/services/") ? title : undefined;
          setMessage(pageWhatsAppMessage || text.message(service || text.genericService));
          void navigate(`${location.pathname}${location.search}${location.hash}`, {
            state: { ...location.state, contactEntry: owner }, preventScrollReset: true,
          });
          trackCtaClick("contact_open", "contact_entry");
        };
        setLoadError(false);
        if (ContactPanel) { showPanel(); return; }
        setLoading(true);
        void import("./ContactEntryPanel").then(({ default: Panel }) => {
          if (!active.current || currentPath.current !== path) return;
          setContactPanel(() => Panel);
          showPanel();
        }).catch(() => { if (active.current) setLoadError(true); }).finally(() => {
          if (active.current) setLoading(false);
          opening.current = false;
        });
      }}>
      <span className="fc-contact-entry__icon" aria-hidden="true"><MessageCircle /></span>
      <span className="fc-contact-entry__label" aria-live="polite">{loading ? text.loading : loadError ? text.loadError : text.trigger}</span>
    </button>
    </div>
    {open && ContactPanel && <ContactPanel message={message} onClose={close}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          setReturnFocus(openedPath.current === currentPath.current);
        }} />}
  </>;
}
