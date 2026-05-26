import { Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { siteConfig, whatsappUrl } from "@/config/site";

const copy = {
  en: {
    whatsapp: "WhatsApp",
    call: "Call",
    quote: "Free Quote",
    whatsappAria: "Chat on WhatsApp",
    whatsappDesktop: "WhatsApp Us",
  },
  zh: {
    whatsapp: "WhatsApp",
    call: "电话",
    quote: "免费报价",
    whatsappAria: "通过 WhatsApp 咨询",
    whatsappDesktop: "WhatsApp 咨询",
  },
};

const FloatingCTA = () => {
  const { language } = useLanguage();
  const t = copy[language];

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="flex min-h-14 flex-col items-center justify-center text-[11px] font-semibold text-foreground">
          <WhatsAppIcon className="mb-1 h-5 w-5 text-[#25D366]" />
          {t.whatsapp}
        </a>
        <a href={siteConfig.phoneHref} className="flex min-h-14 flex-col items-center justify-center border-x border-border text-[11px] font-semibold text-foreground">
          <Phone className="mb-1 h-5 w-5 text-accent" />
          {t.call}
        </a>
        <LocalizedLink to="/quote" className="flex min-h-14 flex-col items-center justify-center bg-accent text-[11px] font-bold text-accent-foreground">
          <span className="mb-1 text-base leading-none">RM</span>
          {t.quote}
        </LocalizedLink>
      </div>

      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 z-50 hidden items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 lg:flex"
        aria-label={t.whatsappAria}
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span className="ml-2 text-sm font-semibold">{t.whatsappDesktop}</span>
      </a>
    </>
  );
};

export default FloatingCTA;
