import { useLanguage } from "@/i18n/LanguageContext";
import { contactEntryText } from "@/i18n/contactEntryText";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackCtaClick } from "@/lib/analytics";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default function PhotoEnquiryLink({ source, className, compactOnMobile = false }: { service?: string; source: string; className?: string; compactOnMobile?: boolean }) {
  const { language } = useLanguage();
  const text = contactEntryText[language];
  const settings = useSiteSettings();
  return <a className={className} href={settings.whatsapp_url()}
    target="_blank" rel="noopener noreferrer" aria-label={compactOnMobile ? text.photoCta : undefined}
    onClick={() => trackCtaClick("whatsapp", source, { destination: "whatsapp" })}>
    <WhatsAppIcon aria-hidden="true" />
    <span className={compactOnMobile ? "photo-enquiry-label--full" : undefined}>{text.photoCta}</span>
    {compactOnMobile && <span className="photo-enquiry-label--compact" aria-hidden="true">{text.photoCtaCompact}</span>}
  </a>;
}
