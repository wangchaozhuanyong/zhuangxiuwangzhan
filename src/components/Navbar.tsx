import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  BookOpen,
  Building2,
  ChevronDown,
  Columns2,
  FileText,
  FolderOpen,
  GitBranch,
  Globe,
  HelpCircle,
  Home,
  Info,
  Layers,
  Mail,
  MapPinned,
  Megaphone,
  Menu,
  PackageSearch,
  Phone,
  Quote,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import SmartImage from "@/components/SmartImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import {
  primaryPublicNavigationItems,
  publicNavigationGroups,
  publicNavigationItems,
  type PublicNavGroupKey,
  type PublicNavIconKey,
} from "@/config/publicNavigation";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { navbarText } from "@/i18n/navbarText";
import {
  getLanguageFromPath,
  stripLanguagePrefix,
  switchLanguagePath,
  withLanguagePrefix,
  type Language,
} from "@/i18n/routes";
import { useT } from "@/i18n/useT";
import { trackCtaClick } from "@/lib/analytics";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import logoFallback from "@/assets/logo-flashcast.webp";

const iconByKey: Record<PublicNavIconKey, LucideIcon> = {
  home: Home,
  projects: FolderOpen,
  beforeAfter: Columns2,
  services: Wrench,
  oldHouse: Building2,
  materials: Layers,
  products: PackageSearch,
  promotions: BadgePercent,
  campaign: Megaphone,
  about: Info,
  process: GitBranch,
  blog: BookOpen,
  faq: HelpCircle,
  locations: MapPinned,
  contact: Mail,
  quote: Quote,
};

const routePreloaders: Partial<Record<string, () => Promise<unknown>>> = {
  "/about": () => import("@/pages/About"),
  "/services": () => import("@/pages/Services"),
  "/services/old-house": () => import("@/pages/OldHouseRenovation"),
  "/materials": () => import("@/pages/Materials"),
  "/products": () => import("@/pages/Products"),
  "/promotions": () => import("@/pages/Promotions"),
  "/landing/office-renovation": () => import("@/pages/LandingPage"),
  "/locations": () => import("@/pages/Locations"),
  "/before-after": () => import("@/pages/BeforeAfter"),
  "/process": () => import("@/pages/Process"),
  "/blog": () => import("@/pages/Blog"),
  "/faq": () => import("@/pages/FAQ"),
  "/contact": () => import("@/pages/Contact"),
  "/quote": () => import("@/pages/Quote"),
};

const MENU_CLOSE_MS = 220;

const preloadPublicRoute = (path: string) => {
  const preload = routePreloaders[path];
  if (preload) void preload().catch(() => undefined);
};

const getMenuCloseDelay = () => {
  if (typeof window === "undefined" || !window.matchMedia) return MENU_CLOSE_MS;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MENU_CLOSE_MS;
};

const isActivePath = (pathname: string, itemPath: string) => {
  const currentPath = stripLanguagePrefix(pathname);
  if (itemPath === "/") return currentPath === "/";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
};

const getOppositeLanguage = (language: Language): Language => (language === "en" ? "zh" : "en");

const languageLabel = {
  en: { short: "EN", long: "EN" },
  zh: { short: "中文", long: "中文" },
} satisfies Record<Language, { short: string; long: string }>;

interface LanguageSwitchLinkProps {
  variant: "desktop" | "mobile";
  className: string;
}

const LanguageSwitchLink = ({ variant, className }: LanguageSwitchLinkProps) => {
  const location = useLocation();
  const { language } = useLanguage();
  const routeLanguage = getLanguageFromPath(location.pathname);
  const currentLanguage = routeLanguage ?? language;
  const text = navbarText[currentLanguage];
  const [optimisticLanguage, setOptimisticLanguage] = useState<Language | null>(null);
  const displayedLanguage = optimisticLanguage ?? currentLanguage;
  const nextLanguage = getOppositeLanguage(currentLanguage);
  const targetPath = switchLanguagePath(location.pathname, nextLanguage, location.search, location.hash);

  useEffect(() => setOptimisticLanguage(null), [location.hash, location.pathname, location.search]);
  const previewNextState = () => setOptimisticLanguage(nextLanguage);

  if (variant === "mobile") {
    return (
      <Link to={targetPath} onPointerDown={previewNextState} onClick={previewNextState} className={className} aria-label={text.switchLanguage}>
        <span className="site-header__mobile-language-label" aria-hidden="true">
          <span className="site-header__mobile-language-text" data-active={displayedLanguage === "zh" ? "true" : "false"}>{languageLabel.zh.short}</span>
          <span className="site-header__mobile-language-text" data-active={displayedLanguage === "en" ? "true" : "false"}>{languageLabel.en.short}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link to={targetPath} onPointerDown={previewNextState} onClick={previewNextState} className={className} aria-label={text.switchLanguage}>
      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="site-header__language-option" data-active={displayedLanguage === "en" ? "true" : "false"}>{languageLabel.en.long}</span>
      <span className="site-header__language-divider" aria-hidden="true">|</span>
      <span className="site-header__language-option site-header__language-option--zh" data-active={displayedLanguage === "zh" ? "true" : "false"}>{languageLabel.zh.long}</span>
    </Link>
  );
};

const Navbar = () => {
  const { hasImmersiveHero, menuOpen: isOpen, setMenuOpen: setIsOpen } = usePublicChrome();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<PublicNavGroupKey>("spaces");
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState("/projects");
  const [logoState, setLogoState] = useState<"primary" | "fallback" | "none">("primary");
  const menuRef = useRef<HTMLDivElement>(null);
  const menuCloseTimerRef = useRef<number | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const navText = navbarText[language];
  const settings = useSiteSettings();
  const primaryLogoSrc = addCacheBuster(settings.logo_url || "", settings.updated_at);
  const brandText = settings.company_name || "FLASH CAST SDN. BHD.";
  const resolvedLogoState: "primary" | "fallback" | "none" = logoState === "primary" && primaryLogoSrc ? "primary" : logoState === "none" ? "none" : "fallback";
  const logoSrc = resolvedLogoState === "primary" ? primaryLogoSrc : logoFallback;
  const previewItem = publicNavigationItems.find((item) => item.path === previewPath) ?? publicNavigationItems[0];
  const usesOverlayHeader = hasImmersiveHero && !scrolled;

  const groupLabel = (key: PublicNavGroupKey) => ({
    spaces: navText.spacesGroup,
    services: navText.servicesGroup,
    studio: navText.studioGroup,
    contact: navText.contactGroup,
  }[key]);

  useEffect(() => setLogoState("primary"), [primaryLogoSrc]);

  const clearCloseTimer = useCallback(() => {
    if (menuCloseTimerRef.current === null) return;
    window.clearTimeout(menuCloseTimerRef.current);
    menuCloseTimerRef.current = null;
  }, []);

  const openMenu = useCallback((trigger: HTMLButtonElement) => {
    clearCloseTimer();
    lastTriggerRef.current = trigger;
    setPendingPath(null);
    setExpandedGroup("spaces");
    setIsMenuClosing(false);
    setIsOpen(true);
  }, [clearCloseTimer, setIsOpen]);

  const closeMenu = useCallback((afterClose?: () => void) => {
    if (!isOpen) {
      afterClose?.();
      return;
    }
    clearCloseTimer();
    menuRef.current?.setAttribute("data-state", "closing");
    setIsMenuClosing(true);
    menuCloseTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsMenuClosing(false);
      setPendingPath(null);
      menuCloseTimerRef.current = null;
      afterClose?.();
      window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
    }, getMenuCloseDelay());
  }, [clearCloseTimer, isOpen, setIsOpen]);

  useEffect(() => () => {
    clearCloseTimer();
    setIsOpen(false);
  }, [clearCloseTimer, setIsOpen]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const nextScrolled = window.scrollY > 20;
      setScrolled((current) => current === nextScrolled ? current : nextScrolled);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    clearCloseTimer();
    setIsMenuClosing(false);
    setPendingPath(null);
    setIsOpen(false);
  }, [clearCloseTimer, location.pathname, setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.dataset.chapterMenuOpen = "true";
    if (window.matchMedia("(min-width: 1180px)").matches) document.documentElement.dataset.desktopMenuOpen = "true";
    menuRef.current?.querySelector<HTMLElement>("[data-menu-initial-focus]")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = menuRef.current?.querySelector<HTMLElement>(".mobile-navigation__panel");
      const focusable = Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
        .filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      delete document.documentElement.dataset.chapterMenuOpen;
      delete document.documentElement.dataset.desktopMenuOpen;
    };
  }, [closeMenu, isOpen]);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, itemPath: string) => {
    const targetPath = withLanguagePrefix(itemPath, language);
    const isSamePath = stripLanguagePrefix(location.pathname) === itemPath;
    preloadPublicRoute(itemPath);
    if (isOpen) {
      event.preventDefault();
      setPendingPath(itemPath);
      closeMenu(() => {
        if (!isSamePath) navigate(targetPath);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    }
    if (isSamePath) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header
        data-scrolled={scrolled ? "true" : "false"}
        data-immersive={hasImmersiveHero ? "true" : "false"}
        data-header-state={usesOverlayHeader ? "overlay" : "solid"}
        className={`site-header ${usesOverlayHeader ? "is-overlay" : "is-solid"} fixed inset-x-0 top-0 transition-all duration-300`}
        style={{ zIndex: PUBLIC_CHROME_Z.header }}
      >
        <div className="site-header__inner site-container flex h-12 flex-nowrap items-center gap-3 md:h-16">
          <LocalizedLink to="/" className="site-header__brand flex h-8 w-[7.75rem] max-w-[42%] shrink-0 items-center md:h-10 md:w-40 md:max-w-[12rem]">
            {resolvedLogoState !== "none" ? (
              <SmartImage src={logoSrc} alt="" className="h-full w-full object-contain object-left" width={190} height={48} loading="eager" decoding="async" onError={() => setLogoState(resolvedLogoState === "primary" ? "fallback" : "none")} />
            ) : (
              <span className="min-w-0 truncate text-[15px] font-semibold tracking-wide text-foreground/90 md:text-base">{brandText}</span>
            )}
            <span className="sr-only">{brandText}</span>
          </LocalizedLink>

          <nav className="site-header__desktop-nav hidden min-w-0 flex-1 items-center justify-center min-[1180px]:flex" aria-label={navText.mainNav}>
            {primaryPublicNavigationItems.map((item) => {
              const active = isActivePath(location.pathname, item.path);
              return (
                <LocalizedLink key={item.path} to={item.path} onClick={(event) => handleNavClick(event, item.path)} onFocus={() => preloadPublicRoute(item.path)} onPointerEnter={() => preloadPublicRoute(item.path)} aria-current={active ? "page" : undefined} className={`site-header__nav-link ${active ? "site-header__nav-link--active" : ""}`}>
                  {t(item.labelKey)}
                </LocalizedLink>
              );
            })}
          </nav>

          <div className="site-header__desktop-actions hidden shrink-0 items-center gap-2 min-[1180px]:flex">
            <LanguageSwitchLink variant="desktop" className="site-header__control site-header__language-control" />
            <Button size="sm" className="site-header__quote-button font-semibold" asChild>
              <LocalizedLink to="/quote" onClick={() => trackCtaClick("quote", "desktop_header", { destination: "/quote" })}>
                {t("cta.getQuote")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </LocalizedLink>
            </Button>
            <button type="button" className="site-header__menu-trigger" aria-label={isOpen ? navText.closeMenu : navText.openMenu} aria-expanded={isOpen} aria-controls="site-directory" onClick={(event) => isOpen ? closeMenu() : openMenu(event.currentTarget)}>
              <span>{navText.more}</span>
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="ml-auto flex shrink-0 items-center min-[1180px]:hidden">
            <div className="site-header__mobile-controls flex h-11 items-center">
              <LanguageSwitchLink variant="mobile" className="site-header__mobile-button site-header__mobile-language-button flex h-10 w-[3.75rem] items-center justify-center text-[11px] font-bold" />
              <button type="button" className="site-header__mobile-button flex h-10 w-10 items-center justify-center transition-colors" onClick={(event) => isOpen ? closeMenu() : openMenu(event.currentTarget)} aria-label={isOpen ? navText.closeMenu : navText.openMenu} aria-expanded={isOpen} aria-controls="mobile-navigation">
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isOpen && (
        <div id="mobile-navigation" ref={menuRef} data-state={isMenuClosing ? "closing" : "open"} className="mobile-navigation site-header__more-menu fixed inset-0" style={{ zIndex: PUBLIC_CHROME_Z.mobileMenu }}>
          <button type="button" className="mobile-navigation__scrim" aria-label={navText.closeMenu} tabIndex={-1} onClick={() => closeMenu()} />
          <div id="site-directory" className="mobile-navigation__panel" role="dialog" aria-modal="true" aria-label={navText.siteDirectory}>
            <div className="mobile-navigation__masthead site-container">
              <div><span>{navText.siteDirectory}</span><strong>FLASH CAST</strong></div>
              <p>{navText.menuDescription}</p>
              <button type="button" className="mobile-navigation__close" onClick={() => closeMenu()} aria-label={navText.closeMenu} data-menu-initial-focus><X className="h-5 w-5" /></button>
            </div>

            <div className="mobile-navigation__body site-container">
              <nav className="mobile-navigation__list" aria-label={navText.mobileNav}>
                <div className="mobile-navigation__secondary-groups">
                  {publicNavigationGroups.map((group, groupIndex) => {
                    const expanded = expandedGroup === group.key;
                    const groupId = `mobile-navigation-${group.key}`;
                    return (
                      <section key={group.key} className="mobile-navigation__secondary-group site-header__more-group" data-mobile-nav-group={group.key}>
                        <button type="button" className="mobile-navigation__secondary-trigger" aria-expanded={expanded} aria-controls={groupId} onClick={() => setExpandedGroup(group.key)}>
                          <span>{groupLabel(group.key)}</span><ChevronDown aria-hidden="true" />
                        </button>
                        <div id={groupId} className="mobile-navigation__group-list" data-expanded={expanded ? "true" : "false"}>
                          {group.items.map((item, itemIndex) => {
                            const active = isActivePath(location.pathname, item.path);
                            const Icon = iconByKey[item.icon];
                            return (
                              <LocalizedLink
                                key={item.path}
                                to={item.path}
                                onClick={(event) => handleNavClick(event, item.path)}
                                onFocus={() => { preloadPublicRoute(item.path); setPreviewPath(item.path); }}
                                onPointerEnter={() => { preloadPublicRoute(item.path); setPreviewPath(item.path); }}
                                onTouchStart={() => preloadPublicRoute(item.path)}
                                aria-current={active ? "page" : undefined}
                                style={{ animationDelay: `${(groupIndex * 4 + itemIndex) * 34}ms` }}
                                className={`mobile-nav-link mobile-navigation__secondary-link site-header__more-link ${active ? "mobile-navigation__secondary-link--active site-header__more-link--active" : ""} ${pendingPath === item.path ? "mobile-nav-link--pending" : ""}`}
                              >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                <span className="mobile-navigation__secondary-label">{t(item.labelKey)}</span>
                                <span className="mobile-navigation__item-index" aria-hidden="true">{String(itemIndex + 1).padStart(2, "0")}</span>
                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                              </LocalizedLink>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </nav>

              <aside className="mobile-navigation__preview" aria-live="polite">
                <SmartImage key={previewItem.path} src={previewItem.previewImage} alt={navText.previewAlt} className="h-full w-full object-cover" width={900} height={1120} sizes="34vw" candidateWidths={[560, 720, 900]} quality={78} />
                <div className="mobile-navigation__preview-caption">
                  <span>{groupLabel(publicNavigationGroups.find((group) => group.items.some((item) => item.path === previewItem.path))?.key ?? "spaces")}</span>
                  <strong>{t(previewItem.labelKey)}</strong>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </div>
              </aside>
            </div>

            <div className="mobile-navigation__footer">
              <div className="mobile-navigation__footer-copy"><span>{navText.projectConsultation}</span><p>{navText.startWithSpace}</p></div>
              <LocalizedLink to="/quote" className="mobile-navigation__quote" onClick={(event) => { trackCtaClick("quote", "chapter_menu", { destination: "/quote" }); handleNavClick(event, "/quote"); }}>
                <FileText className="h-5 w-5" /><span>{t("cta.getQuote")}</span><ArrowRight className="h-5 w-5" />
              </LocalizedLink>
              <div className="mobile-navigation__contact-row">
                <a href={settings.phone_href} className="mobile-navigation__contact-action" onClick={() => trackCtaClick("phone", "chapter_menu", { destination: "phone" })}><Phone className="h-4 w-4" /><span>{navText.callConsult}</span></a>
                <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" className="mobile-navigation__contact-action" onClick={() => trackCtaClick("whatsapp", "chapter_menu", { destination: "whatsapp" })}><WhatsAppIcon className="h-4 w-4 text-whatsapp" /><span>{t("cta.whatsapp")}</span></a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
