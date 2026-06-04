import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ChevronDown, FileText, FolderOpen, GitBranch, ChevronRight, Globe, HelpCircle, Home, Info, Layers, LucideIcon, Mail, Menu, Phone, Wrench, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { navbarText } from "@/i18n/navbarText";
import { useT } from "@/i18n/useT";
import { getLanguageFromPath, stripLanguagePrefix, switchLanguagePath, withLanguagePrefix, type Language } from "@/i18n/routes";
import LocalizedLink from "@/components/LocalizedLink";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SmartImage from "@/components/SmartImage";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { trackCtaClick } from "@/lib/analytics";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import logoFallback from "@/assets/logo-flashcast.webp";

interface NavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { labelKey: "nav.home", path: "/", icon: Home },
  { labelKey: "nav.about", path: "/about", icon: Info },
  { labelKey: "nav.services", path: "/services", icon: Wrench },
  { labelKey: "nav.materials", path: "/materials", icon: Layers },
  { labelKey: "nav.projects", path: "/projects", icon: FolderOpen },
  { labelKey: "nav.process", path: "/process", icon: GitBranch },
  { labelKey: "nav.blog", path: "/blog", icon: BookOpen },
  { labelKey: "nav.faq", path: "/faq", icon: HelpCircle },
  { labelKey: "nav.contact", path: "/contact", icon: Mail },
];

const primaryDesktopNavItems = navItems.slice(0, 6);
const secondaryDesktopNavItems = navItems.slice(6);

const MOBILE_MENU_CLOSE_MS = 190;

const routePreloaders: Partial<Record<string, () => Promise<unknown>>> = {
  "/about": () => import("@/pages/About"),
  "/services": () => import("@/pages/Services"),
  "/materials": () => import("@/pages/Materials"),
  "/process": () => import("@/pages/Process"),
  "/blog": () => import("@/pages/Blog"),
  "/contact": () => import("@/pages/Contact"),
  "/quote": () => import("@/pages/Quote"),
};

const preloadPublicRoute = (path: string) => {
  const preload = routePreloaders[path];
  if (!preload) return;

  void preload().catch(() => undefined);
};

const getMobileMenuCloseDelay = () => {
  if (typeof window === "undefined" || !window.matchMedia) return MOBILE_MENU_CLOSE_MS;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : MOBILE_MENU_CLOSE_MS;
};

const isActivePath = (pathname: string, itemPath: string) => {
  if (itemPath === "/") return /^\/(en|zh)\/?$/.test(pathname);
  return pathname.endsWith(itemPath) || pathname.includes(`${itemPath}/`);
};

const getOppositeLanguage = (language: Language): Language => (language === "en" ? "zh" : "en");

const languageLabel = {
  en: { short: "EN", long: "EN" },
  zh: { short: "中", long: "中文" },
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
  const displayedTargetLanguage = getOppositeLanguage(displayedLanguage);
  const targetPath = switchLanguagePath(location.pathname, nextLanguage, location.search, location.hash);
  const ariaLabel = text.switchLanguage;

  useEffect(() => {
    setOptimisticLanguage(null);
  }, [location.pathname, location.search, location.hash]);

  const previewNextState = () => {
    setOptimisticLanguage(nextLanguage);
  };

  if (variant === "mobile") {
    return (
      <Link
        to={targetPath}
        onPointerDown={previewNextState}
        onClick={previewNextState}
        className={className}
        aria-label={ariaLabel}
      >
        <span className="site-header__mobile-language-label" aria-hidden="true">
          <span className="site-header__mobile-language-text">{languageLabel[displayedTargetLanguage].short}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={targetPath}
      onPointerDown={previewNextState}
      onClick={previewNextState}
      className={className}
      aria-label={ariaLabel}
    >
      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="site-header__language-option" data-active={displayedLanguage === "en" ? "true" : "false"}>
        {languageLabel.en.long}
      </span>
      <span className="site-header__language-divider" aria-hidden="true">
        |
      </span>
      <span className="site-header__language-option site-header__language-option--zh" data-active={displayedLanguage === "zh" ? "true" : "false"}>
        {languageLabel.zh.long}
      </span>
    </Link>
  );
};

const Navbar = () => {
  const { menuOpen: isOpen, setMenuOpen: setIsOpen } = usePublicChrome();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [logoState, setLogoState] = useState<"primary" | "fallback" | "none">("primary");
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMoreRef = useRef<HTMLDivElement>(null);
  const mobileCloseTimerRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useT();
  const navText = navbarText[language];
  const settings = useSiteSettings();
  const primaryLogoSrc = addCacheBuster(settings.logo_url || "", settings.updated_at);
  const brandText = settings.company_name || "FLASH CAST SDN. BHD.";
  const isHomePage = /^\/(en|zh)\/?$/.test(location.pathname);
  const resolvedLogoState: "primary" | "fallback" | "none" =
    logoState === "primary" && primaryLogoSrc ? "primary" : logoState === "none" ? "none" : "fallback";
  const logoSrc = resolvedLogoState === "primary" ? primaryLogoSrc : logoFallback;

  useEffect(() => {
    setLogoState("primary");
  }, [primaryLogoSrc]);

  const clearMobileCloseTimer = useCallback(() => {
    if (mobileCloseTimerRef.current === null) return;
    window.clearTimeout(mobileCloseTimerRef.current);
    mobileCloseTimerRef.current = null;
  }, []);

  const openMobileMenu = useCallback(() => {
    clearMobileCloseTimer();
    setPendingPath(null);
    setIsMenuClosing(false);
    setIsOpen(true);
  }, [clearMobileCloseTimer, setIsOpen]);

  const closeMobileMenu = useCallback((afterClose?: () => void) => {
    if (!isOpen) {
      afterClose?.();
      return;
    }

    clearMobileCloseTimer();
    mobileMenuRef.current?.setAttribute("data-state", "closing");
    setIsMenuClosing(true);

    mobileCloseTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsMenuClosing(false);
      setPendingPath(null);
      mobileCloseTimerRef.current = null;
      afterClose?.();
    }, getMobileMenuCloseDelay());
  }, [clearMobileCloseTimer, isOpen, setIsOpen]);

  useEffect(() => {
    return () => {
      clearMobileCloseTimer();
    };
  }, [clearMobileCloseTimer]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    clearMobileCloseTimer();
    setIsMenuClosing(false);
    setPendingPath(null);
    setIsOpen(false);
  }, [clearMobileCloseTimer, location.pathname, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.dataset.menuOpen = "true";
    } else {
      delete document.documentElement.dataset.menuOpen;
    }
    return () => {
      delete document.documentElement.dataset.menuOpen;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    mobileMenuRef.current?.querySelector<HTMLElement>("[data-mobile-menu-initial-focus]")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMobileMenu, isOpen]);

  useEffect(() => {
    if (!desktopMoreOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!desktopMoreRef.current?.contains(event.target as Node)) {
        setDesktopMoreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopMoreOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktopMoreOpen]);

  const menuAriaLabel = navText.openMenu;
  const callAriaLabel = navText.callAria;

  const moreLabel = navText.more;
  const desktopMoreActive = secondaryDesktopNavItems.some((item) => isActivePath(location.pathname, item.path));

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, itemPath: string) => {
    const targetPath = withLanguagePrefix(itemPath, language);
    const isSamePath = stripLanguagePrefix(location.pathname) === itemPath;

    preloadPublicRoute(itemPath);

    if (isOpen) {
      event.preventDefault();
      setPendingPath(itemPath);
      closeMobileMenu(() => {
        if (!isSamePath) {
          navigate(targetPath);
          return;
        }

        window.requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      });
      return;
    }

    if (!isSamePath) {
      setIsOpen(false);
      return;
    }

    event.preventDefault();
    setIsOpen(false);
    navigate(targetPath);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <>
      <header
        data-scrolled={scrolled ? "true" : "false"}
        data-home={isHomePage ? "true" : "false"}
        className="site-header fixed top-0 left-0 right-0 transition-all duration-300"
        style={{ zIndex: PUBLIC_CHROME_Z.header }}
      >
        <div className="site-header__inner site-container flex h-12 flex-nowrap items-center gap-3 md:h-16">
          <LocalizedLink
            to="/"
            className="site-header__brand flex h-8 w-[7.75rem] max-w-[42%] shrink-0 items-center md:h-10 md:w-40 md:max-w-[12rem]"
          >
            {resolvedLogoState !== "none" ? (
              <SmartImage
                src={logoSrc}
                alt=""
                className="h-full w-full object-contain object-left"
                width={190}
                height={48}
                loading="eager"
                decoding="async"
                onError={() => setLogoState(resolvedLogoState === "primary" ? "fallback" : "none")}
              />
            ) : (
              <span className="min-w-0 truncate text-[15px] font-semibold tracking-wide text-foreground/90 md:text-base">
                {brandText}
              </span>
            )}
            <span className="sr-only">{brandText}</span>
          </LocalizedLink>

          <nav className="site-header__desktop-nav hidden min-w-0 flex-1 items-center justify-center min-[1180px]:flex" aria-label={navText.mainNav}>
            {primaryDesktopNavItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <LocalizedLink
                  key={item.path}
                  to={item.path}
                  onClick={(event) => handleNavClick(event, item.path)}
                  onFocus={() => preloadPublicRoute(item.path)}
                  onPointerEnter={() => preloadPublicRoute(item.path)}
                  aria-current={isActive ? "page" : undefined}
                  className={`site-header__nav-link ${isActive ? "site-header__nav-link--active" : ""}`}
                >
                  {t(item.labelKey)}
                </LocalizedLink>
              );
            })}
            <div ref={desktopMoreRef} className="site-header__more">
              <button
                type="button"
                className={`site-header__nav-link site-header__more-button ${desktopMoreActive ? "site-header__nav-link--active" : ""}`}
                aria-haspopup="menu"
                aria-expanded={desktopMoreOpen}
                onClick={() => setDesktopMoreOpen((open) => !open)}
              >
                {moreLabel}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${desktopMoreOpen ? "rotate-180" : ""}`} />
              </button>
              {desktopMoreOpen && (
                <div className="site-header__more-menu" role="menu">
                  {secondaryDesktopNavItems.map((item) => {
                    const isActive = isActivePath(location.pathname, item.path);
                    const Icon = item.icon;
                    return (
                      <LocalizedLink
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        onClick={(event) => {
                          setDesktopMoreOpen(false);
                          handleNavClick(event, item.path);
                        }}
                        onFocus={() => preloadPublicRoute(item.path)}
                        onPointerEnter={() => preloadPublicRoute(item.path)}
                        aria-current={isActive ? "page" : undefined}
                        className={`site-header__more-link ${isActive ? "site-header__more-link--active" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{t(item.labelKey)}</span>
                      </LocalizedLink>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="site-header__desktop-actions hidden shrink-0 items-center min-[1180px]:flex">
            <LanguageSwitchLink
              variant="desktop"
              className="site-header__control site-header__language-control"
            />
            <Button variant="ghost" size="icon" className="site-header__icon-action" asChild>
              <a
                href={settings.phone_href}
                aria-label={callAriaLabel}
                title={navText.phoneTitle}
                onClick={() => trackCtaClick("phone", "desktop_header", { destination: "phone" })}
              >
                <Phone className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="site-header__icon-action" asChild>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={navText.whatsappAria}
                title={navText.whatsappAria}
                onClick={() => trackCtaClick("whatsapp", "desktop_header", { destination: "whatsapp" })}
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
              </a>
            </Button>
            <Button size="sm" className="site-header__quote-button font-semibold" asChild>
              <LocalizedLink
                to="/quote"
                className="whitespace-nowrap"
                onClick={() => trackCtaClick("quote", "desktop_header", { destination: "/quote" })}
              >
                {t("cta.getQuote")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </LocalizedLink>
            </Button>
          </div>

          <div className="ml-auto flex shrink-0 items-center min-[1180px]:hidden">
            <div className="site-header__mobile-controls flex h-11 items-center gap-1 rounded-full border border-white/75 bg-white/85 p-0.5 shadow-[0_16px_42px_-32px_rgba(21,18,14,0.55)] backdrop-blur-md">
              <LanguageSwitchLink
                variant="mobile"
                className="site-header__mobile-button site-header__mobile-language-button flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold text-foreground"
              />
              <a
                href={settings.phone_href}
                className="site-header__mobile-button flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted/70"
                aria-label={callAriaLabel}
                onClick={() => trackCtaClick("phone", "mobile_header", { destination: "phone" })}
              >
                <Phone className="h-5 w-5" />
              </a>
              <button
                className="site-header__mobile-button flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted/70"
                onClick={() => (isOpen ? closeMobileMenu() : openMobileMenu())}
                aria-label={menuAriaLabel}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isOpen && (
        <div
          id="mobile-navigation"
          ref={mobileMenuRef}
          data-state={isMenuClosing ? "closing" : "open"}
          className="mobile-navigation fixed inset-x-0 bottom-0 top-12 flex flex-col border-t border-border/70 bg-[hsl(var(--background))] shadow-[0_-24px_80px_-56px_rgba(21,18,14,0.45)] md:top-16 min-[1180px]:hidden"
          style={{ zIndex: PUBLIC_CHROME_Z.mobileMenu }}
          tabIndex={-1}
          data-mobile-menu-initial-focus
        >
          <div className="mobile-navigation__body">
            <nav className="mobile-navigation__list" aria-label={navText.mobileNav}>
              {navItems.map((item, index) => {
                const isActive = isActivePath(location.pathname, item.path);
                const Icon = item.icon;
                return (
                  <LocalizedLink
                    key={item.path}
                    to={item.path}
                    onClick={(event) => handleNavClick(event, item.path)}
                    onFocus={() => preloadPublicRoute(item.path)}
                    onPointerEnter={() => preloadPublicRoute(item.path)}
                    onTouchStart={() => preloadPublicRoute(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={`mobile-nav-link mobile-navigation__link ${isActive ? "mobile-navigation__link--active" : ""} ${pendingPath === item.path ? "mobile-nav-link--pending" : ""}`}
                  >
                    <span className="mobile-navigation__link-icon">
                      <Icon className="h-[1.35rem] w-[1.35rem]" />
                    </span>
                    <span className="mobile-navigation__link-text">{t(item.labelKey)}</span>
                    <ChevronRight className="mobile-navigation__link-arrow h-5 w-5" />
                  </LocalizedLink>
                );
              })}
            </nav>
          </div>

          <div className="mobile-navigation__footer">
            <LocalizedLink
              to="/quote"
              className="mobile-navigation__quote"
              onClick={(event) => {
                trackCtaClick("quote", "mobile_menu", { destination: "/quote" });
                handleNavClick(event, "/quote");
              }}
              onFocus={() => preloadPublicRoute("/quote")}
              onPointerEnter={() => preloadPublicRoute("/quote")}
              onTouchStart={() => preloadPublicRoute("/quote")}
            >
              <FileText className="h-5 w-5" />
              <span>{t("cta.getQuote")}</span>
              <ArrowRight className="h-5 w-5" />
            </LocalizedLink>
            <div className="mobile-navigation__divider" aria-hidden="true">
              <span />
              <b>✦</b>
              <span />
            </div>
            <div className="mobile-navigation__contact-row">
              <a
                href={settings.phone_href}
                className="mobile-navigation__contact-action"
                onClick={() => trackCtaClick("phone", "mobile_menu", { destination: "phone" })}
              >
                <Phone className="h-4 w-4" />
                <span>{navText.callConsult}</span>
              </a>
              <a
                href={settings.whatsapp_url()}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-navigation__contact-action"
                onClick={() => trackCtaClick("whatsapp", "mobile_menu", { destination: "whatsapp" })}
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" />
                <span>{t("cta.whatsapp")}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
