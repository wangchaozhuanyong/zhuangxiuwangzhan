import { ClipboardList, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublicChrome } from "@/contexts/PublicChromeContext";

const copy = {
  en: { whatsapp: "WhatsApp", call: "Call", quote: "Free Quote" },
  zh: { whatsapp: "WhatsApp", call: "电话", quote: "免费报价" },
};

/** 移动端底部固定行动栏：全站公共页（含首页）统一展示，菜单打开时由 PublicChrome 隐藏 */
const MobileActionBar = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const { showMobileActionBar } = usePublicChrome();
  const t = copy[language];

  if (!showMobileActionBar) {
    return null;
  }

  return (
    <nav
      aria-label={language === "zh" ? "快捷联系" : "Quick contact"}
      className="fixed inset-x-0 bottom-0 grid h-16 grid-cols-3 border-t border-border/80 bg-background/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_-12px_rgba(21,18,14,0.2)] backdrop-blur-md md:hidden"
      style={{ zIndex: PUBLIC_CHROME_Z.mobileActionBar }}
    >
      <a
        href={settings.whatsapp_url()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-16 min-w-0 flex-col items-center justify-center border-r border-border/60 text-[11px] font-semibold text-foreground"
      >
        <WhatsAppIcon className="mb-1 h-5 w-5 text-whatsapp" />
        {t.whatsapp}
      </a>
      <a
        href={settings.phone_href}
        className="flex min-h-16 min-w-0 flex-col items-center justify-center border-r border-border/60 text-[11px] font-semibold text-foreground"
      >
        <Phone className="mb-1 h-5 w-5 text-gold" />
        {t.call}
      </a>
      <LocalizedLink
        to="/quote"
        className="flex min-h-16 min-w-0 flex-col items-center justify-center bg-[#15120E] text-[11px] font-bold text-[#C6A46A]"
      >
        <ClipboardList className="mb-1 h-5 w-5" />
        {t.quote}
      </LocalizedLink>
    </nav>
  );
};

export default MobileActionBar;
