import { useEffect, useState } from "react";
import { X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import AdaptiveSurface from "@/components/AdaptiveSurface";
import { useLanguage } from "@/i18n/LanguageContext";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { trackCtaClick } from "@/lib/analytics";
import { readBrowserPreference, writeBrowserPreference } from "@/lib/browserPreference";

const CTA_DISMISSED_KEY = "flashcast_cta_dismissed_at";

const copy = {
  en: {
    quote: "Free Quote",
    whatsappAria: "Chat on WhatsApp",
    whatsappDesktop: "WhatsApp Us",
    prompt: "Need a renovation estimate? We can help you plan the budget first.",
    close: "Close consultation prompt",
  },
  zh: {
    quote: "免费报价",
    whatsappAria: "通过 WhatsApp 咨询",
    whatsappDesktop: "WhatsApp 咨询",
    prompt: "需要装修报价？我们可以先帮你估算预算。",
    close: "关闭咨询提示",
  },
};

/** 桌面端右下角浮动 CTA（lg+）；与移动端底栏互斥展示 */
const DesktopFloatingCta = () => {
  const { language } = useLanguage();
  const settings = useSiteSettings();
  const { menuOpen } = usePublicChrome();
  const t = copy[language];
  const [showPrompt, setShowPrompt] = useState(false);
  const [contentOverlapZone, setContentOverlapZone] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(readBrowserPreference(CTA_DISMISSED_KEY) || 0);
    const dismissedRecently = Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
    if (dismissedRecently) {
      return;
    }

    const reveal = () => setShowPrompt(true);
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

  useEffect(() => {
    const updateFooterState = () => {
      const overlapTargets = Array.from(
        document.querySelectorAll(".projects-showcase-section, .material-directory-grid, .site-footer-art, footer"),
      );
      if (!overlapTargets.length) {
        setContentOverlapZone(false);
        return;
      }

      const shouldHide = overlapTargets.some((target) => {
        const rect = target.getBoundingClientRect();
        const earlyHideBuffer = target.classList.contains("site-footer-art") || target.tagName.toLowerCase() === "footer" ? 260 : 80;
        return rect.top < window.innerHeight + earlyHideBuffer && rect.bottom > 120;
      });

      setContentOverlapZone(shouldHide);
    };

    updateFooterState();
    window.addEventListener("scroll", updateFooterState, { passive: true });
    window.addEventListener("resize", updateFooterState);
    return () => {
      window.removeEventListener("scroll", updateFooterState);
      window.removeEventListener("resize", updateFooterState);
    };
  }, []);

  const dismissPrompt = () => {
    writeBrowserPreference(CTA_DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  };

  if (menuOpen || contentOverlapZone) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 hidden w-[330px] lg:block"
      style={{ zIndex: PUBLIC_CHROME_Z.desktopFloating }}
    >
      <div className="pointer-events-auto">
        {showPrompt ? (
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
              <LocalizedLink
                to="/quote"
                className="btn-on-dark-primary justify-center px-4 py-2.5 text-center text-sm"
                onClick={() => trackCtaClick("quote", "floating_desktop_prompt", { destination: "/quote" })}
              >
                {t.quote}
              </LocalizedLink>
              <a
                href={settings.whatsapp_url("Floating desktop prompt")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-on-dark-secondary justify-center px-4 py-2.5 text-center text-sm"
                onClick={() => trackCtaClick("whatsapp", "floating_desktop_prompt", { destination: "whatsapp" })}
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
          onClick={() => trackCtaClick("whatsapp", "floating_desktop_button", { destination: "whatsapp" })}
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="ml-2 text-sm font-semibold">{t.whatsappDesktop}</span>
        </a>
      </div>
    </div>
  );
};

export default DesktopFloatingCta;
