import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BadgePercent, BookOpen, ChevronDown, Columns2, FileText, FolderOpen, GitBranch, ChevronRight, Globe, HelpCircle, Home, Info, Layers, LucideIcon, Mail, MapPinned, Menu, Moon, PackageSearch, Phone, Sun, Wrench, X } from "lucide-react";
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
  { labelKey: "nav.projects", path: "/projects", icon: FolderOpen },
  { labelKey: "nav.products", path: "/products", icon: PackageSearch },
  { labelKey: "nav.promotions", path: "/promotions", icon: BadgePercent },
  { labelKey: "nav.contact", path: "/contact", icon: Mail },
  { labelKey: "nav.about", path: "/about", icon: Info },
  { labelKey: "nav.services", path: "/services", icon: Wrench },
  { labelKey: "nav.materials", path: "/materials", icon: Layers },
  { labelKey: "nav.process", path: "/process", icon: GitBranch },
  { labelKey: "nav.blog", path: "/blog", icon: BookOpen },
  { labelKey: "nav.faq", path: "/faq", icon: HelpCircle },
  { labelKey: "nav.locations", path: "/locations", icon: MapPinned },
  { labelKey: "nav.beforeAfter", path: "/before-after", icon: Columns2 },
];

const primaryDesktopNavItems = navItems.slice(0, 5);
const secondaryDesktopNavGroups = [
  {
    key: "company",
    paths: ["/about", "/process", "/blog", "/faq"],
  },
  {
    key: "explore",
    paths: ["/services", "/materials", "/locations", "/before-after"],
  },
] as const;
const secondaryDesktopNavItems = secondaryDesktopNavGroups.flatMap((group) =>
  group.paths.flatMap((path) => navItems.filter((item) => item.path === path)),
);

const MOBILE_MENU_CLOSE_MS = 190;

const routePreloaders: Partial<Record<string, () => Promise<unknown>>> = {
  "/about": () => import("@/pages/About"),
  "/services": () => import("@/pages/Services"),
  "/materials": () => import("@/pages/Materials"),
  "/products": () => import("@/pages/Products"),
  "/promotions": () => import("@/pages/Promotions"),
  "/locations": () => import("@/pages/Locations"),
  "/before-after": () => import("@/pages/BeforeAfter"),
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
  const { hasImmersiveHero, menuOpen: isOpen, setMenuOpen: setIsOpen, theme, toggleTheme } = usePublicChrome();
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
  const solidHeader = !hasImmersiveHero || scrolled || isOpen || desktopMoreOpen;
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
    let frame = 0;
    const update = () => {
      frame = 0;
      const nextScrolled = window.scrollY > 20;
      setScrolled((current) => current === nextScrolled ? current : nextScrolled);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
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

  useEffect(() => {
    if (desktopMoreOpen) {
      document.documentElement.dataset.desktopMenuOpen = "true";
    } else {
      delete document.documentElement.dataset.desktopMenuOpen;
    }

    return () => {
      delete document.documentElement.dataset.desktopMenuOpen;
    };
  }, [desktopMoreOpen]);

  const menuAriaLabel = navText.openMenu;
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
        data-immersive={hasImmersiveHero ? "true" : "false"}
        data-header-state={solidHeader ? "solid" : "overlay"}
        className={`site-header fixed top-0 left-0 right-0 transition-all duration-300 ${solidHeader ? "is-solid" : "is-overlay"}`}
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
                aria-controls="desktop-more-navigation"
                onClick={() => setDesktopMoreOpen((open) => !open)}
              >
                {moreLabel}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${desktopMoreOpen ? "rotate-180" : ""}`} />
              </button>
              {desktopMoreOpen && (
                <div id="desktop-more-navigation" className="site-header__more-menu" role="menu" aria-label={navText.siteDirectory}>
                  <div className="site-header__more-heading" role="presentation">
                    <span>{navText.siteDirectory}</span>
                    <b>FLASH CAST</b>
                  </div>
                  <div className="site-header__more-grid" role="presentation">
                    {secondaryDesktopNavGroups.map((group) => (
                      <section key={group.key} className="site-header__more-group" role="presentation">
                        <p>{group.key === "company" ? navText.companyGroup : navText.exploreGroup}</p>
                        {group.paths.flatMap((path) => navItems.filter((item) => item.path === path)).map((item) => {
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
                              <Icon className="site-header__more-link-icon h-4 w-4" aria-hidden="true" />
                              <span>{t(item.labelKey)}</span>
                              <ArrowUpRight className="site-header__more-link-arrow h-3.5 w-3.5" aria-hidden="true" />
                            </LocalizedLink>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                  <div className="site-header__more-footer" role="presentation">
                    <span>{navText.projectConsultation}</span>
                    <LocalizedLink
                      to="/quote"
                      role="menuitem"
                      onClick={(event) => {
                        setDesktopMoreOpen(false);
                        trackCtaClick("quote", "desktop_more_menu", { destination: "/quote" });
                        handleNavClick(event, "/quote");
                      }}
                    >
                      {t("cta.getQuote")}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </LocalizedLink>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="site-header__desktop-actions hidden shrink-0 items-center min-[1180px]:flex">
            <LanguageSwitchLink
              variant="desktop"
              className="site-header__control site-header__language-control"
            />
            <Button
              variant="ghost"
              size="icon"
              className="site-header__icon-action"
              type="button"
              aria-label={theme === "dark" ? navText.useLightTheme : navText.useDarkTheme}
              title={theme === "dark" ? navText.useLightTheme : navText.useDarkTheme}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
            <div className="site-header__mobile-controls flex h-11 items-center">
              <LanguageSwitchLink
                variant="mobile"
                className="site-header__mobile-button site-header__mobile-language-button flex h-10 w-10 items-center justify-center text-[11px] font-bold"
              />
              <button
                type="button"
                className="site-header__mobile-button flex h-10 w-10 items-center justify-center transition-colors"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? navText.useLightTheme : navText.useDarkTheme}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                className="site-header__mobile-button flex h-10 w-10 items-center justify-center transition-colors"
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
              <section className="mobile-navigation__primary" aria-label={navText.featuredNavigation}>
                <div className="mobile-navigation__primary-grid">
                  {primaryDesktopNavItems.map((item, index) => {
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
                        className={`mobile-nav-link mobile-navigation__primary-link ${isActive ? "mobile-navigation__primary-link--active" : ""} ${pendingPath === item.path ? "mobile-nav-link--pending" : ""}`}
                      >
                        <span className="mobile-navigation__primary-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <Icon className="mobile-navigation__primary-icon h-5 w-5" aria-hidden="true" />
                        <span className="mobile-navigation__primary-label">{t(item.labelKey)}</span>
                        <ArrowUpRight className="mobile-navigation__primary-arrow h-4 w-4" aria-hidden="true" />
                      </LocalizedLink>
                    );
                  })}
                </div>
              </section>

              <div className="mobile-navigation__secondary-groups">
                {secondaryDesktopNavGroups.map((group, groupIndex) => (
                  <section key={group.key} className="mobile-navigation__secondary-group">
                    <p>{group.key === "company" ? navText.companyGroup : navText.exploreGroup}</p>
                    <div>
                      {group.paths.flatMap((path) => navItems.filter((item) => item.path === path)).map((item, itemIndex) => {
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
                            style={{ animationDelay: `${(primaryDesktopNavItems.length + groupIndex * 4 + itemIndex) * 40}ms` }}
                            className={`mobile-nav-link mobile-navigation__secondary-link ${isActive ? "mobile-navigation__secondary-link--active" : ""} ${pendingPath === item.path ? "mobile-nav-link--pending" : ""}`}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                            <span>{t(item.labelKey)}</span>
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </LocalizedLink>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </nav>
          </div>

          <div className="mobile-navigation__footer">
            <div className="mobile-navigation__footer-copy">
              <span>{navText.projectConsultation}</span>
              <p>{navText.startWithSpace}</p>
            </div>
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
