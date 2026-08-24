import type { MouseEvent } from "react";
import { ClipboardList, Phone } from "lucide-react";
import { useLocation } from "react-router-dom";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { mobileActionBarText } from "@/i18n/mobileActionBarText";
import { stripLanguagePrefix } from "@/i18n/routes";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { trackCtaClick } from "@/lib/analytics";
import { QUOTE_FORM_PATH } from "@/lib/quoteContext";

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
  const t = mobileActionBarText[language];
  const publicPath = stripLanguagePrefix(location.pathname);
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

  return (
    <nav
      aria-label={t.aria}
      className="scheme-a-contact-dock"
    >
      <div className="scheme-a-contact-dock__inner">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="scheme-a-contact-dock__item scheme-a-contact-dock__item--whatsapp"
          onClick={() => trackCtaClick("whatsapp", "mobile_action_bar", { destination: "whatsapp" })}
        >
          <span className="scheme-a-contact-dock__icon" aria-hidden="true">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <span className="scheme-a-contact-dock__label">{t.whatsapp}</span>
        </a>
        <a
          href={settings.phone_href}
          className="scheme-a-contact-dock__item scheme-a-contact-dock__item--call"
          onClick={() => trackCtaClick("phone", "mobile_action_bar", { destination: "phone" })}
        >
          <span className="scheme-a-contact-dock__icon" aria-hidden="true">
            <Phone className="h-5 w-5" />
          </span>
          <span className="scheme-a-contact-dock__label">{t.call}</span>
        </a>
        {formAction ? (
          <a
            href={formAction.href}
            className="scheme-a-contact-dock__item scheme-a-contact-dock__item--primary"
            onClick={(event) => {
              trackCtaClick(formAction.ctaName, "mobile_action_bar", { destination: formAction.href });
              scrollToFormField(event, formAction.href);
            }}
          >
            <span className="scheme-a-contact-dock__icon" aria-hidden="true">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="scheme-a-contact-dock__label">{formAction.label}</span>
          </a>
        ) : (
          <LocalizedLink
            to={QUOTE_FORM_PATH}
            className="scheme-a-contact-dock__item scheme-a-contact-dock__item--primary"
            onClick={() => trackCtaClick("quote", "mobile_action_bar", { destination: QUOTE_FORM_PATH })}
          >
            <span className="scheme-a-contact-dock__icon" aria-hidden="true">
              <ClipboardList className="h-5 w-5" />
            </span>
            <span className="scheme-a-contact-dock__label">{t.quote}</span>
          </LocalizedLink>
        )}
      </div>
    </nav>
  );
};

export default MobileActionBar;
