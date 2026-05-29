import { useEffect, useState } from "react";
import { Phone, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import AdaptiveSurface from "@/components/AdaptiveSurface";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const copy = {
  en: {
    whatsapp: "WhatsApp",
    call: "Call",
    quote: "Free Quote",
    whatsappAria: "Chat on WhatsApp",
    whatsappDesktop: "WhatsApp Us",
    prompt: "Need a renovation estimate? We can help you plan the budget first.",
    close: "Close consultation prompt",
  },
  zh: {
    whatsapp: "WhatsApp",
    call: "电话",
    quote: "免费报价",
    whatsappAria: "通过 WhatsApp 咨询",
    whatsappDesktop: "WhatsApp 咨询",
    prompt: "需要装修报价？我们可以先帮你估算预算。",
    close: "关闭咨询提示",
  },
};

const FloatingCTA = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const t = copy[language];
  const [showDesktopCta, setShowDesktopCta] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncMenuState = () => {
      setMenuOpen(document.documentElement.dataset.menuOpen === "true");
    };
    syncMenuState();
    const observer = new MutationObserver(syncMenuState);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-menu-open"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem("flashcast_cta_dismissed_at") || 0);
    const dismissedRecently = Date.now() - dismissedAt < 24 * 60 * 60 * 1000;

    if (dismissedRecently) {
      return;
    }

    const reveal = () => setShowDesktopCta(true);
    const timer = window.setTimeout(reveal, 18000);

    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollable <= 0) {
        return;
      }

      if (window.scrollY / scrollable > 0.3) {
        reveal();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem("flashcast_cta_dismissed_at", String(Date.now()));
    setShowDesktopCta(false);
  };

  if (menuOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-3 border-t border-border/80 bg-background/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_-12px_rgba(21,18,14,0.2)] backdrop-blur-md md:hidden">
        <a
          href={settings.whatsapp_url()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-16 min-w-0 flex-col items-center justify-center border-r border-border/60 text-[11px] font-semibold text-foreground"
        >
          <WhatsAppIcon className="mb-1 h-5 w-5 text-whatsapp" />
          {t.whatsapp}
        </a>
        <a
          href={settings.phone_href}
          className="flex min-h-16 min-w-0 flex-col items-center justify-center border-r border-border/60 text-[11px] font-semibold text-foreground"
        >
          <Phone className="mb-1 h-5 w-5 text-gold" />
          {t.call}
        </a>
        <LocalizedLink
          to="/quote"
          className="flex min-h-16 min-w-0 flex-col items-center justify-center bg-[#15120E] text-[11px] font-bold text-[#C6A46A]"
        >
          <span className="mb-1 text-base leading-none">RM</span>
          {t.quote}
        </LocalizedLink>
      </div>

      <div className="fixed bottom-6 right-6 z-40 hidden w-[330px] lg:block">
        {showDesktopCta ? (
          <AdaptiveSurface
            background="hsl(var(--surface-dark) / 0.94)"
            foreground="hsl(var(--surface-dark-foreground))"
            className="relative mb-3 animate-fade-up rounded-card-lg border border-white/12 p-4 shadow-luxury backdrop-blur-md"
          >
            <button
              type="button"
              onClick={dismissPrompt}
              aria-label={t.close}
              className="absolute right-3 top-3 rounded-full p-1 text-surface-dark-foreground/60 transition-colors hover:bg-white/10 hover:text-surface-dark-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="pr-6 text-sm font-medium leading-6 text-surface-dark-foreground/90">{t.prompt}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <LocalizedLink to="/quote" className="btn-on-dark-primary justify-center px-4 py-2.5 text-center text-sm">
                {t.quote}
              </LocalizedLink>
              <a
                href={settings.whatsapp_url("Floating desktop prompt")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary justify-center px-4 py-2.5 text-center text-sm"
              >
                WhatsApp
              </a>
            </div>
          </AdaptiveSurface>
        ) : null}
        <a
          href={settings.whatsapp_url("Floating desktop CTA")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.whatsappAria}
          className="ml-auto flex w-fit items-center justify-center rounded-full bg-whatsapp px-5 py-3 text-whatsapp-foreground shadow-luxury transition-all duration-300 hover:scale-[1.02]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="ml-2 text-sm font-semibold">{t.whatsappDesktop}</span>
        </a>
      </div>
    </>
  );
};

export default FloatingCTA;
