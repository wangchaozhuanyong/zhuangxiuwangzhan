import { ArrowUpRight, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { contactEntryText } from "@/i18n/contactEntryText";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { trackCtaClick } from "@/lib/analytics";

export type ContactEntryPanelProps = {
  message: string;
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
};

/** Loaded after the visitor requests contact options. */
export default function ContactEntryPanel({ message, onClose, onCloseAutoFocus }: ContactEntryPanelProps) {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const text = contactEntryText[language];
  return <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
    <DialogContent className="fc-contact-panel" overlayClassName="fc-contact-overlay" closeLabel={text.close}
      onCloseAutoFocus={onCloseAutoFocus}>
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
  </Dialog>;
}
