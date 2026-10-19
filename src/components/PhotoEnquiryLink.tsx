import { useLanguage } from "@/i18n/LanguageContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackCtaClick } from "@/lib/analytics";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default function PhotoEnquiryLink({ service, source, className }: { service?: string; source: string; className?: string }) {
  const { language } = useLanguage();
  const text = contactEntryText[language];
  const settings = useSiteSettings();
  return <a className={className} href={settings.whatsapp_url(text.message(service || text.genericService))}
    target="_blank" rel="noopener noreferrer"
    onClick={() => trackCtaClick("whatsapp", source, { destination: "whatsapp" })}>
    <WhatsAppIcon aria-hidden="true" /><span>{text.photoCta}</span>
  </a>;
}
