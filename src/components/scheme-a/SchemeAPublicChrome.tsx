import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  BadgePercent,
  ChevronDown,
  Clock,
  Facebook,
  FolderOpen,
  Home,
  Instagram,
  Mail,
  MapPin,
  Menu,
  PackageSearch,
  Phone,
  X,
} from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  primaryPublicNavigationItems,
  publicNavigationGroups,
  type PublicNavGroupKey,
  type PublicNavItem,
} from "@/config/publicNavigation";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { footerCopy, footerLocationLinks } from "@/i18n/footerText";
import { navbarText } from "@/i18n/navbarText";
import { schemeAChromeText } from "@/i18n/schemeAText";
import { stripLanguagePrefix, switchLanguagePath } from "@/i18n/routes";
import { useT } from "@/i18n/useT";
import { trackCtaClick } from "@/lib/analytics";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import logoFallback from "@/assets/logo-flashcast.webp";

const isActivePath = (pathname: string, itemPath: string) => {
  const currentPath = stripLanguagePrefix(pathname);
  if (itemPath === "/") return currentPath === "/";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
};

const publicNavigationItems = publicNavigationGroups.flatMap((group) => group.items);

const getCurrentNavigationItem = (pathname: string) =>
  publicNavigationItems.find((item) => isActivePath(pathname, item.path)) ?? publicNavigationItems[0];

const BrandMark = ({ logo, name }: { logo: string; name: string }) => (
  <LocalizedLink className="scheme-a-chrome__brand" to="/" aria-label={name}>
    <SmartImage src={logo} alt="" width={190} height={52} loading="eager" />
    <span className="sr-only">{name}</span>
  </LocalizedLink>
);

const getGroupLabel = (key: PublicNavGroupKey, navText: typeof navbarText.zh | typeof navbarText.en) => ({
  spaces: navText.spacesGroup,
  services: navText.servicesGroup,
  studio: navText.studioGroup,
  contact: navText.contactGroup,
})[key];

const LanguageSwitch = ({
  language,
  to,
  label,
  className = "",
}: {
  language: "zh" | "en";
  to: string;
  label: string;
  className?: string;
}) => (
  <RouterLink className={`scheme-a-language-switch ${className}`.trim()} to={to} aria-label={label}>
    <span data-active={language === "zh" ? "true" : "false"}>中文</span>
    <i aria-hidden="true" />
    <span data-active={language === "en" ? "true" : "false"}>EN</span>
  </RouterLink>
);

export const SchemeANavbar = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const translate = useT();
  const t = schemeAChromeText[language];
  const navText = navbarText[language];
  const footer = footerCopy[language];
  const settings = useSiteSettings();
  const { hasImmersiveHero, menuOpen, setMenuOpen } = usePublicChrome();
  const currentItem = getCurrentNavigationItem(location.pathname);
  const [openGroup, setOpenGroup] = useState<PublicNavGroupKey | null>(null);
  const [previewItem, setPreviewItem] = useState<PublicNavItem>(currentItem);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const logo = settings.logo_url ? addCacheBuster(settings.logo_url, settings.updated_at) : logoFallback;
  const companyName = settings.company_name || "FLASH CAST SDN. BHD.";
  const nextLanguage = language === "zh" ? "en" : "zh";
  const languagePath = switchLanguagePath(location.pathname, nextLanguage, location.search, location.hash);
  const overlay = hasImmersiveHero && !scrolled && !menuOpen;

  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
    setPreviewItem(currentItem);
  }, [currentItem, location.pathname, setMenuOpen]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasImmersiveHero) {
      setScrolled(true);
      return;
    }
    if (!sentinel || !("IntersectionObserver" in window)) {
      setScrolled(false);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting);
    }, { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasImmersiveHero, location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || []).filter((item) => item.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <>
      <span ref={sentinelRef} className="scheme-a-chrome__sentinel" aria-hidden="true" />
      <header className={`scheme-a-chrome is-fixed ${overlay ? "is-overlay" : "is-solid"}`}>
        <div className="scheme-a-chrome__bar scheme-a-frame">
          <BrandMark logo={logo} name={companyName} />
          <nav className="scheme-a-chrome__primary" aria-label={t.mainNavigation}>
            {primaryPublicNavigationItems.map((item) => (
              <LocalizedLink key={item.path} to={item.path} aria-current={isActivePath(location.pathname, item.path) ? "page" : undefined}>
                {translate(item.labelKey)}
              </LocalizedLink>
            ))}
          </nav>
          <div className="scheme-a-chrome__actions">
            <LocalizedLink className="scheme-a-chrome__quote" to="/quote" onClick={() => trackCtaClick("quote", "scheme_a_header", { destination: "/quote" })}>
              {t.quote}<ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
            <div className="scheme-a-chrome__control-rail">
              <LanguageSwitch language={language} to={languagePath} label={navText.switchLanguage} className="scheme-a-chrome__language" />
              <button ref={triggerRef} className="scheme-a-chrome__menu" type="button" aria-label={t.openMenu} aria-expanded={menuOpen} aria-controls="scheme-a-directory" onClick={() => { setOpenGroup(null); setPreviewItem(currentItem); setMenuOpen(true); }}>
                <span>{t.menu}</span><Menu aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>
      {!hasImmersiveHero ? <div className="scheme-a-chrome__spacer" aria-hidden="true" /> : null}

      {menuOpen ? (
        <div ref={menuRef} id="scheme-a-directory" className="scheme-a-directory" role="dialog" aria-modal="true" aria-label={t.directory}>
          <div className="scheme-a-directory__head scheme-a-frame">
            <BrandMark logo={logo} name={companyName} />
            <div className="scheme-a-directory__intro"><span>{t.directory}</span><p>{t.directoryIntro}</p></div>
            <div className="scheme-a-directory__control-rail">
              <LanguageSwitch language={language} to={languagePath} label={navText.switchLanguage} className="scheme-a-directory__language" />
              <button ref={closeRef} type="button" aria-label={t.closeMenu} onClick={() => { setMenuOpen(false); window.requestAnimationFrame(() => triggerRef.current?.focus()); }}><X aria-hidden="true" /></button>
            </div>
          </div>
          <div className="scheme-a-directory__body scheme-a-frame">
            <nav className="scheme-a-directory__groups" aria-label={t.directory}>
              {publicNavigationGroups.map((group) => (
                <section key={group.key} data-open={openGroup === group.key ? "true" : "false"}>
                  <button
                    type="button"
                    className="scheme-a-directory__group-toggle"
                    aria-expanded={openGroup === group.key}
                    aria-controls={`scheme-a-directory-group-${group.key}`}
                    onClick={() => setOpenGroup((value) => value === group.key ? null : group.key)}
                  >
                    <span>{getGroupLabel(group.key, navText)}</span>
                    <ChevronDown aria-hidden="true" />
                  </button>
                  <ul id={`scheme-a-directory-group-${group.key}`}>
                    {group.items.map((item) => (
                      <li key={item.path}>
                        <LocalizedLink to={item.path} aria-current={isActivePath(location.pathname, item.path) ? "page" : undefined} onFocus={() => setPreviewItem(item)} onPointerEnter={() => setPreviewItem(item)}>
                          <span>{translate(item.labelKey)}</span><ArrowUpRight aria-hidden="true" />
                        </LocalizedLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </nav>
            <figure className="scheme-a-directory__preview">
              <SmartImage src={previewItem.previewImage} alt={navText.previewAlt} width={1100} height={800} quality={84} />
              <figcaption><span>{language === "zh" ? "当前章节" : "Current chapter"}</span><strong>{translate(previewItem.labelKey)}</strong></figcaption>
            </figure>
            <div className="scheme-a-directory__contact">
              <a
                className="scheme-a-directory__call"
                href={settings.phone_href}
                aria-label={`${t.call}: ${settings.phone_display}`}
                onClick={() => trackCtaClick("phone", "scheme_a_menu_contact", { destination: "phone" })}
              >
                <span className="scheme-a-directory__contact-icon"><Phone aria-hidden="true" /></span>
                <span className="scheme-a-directory__contact-copy"><small>{t.call}</small><strong>{settings.phone_display}</strong></span>
                <span className="scheme-a-directory__contact-action"><span>{t.callNow}</span><ArrowUpRight aria-hidden="true" /></span>
              </a>
              <span className="scheme-a-directory__hours">
                <span className="scheme-a-directory__contact-icon"><Clock aria-hidden="true" /></span>
                <span className="scheme-a-directory__contact-copy"><small>{t.businessHours}</small><strong>{footer.hours}</strong></span>
              </span>
            </div>
          </div>
          <div className="scheme-a-directory__foot scheme-a-frame">
            <a href={settings.phone_href} onClick={() => trackCtaClick("phone", "scheme_a_menu", { destination: "phone" })}><Phone aria-hidden="true" />{t.call}</a>
            <a className="is-whatsapp" href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "scheme_a_menu", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
            <LocalizedLink className="is-quote" to="/quote">{t.quote}<ArrowUpRight aria-hidden="true" /></LocalizedLink>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const SchemeAFooterPrelude = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = schemeAChromeText[language];

  return (
    <section className="scheme-a-footer-prelude" data-cinematic-section>
      <div className="scheme-a-footer__panorama">
        <SmartImage src="/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp" alt={t.footerTitle} width={1920} height={1100} sizes="100vw" candidateWidths={[360, 560, 720, 900, 1200, 1600]} quality={86} />
        <div className="scheme-a-footer__invitation scheme-a-frame">
          <p>{t.footerKicker}</p><h2>{t.footerTitle}</h2><span>{t.footerBody}</span>
          <div>
            <LocalizedLink to="/quote" onClick={() => trackCtaClick("quote", "scheme_a_footer_prelude", { destination: "/quote" })}>{t.quote}<ArrowUpRight /></LocalizedLink>
            <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "scheme_a_footer_prelude", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export const SchemeAFooter = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const translate = useT();
  const settings = useSiteSettings();
  const t = schemeAChromeText[language];
  const footer = footerCopy[language];
  const navText = navbarText[language];
  const areas = footerLocationLinks[language];
  const nextLanguage = language === "zh" ? "en" : "zh";
  const languagePath = switchLanguagePath(location.pathname, nextLanguage, location.search, location.hash);
  const currentGroup = publicNavigationGroups.find((group) => group.items.some((item) => isActivePath(location.pathname, item.path)))?.key;

  return (
    <footer className="scheme-a-footer">
      <div className="scheme-a-footer__surface">
        <div className="scheme-a-footer__wordmark scheme-a-frame" aria-hidden="true"><span>FLASH</span><em>CAST</em></div>
        <div className="scheme-a-footer__grid scheme-a-frame">
          <section className="scheme-a-footer__studio">
            <p>{t.contactTitle}</p>
            <strong>{settings.company_name}</strong>
            <address><MapPin />{settings.address}</address>
            <a href={settings.phone_href}><Phone />{settings.phone_display}</a>
            <a href={`mailto:${settings.email}`}><Mail />{settings.email}</a>
            <span><Clock />{footer.hours}</span>
            <div className="scheme-a-footer__socials">
              {settings.instagram_url ? <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a> : null}
              {settings.facebook_url ? <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook /></a> : null}
            </div>
          </section>
          <nav className="scheme-a-footer__directory" aria-label={t.navigationTitle}>
            {publicNavigationGroups.map((group) => (
              <section key={group.key}>
                <p>{getGroupLabel(group.key, navText)}</p>
                {group.items.map((item) => <LocalizedLink key={item.path} to={item.path}>{translate(item.labelKey)}<ArrowUpRight /></LocalizedLink>)}
              </section>
            ))}
          </nav>
          <nav className="scheme-a-footer__mobile-directory" aria-label={t.navigationTitle}>
            {publicNavigationGroups.map((group) => (
              <details key={group.key} open={group.key === currentGroup}>
                <summary><span>{getGroupLabel(group.key, navText)}</span><ChevronDown aria-hidden="true" /></summary>
                <div>{group.items.map((item) => <LocalizedLink key={item.path} to={item.path}>{translate(item.labelKey)}<ArrowUpRight /></LocalizedLink>)}</div>
              </details>
            ))}
          </nav>
          <section className="scheme-a-footer__areas">
            <p>{t.areasTitle}</p>
            {areas.map((area) => <LocalizedLink key={area.slug} to={`/locations/${area.slug}`}>{area.name}</LocalizedLink>)}
          </section>
        </div>
        <div className="scheme-a-footer__legal scheme-a-frame">
          <span>{t.copyright} {footer.rights}</span>
          <nav><LocalizedLink to="/privacy">{footer.privacy}</LocalizedLink><LocalizedLink to="/terms">{footer.terms}</LocalizedLink><RouterLink to={languagePath}>{t.language}: {nextLanguage === "zh" ? "中文" : "EN"}</RouterLink><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{t.backToTop}<ArrowUp /></button></nav>
        </div>
      </div>
    </footer>
  );
};

export const SchemeAMobileDock = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const t = schemeAChromeText[language];
  const items = [
    { path: "/", label: t.dockHome, icon: Home },
    { path: "/projects", label: t.dockProjects, icon: FolderOpen },
    { path: "/products", label: t.dockProducts, icon: PackageSearch },
    { path: "/promotions", label: t.dockPromotions, icon: BadgePercent },
    { path: "/contact", label: t.dockContact, icon: Mail },
  ];
  return <nav className="scheme-a-mobile-dock" aria-label={t.mainNavigation}>{items.map((item) => <LocalizedLink key={item.path} to={item.path} aria-current={isActivePath(location.pathname, item.path) ? "page" : undefined}><item.icon aria-hidden="true" /><span>{item.label}</span></LocalizedLink>)}</nav>;
};
