import { useLayoutEffect, useRef, useState } from "react";
import { MessageCircle, Phone, ArrowUpRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFloatingOcclusion } from "@/hooks/useFloatingOcclusion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { trackCtaClick } from "@/lib/analytics";
import "@/styles/components/contact-entry.css";

/** Keep the shared shell mount; the former promotion now opens contact options. */
export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const text = contactEntryText[language];
  const { menuOpen, hasOpenDialog, pageWhatsAppMessage } = usePublicChrome();
  const entryRef = useRef<HTMLButtonElement>(null);
  const [owner] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [returnFocus, setReturnFocus] = useState(false);
  const openedPath = useRef("");
  const opening = useRef(false);
  const closing = useRef(false);
  const state = location.state as { contactEntry?: string } | null;
  const open = state?.contactEntry === owner;
  const obstructed = useFloatingOcclusion(entryRef, `${location.pathname}${location.search}`);
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
  return <>
    <button ref={entryRef} type="button" className="fc-contact-entry" lang={language}
      hidden={open || menuOpen || hasOpenDialog || obstructed}
      aria-haspopup="dialog" aria-expanded={open}
      onClick={() => {
        if (opening.current) return;
        opening.current = true;
        openedPath.current = `${location.pathname}${location.search}`;
        const title = document.querySelector("main h1")?.textContent?.trim();
        const service = location.pathname.includes("/services/") ? title : undefined;
        setMessage(pageWhatsAppMessage || text.message(service || text.genericService));
        void navigate(`${location.pathname}${location.search}${location.hash}`, {
          state: { ...location.state, contactEntry: owner }, preventScrollReset: true,
        });
        trackCtaClick("contact_open", "contact_entry");
      }}><MessageCircle aria-hidden="true" /><span>{text.trigger}</span></button>
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="fc-contact-panel" overlayClassName="fc-contact-overlay" closeLabel={text.close}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          setReturnFocus(openedPath.current === `${location.pathname}${location.search}`);
        }}>
        <DialogTitle>{text.title}</DialogTitle>
        <DialogDescription>{text.description}</DialogDescription>
        <a className="fc-contact-panel__primary" href={settings.whatsapp_url(message)} target="_blank" rel="noopener noreferrer"
          onClick={() => trackCtaClick("whatsapp", "contact_panel", { destination: "whatsapp" })}>
          <WhatsAppIcon aria-hidden="true" /><span>{text.whatsapp}</span><ArrowUpRight aria-hidden="true" />
        </a>
        <p className="fc-contact-panel__note">{text.note}</p>
        <a className="fc-contact-panel__row" href={settings.phone_href}
          onClick={() => trackCtaClick("phone", "contact_panel", { destination: "phone" })}>
          <Phone aria-hidden="true" /><span>{text.phone}<small>{settings.phone_display}</small></span>
        </a>
        <LocalizedLink className="fc-contact-panel__row" to="/quote#quote-form"
          onClick={() => trackCtaClick("quote", "contact_panel", { destination: "quote" })}>
          <span>{text.quote}</span><ArrowUpRight aria-hidden="true" />
        </LocalizedLink>
      </DialogContent>
    </Dialog>
  </>;
}
