import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, FolderOpen, GitBranch, Globe, HelpCircle, Home, Info, Layers, LucideIcon, Mail, Menu, Wrench, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import { switchLanguagePath } from "@/i18n/routes";
import LocalizedLink from "@/components/LocalizedLink";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoHadError, setLogoHadError] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const settings = useSiteSettings();
  const logoSrc = !logoHadError && settings.logo_url ? settings.logo_url : "/logo-flashcast.png";

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
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
  }, [isOpen]);

  const languageAriaLabel = language === "zh" ? "切换语言" : "Switch language";
  const menuAriaLabel = language === "zh" ? "打开导航菜单" : "Toggle navigation menu";

  return (
    <>
      <header
        data-scrolled={scrolled ? "true" : "false"}
        className="site-header fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="mx-auto flex h-[68px] w-full max-w-7xl flex-nowrap items-center gap-2 px-4 md:h-[72px] md:px-6 xl:px-8">
          <LocalizedLink to="/" className="flex items-center shrink-0">
            <img
              src={logoSrc}
              alt={settings.company_name}
              className="h-8 md:h-9 w-auto object-contain drop-shadow-[0_1px_1px_rgba(255,255,255,0.45)]"
              loading="eager"
              decoding="async"
              onError={() => setLogoHadError(true)}
            />
          </LocalizedLink>

          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 xl:flex">
            {navItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path);
              return (
                <LocalizedLink
                  key={item.path}
                  to={item.path}
                  className={`relative whitespace-nowrap px-2.5 py-2 text-[12px] font-medium transition-colors 2xl:text-[13px] ${isActive ? "text-foreground" : "text-foreground/75 hover:text-foreground"}`}
                >
                  {t(item.labelKey)}
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-px bg-accent rounded-full shadow-[0_0_12px_hsl(var(--accent)/0.45)]" />}
                </LocalizedLink>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <button onClick={changeLanguage} className="site-header__control flex items-center gap-1 text-xs font-medium text-foreground/75 hover:text-foreground transition-colors px-3 py-2 rounded-full" aria-label={languageAriaLabel}>
              <Globe className="w-3.5 h-3.5" />
              <span className={language === "en" ? "text-foreground font-semibold" : ""}>EN</span>
              <span className="text-muted-foreground/40">|</span>
              <span className={language === "zh" ? "text-foreground font-semibold" : ""}>中文</span>
            </button>
            <Button variant="ghost" size="sm" className="whitespace-nowrap text-muted-foreground hover:text-foreground" asChild>
              <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-4 h-4 mr-1.5 text-whatsapp" /> WhatsApp
              </a>
            </Button>
            <Button size="sm" className="font-semibold" asChild>
              <LocalizedLink to="/quote" className="whitespace-nowrap">
                {t("cta.getQuote")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </LocalizedLink>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1 -mr-1 xl:hidden">
            <button onClick={changeLanguage} className="site-header__control flex items-center gap-1 text-xs font-semibold text-foreground px-3 py-2 rounded-xl transition-colors" aria-label={languageAriaLabel}>
              <Globe className="w-3.5 h-3.5" />
              <span className="font-semibold">{language === "en" ? "EN" : "中文"}</span>
            </button>
            <button
              className="site-header__control w-10 h-10 flex items-center justify-center rounded-xl text-foreground transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={menuAriaLabel}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {isOpen && (
        <div id="mobile-navigation" ref={mobileMenuRef} className="fixed inset-x-0 top-[68px] bottom-0 z-[60] overflow-hidden bg-background md:top-[72px] xl:hidden">
          <div className="absolute inset-x-0 top-0 bottom-[185px] overflow-y-auto px-5 pt-3 pb-4">
            <div className="space-y-1">
              {navItems.map((item, index) => {
                const isActive = isActivePath(location.pathname, item.path);
                const Icon = item.icon;
                return (
                  <LocalizedLink
                    key={item.path}
                    to={item.path}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors opacity-0 animate-fade-in [animation-fill-mode:forwards] ${isActive ? "text-accent bg-accent/10 ring-1 ring-inset ring-accent/15" : "text-foreground active:bg-muted"}`}
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-accent/15" : "bg-muted/50"}`}>
                      <Icon className={`w-[18px] h-[18px] ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    </span>
                    {t(item.labelKey)}
                  </LocalizedLink>
                );
              })}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[185px] z-10">
            <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
            <div className="flex items-center justify-center">
              <button onClick={changeLanguage} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors" aria-label={languageAriaLabel}>
                <Globe className="w-3.5 h-3.5" />
                <span className={language === "en" ? "text-foreground font-semibold" : ""}>EN</span>
                <span className="text-muted-foreground/40">|</span>
                <span className={language === "zh" ? "text-foreground font-semibold" : ""}>中文</span>
              </button>
            </div>
            <Button size="lg" className="w-full font-semibold h-12 text-sm justify-center" asChild>
              <LocalizedLink to="/quote">{t("cta.getQuote")}</LocalizedLink>
            </Button>
            <Button size="lg" variant="outline" className="w-full h-12 text-sm font-medium justify-center" asChild>
              <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-4 h-4 mr-1.5 text-whatsapp" />
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
