import type { CSSProperties } from "react";
import { ClipboardList, Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { getReadableTextColor } from "@/lib/colorContrast";

const copy = {
  en: { whatsapp: "WhatsApp", call: "Call", quote: "Free Quote" },
  zh: { whatsapp: "WhatsApp", call: "电话", quote: "免费报价" },
};

const mobileActionBackground = "hsl(38 33% 97% / 0.98)";
const mobileActionForeground = getReadableTextColor("hsl(38 33% 97%)");

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
      className="adaptive-surface mobile-action-bar fixed inset-x-0 bottom-0 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2 md:hidden"
      style={
        {
          "--adaptive-bg": mobileActionBackground,
          "--adaptive-fg": mobileActionForeground,
          zIndex: PUBLIC_CHROME_Z.mobileActionBar,
        } as CSSProperties
      }
    >
      <div className="mobile-action-bar__shell">
        <a
          href={settings.whatsapp_url()}
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-action-bar__item mobile-action-bar__item--whatsapp"
        >
          <span className="mobile-action-bar__icon" aria-hidden="true">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <span className="mobile-action-bar__label">{t.whatsapp}</span>
        </a>
        <a href={settings.phone_href} className="mobile-action-bar__item mobile-action-bar__item--call">
          <span className="mobile-action-bar__icon" aria-hidden="true">
            <Phone className="h-5 w-5" />
          </span>
          <span className="mobile-action-bar__label">{t.call}</span>
        </a>
        <LocalizedLink to="/quote" className="mobile-action-bar__item mobile-action-bar__item--quote">
          <span className="mobile-action-bar__icon" aria-hidden="true">
            <ClipboardList className="h-5 w-5" />
          </span>
          <span className="mobile-action-bar__label">{t.quote}</span>
        </LocalizedLink>
      </div>
    </nav>
  );
};

export default MobileActionBar;
