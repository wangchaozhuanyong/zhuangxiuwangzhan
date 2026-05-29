import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, FolderOpen, GitBranch, ChevronRight, Globe, HelpCircle, Home, Info, Layers, LucideIcon, Mail, Menu, Wrench, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { switchLanguagePath } from "@/i18n/routes";
import LocalizedLink from "@/components/LocalizedLink";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SmartImage from "@/components/SmartImage";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
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

const isActivePath = (pathname: string, itemPath: string) => {
  if (itemPath === "/") return /^\/(en|zh)\/?$/.test(pathname);
  return pathname.endsWith(itemPath) || pathname.includes(`${itemPath}/`);
};

const Navbar = () => {
  const { menuOpen: isOpen, setMenuOpen: setIsOpen } = usePublicChrome();
  const [scrolled, setScrolled] = useState(false);
  const [logoState, setLogoState] = useState<"primary" | "fallback" | "none">("primary");
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const settings = useSiteSettings();
  const primaryLogoSrc = settings.logo_url || "";
  const brandText = settings.company_name || "FLASH CAST SDN. BHD.";
  const resolvedLogoState: "primary" | "fallback" | "none" =
    logoState === "primary" && primaryLogoSrc ? "primary" : logoState === "none" ? "none" : "fallback";
  const logoSrc = resolvedLogoState === "primary" ? primaryLogoSrc : logoFallback;

  const changeLanguage = () => {
    const nextLanguage = language === "en" ? "zh" : "en";
    setLanguage(nextLanguage);
    navigate(switchLanguagePath(location.pathname, nextLanguage));
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

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

    mobileMenuRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  const languageAriaLabel = language === "zh" ? "切换语言" : "Switch language";
  const menuAriaLabel = language === "zh" ? "打开导航菜单" : "Toggle navigation menu";

  return (
    <>
      <header
        data-scrolled={scrolled ? "true" : "false"}
        className="site-header fixed top-0 left-0 right-0 transition-all duration-300"
        style={{ zIndex: PUBLIC_CHROME_Z.header }}
      >
        <div className="site-container flex h-16 flex-nowrap items-center gap-3 md:h-[72px]">
          <LocalizedLink
            to="/"
            className="flex h-11 w-[10.5rem] max-w-[54%] shrink-0 items-center md:h-12 md:w-48 md:max-w-[14rem]"
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

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
            {navItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <LocalizedLink
                  key={item.path}
                  to={item.path}
                  className={`relative whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors 2xl:text-[13px] ${isActive ? "text-foreground" : "text-foreground/70 hover:text-foreground"}`}
                >
                  {t(item.labelKey)}
                  {isActive && (
                    <span className="absolute bottom-1 left-3 right-3 h-px rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.4)]" />
                  )}
                </LocalizedLink>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
            <button
              onClick={changeLanguage}
              className="site-header__control flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-foreground/75 transition-colors hover:text-foreground"
              aria-label={languageAriaLabel}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className={language === "en" ? "font-semibold text-foreground" : ""}>EN</span>
              <span className="text-muted-foreground/40">|</span>
              <span className={language === "zh" ? "font-semibold text-foreground" : ""}>中文</span>
            </button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap text-muted-foreground" asChild>
              <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="mr-1.5 h-4 w-4 text-whatsapp" /> WhatsApp
              </a>
            </Button>
            <Button size="sm" className="font-semibold" asChild>
              <LocalizedLink to="/quote" className="whitespace-nowrap">
                {t("cta.getQuote")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </LocalizedLink>
            </Button>
          </div>

          <div className="ml-auto flex shrink-0 items-center xl:hidden">
            <div className="flex h-11 items-center rounded-full border border-white/75 bg-white/85 p-1 shadow-[0_16px_42px_-32px_rgba(21,18,14,0.55)] backdrop-blur-md">
              <button
                onClick={changeLanguage}
                className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-foreground transition-colors active:bg-muted/70"
                aria-label={languageAriaLabel}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{language === "en" ? "EN" : "中文"}</span>
              </button>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border/80" />
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors active:bg-muted/70"
                onClick={() => setIsOpen(!isOpen)}
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
          className="fixed inset-x-0 bottom-0 top-16 flex flex-col border-t border-border/70 bg-[hsl(var(--background))] shadow-[0_-24px_80px_-56px_rgba(21,18,14,0.45)] md:top-[72px] xl:hidden"
          style={{ zIndex: PUBLIC_CHROME_Z.mobileMenu }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = isActivePath(location.pathname, item.path);
                const Icon = item.icon;
                return (
                  <LocalizedLink
                    key={item.path}
                    to={item.path}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={`flex min-h-[54px] items-center gap-3 rounded-card border px-3 text-[15px] font-medium opacity-0 shadow-[0_14px_34px_-30px_rgba(21,18,14,0.38)] animate-fade-in [animation-fill-mode:forwards] ${
                      isActive
                        ? "border-gold/30 bg-card text-foreground"
                        : "border-border/60 bg-card/80 text-foreground/80 active:bg-card"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${isActive ? "border-gold/40 bg-gold/10" : "border-border/70 bg-background"}`}
                    >
                      <Icon className={`h-[18px] w-[18px] ${isActive ? "text-gold" : "text-muted-foreground"}`} />
                    </span>
                    <span className={`min-w-0 flex-1 ${isActive ? "font-semibold" : ""}`}>{t(item.labelKey)}</span>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? "text-gold/60" : "text-muted-foreground/50"}`} />
                  </LocalizedLink>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 space-y-3 border-t border-border bg-[hsl(var(--background))] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <Button size="lg" className="h-12 w-full justify-center text-sm font-semibold" asChild>
              <LocalizedLink to="/quote">{t("cta.getQuote")}</LocalizedLink>
            </Button>
            <Button size="lg" variant="outline" className="h-12 w-full justify-center text-sm font-medium" asChild>
              <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="mr-1.5 h-4 w-4 text-whatsapp" />
                {t("cta.whatsapp")}
              </a>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
