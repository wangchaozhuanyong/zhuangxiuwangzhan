import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import LocalizedLink from "@/components/LocalizedLink";
import AdaptiveSurface from "@/components/AdaptiveSurface";
import { useLanguage } from "@/i18n/LanguageContext";
import { PUBLIC_CHROME_Z } from "@/lib/publicChrome";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { trackCtaClick } from "@/lib/analytics";
import { readBrowserPreference, writeBrowserPreference } from "@/lib/browserPreference";
import { stripLanguagePrefix } from "@/i18n/routes";

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
  const location = useLocation();
  const settings = useSiteSettings();
  const { menuOpen } = usePublicChrome();
  const t = copy[language];
  const publicPath = stripLanguagePrefix(location.pathname);
  const suppressPrompt = publicPath === "/contact" || publicPath === "/quote";
  const [isDesktop, setIsDesktop] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [contentOverlapZone, setContentOverlapZone] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop((current) => current === desktopQuery.matches ? current : desktopQuery.matches);
    update();
    desktopQuery.addEventListener("change", update);
    return () => desktopQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const dismissedAt = Number(readBrowserPreference(CTA_DISMISSED_KEY) || 0);
    const dismissedRecently = Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
    if (dismissedRecently) {
      return;
    }

    const reveal = () => setShowPrompt(true);
    const timer = window.setTimeout(reveal, 18000);

    let frame = 0;
    const checkScrollProgress = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        return;
      }
      if (window.scrollY / scrollable > 0.3) {
        reveal();
      }
    };
    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(checkScrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop || suppressPrompt || !("IntersectionObserver" in window)) {
      setContentOverlapZone(false);
      return;
    }

    const visibleTargets = new Set<Element>();
    const update = () => {
      const shouldHide = visibleTargets.size > 0;
      setContentOverlapZone((current) => current === shouldHide ? current : shouldHide);
    };
    const createObserver = (rootMargin: string) => new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleTargets.add(entry.target);
        else visibleTargets.delete(entry.target);
      }
      update();
    }, { rootMargin, threshold: 0 });
    const contentObserver = createObserver("-120px 0px 80px 0px");
    const footerObserver = createObserver("-120px 0px 260px 0px");

    document.querySelectorAll(".projects-showcase-section, .material-directory-grid").forEach((target) => contentObserver.observe(target));
    document.querySelectorAll(".site-footer-art, footer").forEach((target) => footerObserver.observe(target));

    return () => {
      contentObserver.disconnect();
      footerObserver.disconnect();
      visibleTargets.clear();
    };
  }, [isDesktop, location.pathname, suppressPrompt]);

  const dismissPrompt = () => {
    writeBrowserPreference(CTA_DISMISSED_KEY, String(Date.now()));
    setShowPrompt(false);
  };

  if (!isDesktop || menuOpen || contentOverlapZone) {
    return null;
  }

  return (
    <div
      className="desktop-floating-cta pointer-events-none fixed bottom-6 right-6 hidden w-[330px] lg:block"
      style={{ zIndex: PUBLIC_CHROME_Z.desktopFloating }}
    >
      <div className="pointer-events-auto">
        {showPrompt && !suppressPrompt ? (
          <AdaptiveSurface
            background="hsl(var(--surface-dark) / 0.94)"
            foreground="hsl(var(--surface-dark-foreground))"
            className="desktop-floating-cta__prompt relative mb-3 animate-fade-up rounded-card-lg border border-white/12 p-4 shadow-luxury backdrop-blur-md"
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
                href={settings.whatsapp_url()}
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
          href={settings.whatsapp_url()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.whatsappAria}
          className="desktop-floating-cta__button ml-auto flex w-fit items-center justify-center rounded-full bg-whatsapp px-5 py-3 text-whatsapp-foreground shadow-luxury transition-all duration-300 hover:scale-[1.02]"
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
