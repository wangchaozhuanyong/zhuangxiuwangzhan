import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Link from "@/components/LocalizedLink";
import { ChevronDown, Clock, ExternalLink, Facebook, Instagram, Linkedin, Mail, MapPin, Music2, Phone, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { footerCopy, footerLocationLinks, footerServiceOverrides, footerUiText } from "@/i18n/footerText";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublishedCtaBlock } from "@/hooks/usePublishedContent";
import SmartImage from "@/components/SmartImage";
import FooterPreludeCta from "@/components/blocks/FooterPreludeCta";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import { stripLanguagePrefix } from "@/i18n/routes";
import { trackCtaClick } from "@/lib/analytics";
import logoFallback from "@/assets/logo-flashcast.webp";

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="footer-column-title">
    <span aria-hidden />
    <h4>{children}</h4>
  </div>
);

const normalizeFooterServiceLinks = (links: readonly { name: string; slug: string }[], language: "en" | "zh") =>
  links.map((item) => {
    if (item.slug === "commercial") {
      return { ...item, ...footerServiceOverrides.commercial[language] };
    }

    if (item.slug === "exterior") {
      return { ...item, ...footerServiceOverrides.exterior[language] };
    }

    return item;
  });

const FooterLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <li>
    <Link to={to} className="footer-link">
      {children}
    </Link>
  </li>
);

type FooterContactItem = {
  icon: LucideIcon;
  text: string;
  href?: string;
  external?: boolean;
  track?: string;
};

const normalizeSocialHref = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const SocialLinkList = ({
  links,
  ariaLabel,
}: {
  links: Array<{ name: string; href: string; icon: LucideIcon }>;
  ariaLabel: string;
}) => {
  if (!links.length) return null;

  return (
    <nav className="footer-social-list" aria-label={ariaLabel}>
      {links.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className="footer-social-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.name}
          title={item.name}
        >
          <item.icon className="h-4 w-4" aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
};

const MobileAccordion = ({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className={`footer-mobile-panel ${isOpen ? "is-open" : ""}`}>
    <button type="button" onClick={onToggle} aria-expanded={isOpen}>
      <span>{title}</span>
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <div className={`footer-mobile-panel-body ${isOpen ? "max-h-96 pb-5" : "max-h-0"}`} aria-hidden={!isOpen}>
      {children}
    </div>
  </div>
);

const Footer = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const settings = useSiteSettings();
  const t = footerCopy[language];
  const uiText = footerUiText[language];
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const areas = footerLocationLinks[language];
  const serviceLinks = normalizeFooterServiceLinks(t.serviceLinks, language);
  const logoSrc = !logoFailed && settings.logo_url ? addCacheBuster(settings.logo_url, settings.updated_at) : logoFallback;
  const normalizedPath = stripLanguagePrefix(location.pathname);
  const hasDedicatedSubpageCta =
    normalizedPath === "/services" ||
    normalizedPath.startsWith("/services/") ||
    normalizedPath === "/projects" ||
    normalizedPath === "/materials" ||
    normalizedPath.startsWith("/materials/category/") ||
    normalizedPath === "/faq" ||
    normalizedPath.startsWith("/landing/");
  const showFooterCta = normalizedPath !== "/" && !hasDedicatedSubpageCta;
  const { data: globalCtaBlock } = usePublishedCtaBlock(language, "home_final", { enabled: showFooterCta });
  const footerCtaTitle = globalCtaBlock?.title || t.ctaTitle;
  const footerCtaDescription = globalCtaBlock?.description || t.ctaText;
  const footerCtaButton = globalCtaBlock?.primary_label || t.ctaButton;
  const footerCtaPath = globalCtaBlock?.primary_url || "/quote";
  const mapHref =
    settings.map_latitude && settings.map_longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.map_latitude},${settings.map_longitude}`)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;

  useEffect(() => {
    setLogoFailed(false);
  }, [settings.logo_url, settings.updated_at]);

  const contactItems: FooterContactItem[] = [
    { icon: MapPin, text: settings.address, href: mapHref, external: true, track: "map" },
    { icon: Phone, text: settings.phone_display, href: settings.phone_href, track: "phone" },
    { icon: Mail, text: settings.email, href: `mailto:${settings.email}`, track: "email" },
    { icon: Clock, text: t.hours },
  ];
  const socialLinks = [
    { name: "Facebook", url: settings.facebook_url, icon: Facebook },
    { name: "Instagram", url: settings.instagram_url, icon: Instagram },
    { name: "TikTok", url: settings.tiktok_url, icon: Music2 },
    { name: "Xiaohongshu", url: settings.xiaohongshu_url, icon: ExternalLink },
    { name: "LinkedIn", url: settings.linkedin_url, icon: Linkedin },
  ]
    .map((item) => ({ name: item.name, href: normalizeSocialHref(item.url || ""), icon: item.icon }))
    .filter((item) => item.href);

  return (
    <footer className="site-footer-art">
      {showFooterCta && (
        <FooterPreludeCta
          className="site-footer-prelude"
          eyebrow={language === "zh" ? uiText.preludeEyebrow : settings.company_name}
          title={footerCtaTitle}
          description={footerCtaDescription}
          quoteLabel={footerCtaButton}
          whatsappLabel={uiText.whatsappLabel}
          quotePath={footerCtaPath}
          whatsappSource="Footer CTA"
        />
      )}

      <div className="footer-surface">
        <div className="footer-content site-container py-10 md:py-16 lg:py-20">
          <div className="footer-workbench hidden lg:grid">
            <div className="footer-brand-panel">
              <div className="footer-logo-row">
                <span className="footer-logo-rule" aria-hidden />
                <div className="footer-logo-card">
                  <SmartImage
                    src={logoSrc}
                    alt=""
                    className="h-full w-full object-contain object-left brightness-0 invert opacity-90"
                    width={190}
                    height={48}
                    onError={() => setLogoFailed(true)}
                  />
                  <span className="sr-only">{settings.company_name}</span>
                </div>
              </div>
              <p className="footer-brand-copy">{t.brandText}</p>
              <p className="footer-trust-line">{t.trustLine}</p>

              <div className="footer-contact-list">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <span>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span>{item.text}</span>
                    </>
                  );

                  return item.href ? (
                    <a
                      key={item.text}
                      href={item.href}
                      className="footer-contact-item"
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      onClick={() => trackCtaClick(item.track || "contact", "footer_contact", { destination: item.track })}
                    >
                      {content}
                    </a>
                  ) : (
                    <span key={item.text} className="footer-contact-item">
                      {content}
                    </span>
                  );
                })}
              </div>

              <SocialLinkList links={socialLinks} ariaLabel={uiText.socialAria} />
            </div>

            <nav className="footer-link-board" aria-label={uiText.navigationAria}>
              <div className="footer-link-column">
                <SectionTitle>{t.servicesTitle}</SectionTitle>
                <ul>
                  {serviceLinks.map((item) => (
                    <FooterLink key={item.slug} to={`/services/${item.slug}`}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </div>

              <div className="footer-link-column">
                <SectionTitle>{t.companyTitle}</SectionTitle>
                <ul>
                  {t.companyLinks.map((item) => (
                    <FooterLink key={item.path} to={item.path}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </div>

              <div className="footer-link-column">
                <SectionTitle>{t.areasTitle}</SectionTitle>
                <div className="footer-area-chips">
                  {areas.map((area) => (
                    <Link key={area.slug} to={`/locations/${area.slug}`}>
                      {area.name}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>

          <div className="footer-mobile-stack lg:hidden">
            <section className="footer-brand-panel footer-brand-panel-mobile">
              <div className="footer-logo-row">
                <span className="footer-logo-rule" aria-hidden />
                <div className="footer-logo-card">
                  <SmartImage
                    src={logoSrc}
                    alt=""
                    className="h-full w-full object-contain object-left brightness-0 invert opacity-90"
                    width={170}
                    height={44}
                    onError={() => setLogoFailed(true)}
                  />
                  <span className="sr-only">{settings.company_name}</span>
                </div>
              </div>
              <p className="footer-brand-copy">{t.brandText}</p>
              <p className="footer-trust-line">{t.trustLine}</p>
              <div className="footer-contact-list">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <span>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span>{item.text}</span>
                    </>
                  );

                  return item.href ? (
                    <a
                      key={item.text}
                      href={item.href}
                      className="footer-contact-item"
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      onClick={() => trackCtaClick(item.track || "contact", "footer_contact", { destination: item.track })}
                    >
                      {content}
                    </a>
                  ) : (
                    <span key={item.text} className="footer-contact-item">
                      {content}
                    </span>
                  );
                })}
              </div>
              <SocialLinkList links={socialLinks} ariaLabel={uiText.socialAria} />
            </section>

            <div className="footer-mobile-nav">
              <MobileAccordion
                title={t.servicesTitle}
                isOpen={openSection === "services"}
                onToggle={() => setOpenSection(openSection === "services" ? null : "services")}
              >
                <ul className="footer-mobile-link-list">
                  {serviceLinks.map((item) => (
                    <FooterLink key={item.slug} to={`/services/${item.slug}`}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </MobileAccordion>

              <MobileAccordion
                title={t.companyTitle}
                isOpen={openSection === "company"}
                onToggle={() => setOpenSection(openSection === "company" ? null : "company")}
              >
                <ul className="footer-mobile-link-list">
                  {t.companyLinks.map((item) => (
                    <FooterLink key={item.path} to={item.path}>
                      {item.name}
                    </FooterLink>
                  ))}
                </ul>
              </MobileAccordion>

              <MobileAccordion
                title={t.areasTitle}
                isOpen={openSection === "areas"}
                onToggle={() => setOpenSection(openSection === "areas" ? null : "areas")}
              >
                <div className="footer-area-chips">
                  {areas.map((area) => (
                    <Link key={area.slug} to={`/locations/${area.slug}`}>
                      {area.name}
                    </Link>
                  ))}
                </div>
              </MobileAccordion>
            </div>
          </div>

          <div className="footer-legal">
            <p>© {new Date().getFullYear()} {settings.company_name} {t.rights}</p>
            <div>
              <Link to="/privacy">
                {t.privacy}
              </Link>
              <Link to="/terms">
                {t.terms}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
