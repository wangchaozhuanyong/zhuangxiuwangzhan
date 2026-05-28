import { useEffect, useState } from "react";
import { Phone, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
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

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <a href={settings.whatsapp_url()} target="_blank" rel="noopener noreferrer" className="flex min-h-14 flex-col items-center justify-center text-[11px] font-semibold text-foreground">
          <WhatsAppIcon className="mb-1 h-5 w-5 text-[#25D366]" />
          {t.whatsapp}
        </a>
        <a href={settings.phone_href} className="flex min-h-14 flex-col items-center justify-center border-x border-border text-[11px] font-semibold text-foreground">
          <Phone className="mb-1 h-5 w-5 text-accent" />
          {t.call}
        </a>
        <LocalizedLink to="/quote" className="flex min-h-14 flex-col items-center justify-center bg-accent text-[11px] font-bold text-accent-foreground">
          <span className="mb-1 text-base leading-none">RM</span>
          {t.quote}
        </LocalizedLink>
      </div>

      <div className="fixed bottom-6 right-6 z-50 hidden w-[330px] lg:block">
        {showDesktopCta ? (
          <div className="relative mb-3 rounded-2xl border border-white/18 bg-charcoal/92 p-4 text-white shadow-2xl backdrop-blur-md animate-fade-up">
            <button
              type="button"
              onClick={dismissPrompt}
              aria-label={t.close}
              className="absolute right-3 top-3 rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="pr-6 text-sm font-medium leading-6 text-white/88">{t.prompt}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <LocalizedLink
                to="/quote"
                className="rounded-full bg-[hsl(var(--gold))] px-4 py-2 text-center text-sm font-semibold text-charcoal transition-transform hover:scale-[1.02]"
              >
                {t.quote}
              </LocalizedLink>
              <a
                href={settings.whatsapp_url("Floating desktop prompt")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/25 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                WhatsApp
              </a>
            </div>
          </div>
        ) : null}
        <a
          href={settings.whatsapp_url("Floating desktop CTA")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.whatsappAria}
          className="ml-auto flex w-fit translate-y-0 items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-white shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl active:scale-95"
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="ml-2 text-sm font-semibold">{t.whatsappDesktop}</span>
        </a>
      </div>
    </>
  );
};

export default FloatingCTA;
