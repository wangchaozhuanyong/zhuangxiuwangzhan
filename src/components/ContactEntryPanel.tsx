import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { whatsappOpeningText } from "@/i18n/whatsappOpeningText";
import { currentInquirySources } from "@/lib/inquirySource";
import { contactEntryText } from "@/i18n/contactEntryText";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LocalizedLink from "@/components/LocalizedLink";
import { trackCtaClick } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { mountContactActions, type ContactAction } from "./contactPanelActions";

export type ContactEntryPanelProps = {
  message: string;
  service?: string;
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
  initialContact?: "wechat";
};

function recordAction(action: ContactAction) {
  trackCtaClick(action, "contact_panel", { destination: action.startsWith("wechat_") ? "wechat" : action });
}

function ContactActions({ message, service, initialContact }: Pick<ContactEntryPanelProps, "message" | "service" | "initialContact">) {
  const body = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const whatsapp = service
    ? settings.whatsapp_url(whatsappOpeningText(language, currentInquirySources().last) + "\n\n" + service, { mode: "product-enquiry" })
    : settings.whatsapp_url(message);
  const { phone_href, phone_display } = settings;
  useLayoutEffect(() => mountContactActions(body.current!, {
    language, whatsapp, telephone: phone_href, phoneDisplay: phone_display, contact: siteConfig,
    showWechat: initialContact === "wechat", onAction: recordAction,
  }), [language, whatsapp, phone_href, phone_display, initialContact]);
  return <div className="fc-contact-panel__body" ref={body} />;
}

export default function ContactEntryPanel({ message, service, onClose, onCloseAutoFocus, initialContact }: ContactEntryPanelProps) {
  const { language } = useLanguage();
  const text = contactEntryText[language];
  const panel = useRef<HTMLDivElement>(null);
  return <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
    <DialogContent ref={panel} className="fc-contact-panel" overlayClassName="fc-contact-overlay" closeLabel={text.close}
      onCloseAutoFocus={onCloseAutoFocus} onOpenAutoFocus={event => {
        const target = panel.current?.querySelector<HTMLElement>(initialContact === "wechat" ? "[data-copy-wechat]" : "[data-qc=wa]");
        if (target) { event.preventDefault(); target.focus({ preventScroll: true }); }
      }}>
      <div className="fc-contact-panel__header">
        <DialogTitle className="fc-contact-panel__title">{text.title}</DialogTitle>
        <DialogDescription className="fc-contact-panel__description">{text.description}</DialogDescription>
      </div>
      <ContactActions message={message} service={service} initialContact={initialContact} />
      <div className="fc-contact-panel__footer">
        <LocalizedLink className="fc-contact-panel__quote" to="/quote#quote-form"
          onClick={() => trackCtaClick("quote", "contact_panel", { destination: "quote" })}>
          <FileText aria-hidden="true" /><span className="fc-contact-panel__label">{text.quote}</span><ArrowUpRight aria-hidden="true" />
        </LocalizedLink>
      </div>
    </DialogContent>
  </Dialog>;
}
