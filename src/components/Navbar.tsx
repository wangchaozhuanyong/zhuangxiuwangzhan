import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, Home, Info, Wrench, Layers, FolderOpen, GitBranch, BookOpen, HelpCircle, Mail, Globe, LucideIcon } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useT } from "@/i18n/useT";
import logoImg from "@/assets/logo-flashcast.png";

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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const t = useT();

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
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/98 backdrop-blur-md border-b border-border shadow-sm"
            : "bg-background/95 backdrop-blur-md border-b border-border"
        }`}
      >
        <div className="container-narrow flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logoImg} alt="FLASH CAST SDN. BHD." className="h-8 md:h-9 w-auto object-contain" />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative text-[13px] font-medium px-3 py-2 transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(item.labelKey)}
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-accent rounded-full" />}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
              aria-label="Switch language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className={language === "en" ? "text-foreground font-semibold" : ""}>EN</span>
              <span className="text-muted-foreground/40">|</span>
              <span className={language === "zh" ? "text-foreground font-semibold" : ""}>中</span>
            </button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-4 h-4 mr-1.5 text-[#25D366]" /> WhatsApp
              </a>
            </Button>
            <Button size="sm" className="font-semibold" asChild>
              <Link to="/quote">{t("cta.getAQuote")} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>

          <div className="lg:hidden flex items-center gap-1 -mr-1">
            <button
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2 rounded-lg hover:bg-muted"
              aria-label="Switch language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-semibold">{language === "en" ? "EN" : "中"}</span>
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {isOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-[60] bg-background overflow-hidden">
          <div className="absolute inset-x-0 top-0 bottom-[185px] overflow-y-auto px-5 py-4">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3 px-3 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block mr-2" />
              {t("nav.navigation")}
            </p>
            <div className="space-y-0.5">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={`flex items-center gap-3 py-3 px-3 rounded-lg text-[15px] font-medium transition-colors opacity-0 animate-fade-in [animation-fill-mode:forwards] ${
                      isActive
                        ? "text-accent bg-accent/10 border-l-2 border-accent"
                        : "text-foreground active:bg-muted"
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-accent/15" : "bg-muted/50"}`}>
                      <Icon className={`w-[18px] h-[18px] ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                    </span>
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[185px] z-10">
            <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          </div>

          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur-sm px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
            <div className="flex items-center justify-center">
              <button
                onClick={() => setLanguage(language === "en" ? "zh" : "en")}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className={language === "en" ? "text-foreground font-semibold" : ""}>EN</span>
                <span className="text-muted-foreground/40">|</span>
                <span className={language === "zh" ? "text-foreground font-semibold" : ""}>中文</span>
              </button>
            </div>
            <Button size="lg" className="w-full font-semibold h-12 text-sm justify-center" asChild>
              <Link to="/quote">{t("cta.getQuote")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full h-12 text-sm font-medium justify-center" asChild>
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-4 h-4 mr-1.5 text-[#25D366]" />
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
