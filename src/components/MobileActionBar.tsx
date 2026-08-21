import type { CSSProperties, MouseEvent } from "react";
import { ClipboardList, Phone } from "lucide-react";
import { useLocation } from "react-router-dom";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { mobileActionBarText } from "@/i18n/mobileActionBarText";
import { stripLanguagePrefix } from "@/i18n/routes";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { getReadableTextColor } from "@/lib/colorContrast";
import { trackCtaClick } from "@/lib/analytics";

const mobileActionBackground = "hsl(38 33% 97% / 0.98)";
const mobileActionForeground = getReadableTextColor("hsl(38 33% 97%)");

const formatMessage = (template: string, source: string) => template.replace("{source}", source);

const scrollToFormField = (event: MouseEvent<HTMLAnchorElement>, targetSelector: string) => {
  const target = document.querySelector<HTMLElement>(targetSelector);
  if (!target) return;

  event.preventDefault();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  window.setTimeout(() => target.focus({ preventScroll: true }), reduceMotion ? 0 : 360);
};

const MobileActionBar = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const settings = useSiteSettings();
  const { showMobileActionBar } = usePublicChrome();
  const t = mobileActionBarText[language];
  const publicPath = stripLanguagePrefix(location.pathname);
  const isHomePage = publicPath === "/";
  const isQuotePage = publicPath === "/quote";
  const isContactPage = publicPath === "/contact";
  const source = isQuotePage
    ? t.quoteSource
    : isContactPage
      ? t.contactSource
      : publicPath === "/services/renovation"
        ? t.renovationSource
        : t.websiteSource;
  const whatsappHref = settings.whatsapp_url(formatMessage(t.whatsappMessage, source));
  const formAction = isQuotePage
    ? { href: "#quote-name", label: t.fillQuote, ctaName: "quote_form_jump" }
    : isContactPage
      ? { href: "#contact-name", label: t.fillContact, ctaName: "contact_form_jump" }
      : null;

  if (!showMobileActionBar || (!isHomePage && !isQuotePage && !isContactPage)) {
    return null;
  }

  return (
    <nav
      aria-label={t.aria}
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
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-action-bar__item mobile-action-bar__item--whatsapp"
          onClick={() => trackCtaClick("whatsapp", "mobile_action_bar", { destination: "whatsapp" })}
        >
          <span className="mobile-action-bar__icon" aria-hidden="true">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <span className="mobile-action-bar__label">{t.whatsapp}</span>
        </a>
        <a
          href={settings.phone_href}
          className="mobile-action-bar__item mobile-action-bar__item--call"
          onClick={() => trackCtaClick("phone", "mobile_action_bar", { destination: "phone" })}
        >
          <span className="mobile-action-bar__icon" aria-hidden="true">
            <Phone className="h-5 w-5" />
          </span>
          <span className="mobile-action-bar__label">{t.call}</span>
        </a>
        {isHomePage ? (
          <LocalizedLink
            to="/contact"
            className="mobile-action-bar__item mobile-action-bar__item--quote"
            onClick={() => trackCtaClick("contact", "mobile_action_bar", { destination: "/contact" })}
          >
            <span className="mobile-action-bar__icon" aria-hidden="true">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="mobile-action-bar__label">{t.fillContact}</span>
          </LocalizedLink>
        ) : formAction ? (
          <a
            href={formAction.href}
            className="mobile-action-bar__item mobile-action-bar__item--quote"
            onClick={(event) => {
              trackCtaClick(formAction.ctaName, "mobile_action_bar", { destination: formAction.href });
              scrollToFormField(event, formAction.href);
            }}
          >
            <span className="mobile-action-bar__icon" aria-hidden="true">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="mobile-action-bar__label">{formAction.label}</span>
          </a>
        ) : (
          <LocalizedLink
            to="/quote"
            className="mobile-action-bar__item mobile-action-bar__item--quote"
            onClick={() => trackCtaClick("quote", "mobile_action_bar", { destination: "/quote" })}
          >
            <span className="mobile-action-bar__icon" aria-hidden="true">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="mobile-action-bar__label">{t.quote}</span>
          </LocalizedLink>
        )}
      </div>
    </nav>
  );
};

export default MobileActionBar;
