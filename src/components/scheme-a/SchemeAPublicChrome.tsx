import { scrollWindowToSmoothly } from "@/lib/instantScroll";
import { PUBLIC_MOTION, prefersReducedMotion } from "@/lib/publicMotion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowUp,
  ArrowUpRight,
  Armchair,
  BadgePercent,
  ChevronDown,
  Clock,
  Facebook,
  FolderOpen,
  Home,
  Instagram,
  Mail,
  MapPin,
  Menu,
  PackageSearch,
  Phone,
  X,
} from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import PublicContactRow from "@/components/PublicContactRow";
import { Button } from "@/components/ui/button";
import LanguageRouteLink from "@/components/LanguageRouteLink";
import SmartImage from "@/components/SmartImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import TikTokIcon from "@/components/TikTokIcon";
import RednoteIcon from "@/components/RednoteIcon";
import {
  primaryPublicNavigationItems,
  publicNavigationGroups,
  type PublicNavGroupKey,
  type PublicNavItem,
} from "@/config/publicNavigation";
import { furnitureText } from "@/i18n/furnitureText";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { useSiteSettings, useSiteSettingsReadiness } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { footerCopy, footerLocationLinks } from "@/i18n/footerText";
import { getNavigationLabel, navbarText } from "@/i18n/navbarText";
import { schemeAChromeText } from "@/i18n/schemeAText";
import { stripLanguagePrefix, switchLanguagePath } from "@/i18n/routes";
import { trackCtaClick } from "@/lib/analytics";
import { chooseAdaptiveTextColor, compositeColors, getImageSourcePoint, parseCssColor, type RgbColor } from "@/lib/colorContrast";
import { buildGoogleMapOpenUrl } from "@/lib/mapUrls";
import { QUOTE_FORM_PATH } from "@/lib/quoteContext";
import { addCacheBuster } from "@/lib/siteSettingsApi";
import { safeSocialProfileUrl } from "@/config/site";
import logoFallback from "@/assets/logo-flashcast.webp";

const isActivePath = (pathname: string, itemPath: string) => {
  const currentPath = stripLanguagePrefix(pathname);
  if (itemPath === "/") return currentPath === "/";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
};

const publicNavigationItems = publicNavigationGroups.flatMap((group) => group.items);

const footerNavigationGroups = [
  {
    titleKey: "spaceServicesTitle",
    items: publicNavigationGroups
      .filter((group) => group.key === "spaces" || group.key === "services")
      .flatMap((group) => group.items),
  },
  {
    titleKey: "brandContactTitle",
    items: publicNavigationGroups
      .filter((group) => group.key === "studio" || group.key === "contact")
      .flatMap((group) => group.items)
      .filter((item) => item.path !== "/contact"),
  },
] as const;

const getCurrentNavigationItem = (pathname: string, items: readonly PublicNavItem[] = publicNavigationItems) =>
  items.find((item) => item.path === stripLanguagePrefix(pathname))
  ?? items.find((item) => isActivePath(pathname, item.path))
  ?? items[0];

const getCurrentNavigationGroup = (pathname: string): PublicNavGroupKey =>
  publicNavigationGroups.find((group) => group.items.some((item) => isActivePath(pathname, item.path)))?.key
  ?? "services";

const BrandMark = ({ logo, name }: { logo: string; name: string }) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  return (
    <LocalizedLink className="scheme-a-chrome__brand" to="/" aria-label={name}>
      <SmartImage
        src={failedLogo === logo ? logoFallback : logo}
        alt=""
        width={190}
        height={52}
        loading="eager"
        onError={() => { if (failedLogo !== logo) setFailedLogo(logo); }}
      />
      <span className="sr-only">{name}</span>
    </LocalizedLink>
  );
};

const getGroupLabel = (key: PublicNavGroupKey, navText: typeof navbarText.zh | typeof navbarText.en) => ({
  spaces: navText.spacesGroup,
  services: navText.servicesGroup,
  studio: navText.studioGroup,
  contact: navText.contactGroup,
})[key];

const LanguageSwitch = ({
  language,
  paths,
  labels,
}: {
  language: "zh" | "en";
  paths: Record<"zh" | "en", string>;
  labels: {
    group: string;
    zh: string;
    en: string;
    zhShort: string;
    enShort: string;
  };
}) => {
  const options = [
    { code: "zh" as const, label: labels.zh, shortLabel: labels.zhShort },
    { code: "en" as const, label: labels.en, shortLabel: labels.enShort },
  ];

  return (
    <div className="scheme-a-language-switch" role="group" aria-label={labels.group}>
      {options.map((option) => {
        const active = option.code === language;
        return (
          <LanguageRouteLink
            key={option.code}
            className={`scheme-a-language-option ${active ? "is-active" : ""}`}
            to={paths[option.code]}
            targetLanguage={option.code}
            prefetchOnReady={!active}
            aria-current={active ? "true" : undefined}
            aria-label={option.label}
            lang={option.code === "zh" ? "zh-CN" : "en"}
            onClick={(event) => {
              if (active) event.preventDefault();
            }}
          >
            {option.shortLabel}
          </LanguageRouteLink>
        );
      })}
    </div>
  );
};

export const SchemeANavbar = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const translate = (key: string) => getNavigationLabel(key, language);
  const t = schemeAChromeText[language];
  const navText = navbarText[language];
  const settings = useSiteSettings();
  const settingsPending = useSiteSettingsReadiness();
  const { hasImmersiveHero, menuOpen, setMenuOpen, pageWhatsAppMessage } = usePublicChrome();
  const currentItem = getCurrentNavigationItem(location.pathname);
  const currentPrimaryItem = getCurrentNavigationItem(location.pathname, primaryPublicNavigationItems);
  const currentGroup = getCurrentNavigationGroup(location.pathname);
  const [openGroup, setOpenGroup] = useState<PublicNavGroupKey | null>(null);
  const [compactDirectory, setCompactDirectory] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const compactTriggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(0);
  const returnFocus = useRef(true);
  const logo = settings.logo_url ? addCacheBuster(settings.logo_url, settings.updated_at) : logoFallback;
  const companyName = settings.company_name || "FLASH CAST SDN. BHD.";
  const languagePaths = {
    zh: switchLanguagePath(location.pathname, "zh", location.search, location.hash),
    en: switchLanguagePath(location.pathname, "en", location.search, location.hash),
  };
  const languageLabels = {
    group: navText.switchLanguage,
    zh: navText.switchToChinese,
    en: navText.switchToEnglish,
    zhShort: navText.chineseShort,
    enShort: navText.englishShort,
  };
  const publicPath = stripLanguagePrefix(location.pathname);
  const furnitureMessage = publicPath === "/furniture" || publicPath.startsWith("/furniture/")
    ? pageWhatsAppMessage || furnitureText[language].generalEnquiryMessage
    : undefined;
  const overlay = hasImmersiveHero && !scrolled && !menuOpen;

  useLayoutEffect(() => {
    const header = headerRef.current;
    const main = document.getElementById("main-content");
    if (!overlay || !header || !main || window.matchMedia("(forced-colors: active)").matches) return;
    const targets = Array.from(header.querySelectorAll<HTMLElement>(
      ".scheme-a-chrome__brand",
    ));
    const preferred = getComputedStyle(header).color;
    const previous = new Map<HTMLElement, string>();
    const pixels = new WeakMap<HTMLImageElement, { source: string; data: ImageData | null }>();
    let frame = 0;
    let disposed = false;
    const clear = (target: HTMLElement) => {
      delete target.dataset.headerContrast;
      delete target.dataset.headerOutline;
      previous.delete(target);
    };
    const readPixels = (img: HTMLImageElement) => {
      const source = `${img.currentSrc}:${img.naturalWidth}:${img.naturalHeight}`;
      const cached = pixels.get(img);
      if (cached?.source === source) return cached.data;
      let data: ImageData | null = null;
      try {
        // Sample an already decoded image; no extra request or full-size canvas.
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(img, 0, 0, canvas.width, canvas.height);
          data = context.getImageData(0, 0, canvas.width, canvas.height);
        }
      } catch {
        // Cross-origin or unavailable logo pixels keep the authored color plus a glyph outline.
      }
      pixels.set(img, { source, data });
      return data;
    };
    const update = () => {
      frame = 0;
      if (disposed) return;
      const images = Array.from(main.querySelectorAll<HTMLImageElement>(
        '[data-immersive-hero="true"] img:not(.smart-image-previous)',
      )).filter((img) => img.complete && img.naturalWidth > 0 && getComputedStyle(img).visibility !== "hidden");
      targets.forEach((target) => {
        if (!target.getClientRects().length) { clear(target); return; }
        const label = target.querySelector("img, span") || target;
        const range = document.createRange();
        range.selectNodeContents(label);
        const rect = label instanceof HTMLImageElement ? label.getBoundingClientRect() : range.getBoundingClientRect();
        if (!rect.width || !rect.height) { clear(target); return; }
        // Standard split heroes sit below the header and keep the regular skin color.
        const img = images.find((candidate) => {
          const box = candidate.getBoundingClientRect();
          return rect.left >= box.left && rect.right <= box.right && rect.top >= box.top && rect.bottom <= box.bottom;
        });
        if (!img) { clear(target); return; }
        const box = img.getBoundingClientRect();
        const imageStyle = getComputedStyle(img);
        const background = parseCssColor(getComputedStyle(target).backgroundColor);
        const data = readPixels(img);
        const samples: (RgbColor | null)[] = [];
        for (const x of [0.15, 0.5, 0.85]) {
          for (const y of [0.2, 0.5, 0.8]) {
            const point = getImageSourcePoint({
              width: box.width, height: box.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
              fit: imageStyle.objectFit, position: imageStyle.objectPosition,
            }, rect.left + rect.width * x - box.left, rect.top + rect.height * y - box.top);
            if (!data || !point) { samples.push(null); continue; }
            const column = Math.min(data.width - 1, Math.floor(point.x / img.naturalWidth * data.width));
            const row = Math.min(data.height - 1, Math.floor(point.y / img.naturalHeight * data.height));
            const offset = (row * data.width + column) * 4;
            const pixel = { r: data.data[offset], g: data.data[offset + 1], b: data.data[offset + 2], a: data.data[offset + 3] / 255 };
            samples.push(background ? compositeColors(background, pixel) : null);
          }
        }
        const result = chooseAdaptiveTextColor(samples, preferred, previous.get(target));
        previous.set(target, result.color);
        if (result.color === "#ffffff") target.dataset.headerContrast = "light";
        else if (result.color === "#000000") target.dataset.headerContrast = "dark";
        else delete target.dataset.headerContrast;
        if (result.outline) target.dataset.headerOutline = "true";
        else delete target.dataset.headerOutline;
      });
    };
    const schedule = () => {
      if (!disposed && !frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "srcset", "data-image-state"] });
    const resizeObserver = new ResizeObserver(schedule);
    targets.forEach((target) => resizeObserver.observe(target));
    main.addEventListener("load", schedule, true);
    main.addEventListener("error", schedule, true);
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    void document.fonts.ready.then(schedule);
    update();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      main.removeEventListener("load", schedule, true);
      main.removeEventListener("error", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      targets.forEach(clear);
    };
  }, [overlay, location.pathname, language]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateLayout = () => setCompactDirectory(media.matches);
    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  const closeDirectory = useCallback((restoreFocus = true) => {
    returnFocus.current = restoreFocus;
    window.clearTimeout(closeTimer.current);
    setClosing(true);
    const finish = () => {
      const trigger = [desktopTriggerRef.current, compactTriggerRef.current]
        .find((candidate) => candidate && candidate.getClientRects().length > 0);
      // The destination is still inert while the menu is open. Move focus to
      // available chrome before hiding the dialog, then hand it to ready content.
      if (returnFocus.current || menuRef.current?.contains(document.activeElement)) trigger?.focus({ preventScroll: true });
      setMenuOpen(false);
      setClosing(false);
    };
    closeTimer.current = window.setTimeout(finish, prefersReducedMotion() ? 0 : PUBLIC_MOTION.menuClose);
  }, [setMenuOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (menuOpen || returnFocus.current) return;
    const focusMain = () => {
      if (returnFocus.current) return;
      const main = document.getElementById("main-content");
      if (!main || document.documentElement.dataset.publicRouteLoading || main.closest('[inert], [aria-hidden="true"]')) return;
      const active = document.activeElement;
      // Preserve a newer focus choice made while the destination was loading.
      if (active === desktopTriggerRef.current || active === compactTriggerRef.current || active === document.body) {
        main.focus({ preventScroll: true });
      }
      returnFocus.current = true;
    };
    const frame = window.requestAnimationFrame(focusMain);
    window.addEventListener("public-route-ready", focusMain);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("public-route-ready", focusMain);
    };
  }, [menuOpen]);

  const toggleDirectory = useCallback(() => {
    if (menuOpen) {
      closeDirectory();
      return;
    }

    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpenGroup(currentGroup);
    setMenuOpen(true);
  }, [closeDirectory, currentGroup, menuOpen, setMenuOpen]);

  useEffect(() => {
    if (menuRef.current && menuRef.current.dataset.state !== "closed") closeDirectory(false);
  }, [currentItem, location.pathname, location.search, closeDirectory]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasImmersiveHero) {
      setScrolled(true);
      return;
    }
    if (!sentinel) {
      setScrolled(false);
      return;
    }

    // A hidden tab or viewport resize can report a non-intersecting entry
    // while the page is still at the top. Keep the existing sentinel boundary,
    // but derive the chrome state from its actual position.
    const updateScrolled = () => setScrolled(window.scrollY > 0 && sentinel.getBoundingClientRect().bottom <= 0);
    updateScrolled();
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(updateScrolled, { threshold: 0 }) : null;
    observer?.observe(sentinel);
    window.addEventListener("scroll", updateScrolled, { passive: true });
    window.addEventListener("resize", updateScrolled, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", updateScrolled);
      window.removeEventListener("resize", updateScrolled);
    };
  }, [hasImmersiveHero, publicPath]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDirectory();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || [])
        .filter((item) => item.tabIndex >= 0 && item.getClientRects().length > 0 && getComputedStyle(item).visibility !== "hidden");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKey);
    };
  }, [closeDirectory, menuOpen]);

  return (
    <>
      <span ref={sentinelRef} className="scheme-a-chrome__sentinel" aria-hidden="true" />
      <header ref={headerRef} className={`scheme-a-chrome is-fixed ${overlay ? "is-overlay" : "is-solid"}`} data-route-pending={settingsPending || undefined}>
        <div className="scheme-a-chrome__bar scheme-a-frame">
          <BrandMark logo={logo} name={companyName} />
          <nav className="scheme-a-chrome__primary" aria-label={t.mainNavigation}>
            {primaryPublicNavigationItems.map((item) => (
              <LocalizedLink key={item.path} to={item.path} aria-current={isActivePath(location.pathname, currentPrimaryItem.path) && currentPrimaryItem.path === item.path ? "page" : undefined}>
                {translate(item.labelKey)}
              </LocalizedLink>
            ))}
            <button ref={desktopTriggerRef} className="scheme-a-chrome__nav-more" type="button" aria-label={t.openMenu} aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="scheme-a-directory" onClick={toggleDirectory}>
              <span>{navText.more}</span>
              <Menu aria-hidden="true" />
            </button>
          </nav>
          <div className="scheme-a-chrome__actions">
            <LocalizedLink className="scheme-a-chrome__quote" to={QUOTE_FORM_PATH} onClick={() => trackCtaClick("quote", "scheme_a_header", { destination: QUOTE_FORM_PATH })}>
              {t.quote}<ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
            <LanguageSwitch language={language} paths={languagePaths} labels={languageLabels} />
            <button ref={compactTriggerRef} className="scheme-a-chrome__menu-trigger scheme-a-chrome__menu-trigger--compact" type="button" aria-label={t.openMenu} aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="scheme-a-directory" onClick={toggleDirectory}>
              <span className="scheme-a-chrome__menu-label">{navText.more}</span>
              <Menu aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      {!hasImmersiveHero ? <div className="scheme-a-chrome__spacer" aria-hidden="true" /> : null}

      <div
        className="scheme-a-directory-backdrop"
        data-state={!menuOpen ? "closed" : closing ? "closing" : "open"}
        aria-hidden="true"
        onClick={() => closeDirectory()}
      />
      <div
        ref={menuRef}
        id="scheme-a-directory"
        className="scheme-a-directory"
        data-state={!menuOpen ? "closed" : closing ? "closing" : "open"}
        aria-hidden={!menuOpen || undefined}
        role="dialog"
        aria-modal={menuOpen || undefined}
        aria-label={t.directory}
      >
        <div className="scheme-a-directory__head">
          <span>{t.directory}</span>
          <button ref={closeRef} className="scheme-a-directory__close" type="button" aria-label={t.closeMenu} onClick={() => closeDirectory()}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="scheme-a-directory__body">
          <nav className="scheme-a-directory__groups" aria-label={t.directory}>
            {publicNavigationGroups.map((group) => {
              const expanded = !compactDirectory || openGroup === group.key;
              return (
                <section key={group.key} data-open={expanded ? "true" : "false"}>
                  {compactDirectory ? (
                    <button
                      type="button"
                      className="scheme-a-directory__group-toggle"
                      aria-expanded={expanded}
                      aria-controls={`scheme-a-directory-group-${group.key}`}
                      onClick={() => setOpenGroup((value) => value === group.key ? null : group.key)}
                    >
                      <span>{getGroupLabel(group.key, navText)}</span>
                      <ChevronDown aria-hidden="true" />
                    </button>
                  ) : <h3 className="scheme-a-directory__group-title">{getGroupLabel(group.key, navText)}</h3>}
                  <div
                    id={`scheme-a-directory-group-${group.key}`}
                    className="scheme-a-directory__group-panel"
                    aria-hidden={!expanded}
                  >
                    <div className="scheme-a-directory__group-content">
                      <ul>
                        {group.items.map((item) => (
                          <li key={item.path}>
                            <LocalizedLink
                              to={item.path === "/quote" ? QUOTE_FORM_PATH : item.path}
                              aria-current={isActivePath(location.pathname, item.path) && currentItem.path === item.path ? "page" : undefined}
                              tabIndex={expanded ? undefined : -1}
                              onClick={(event) => {
                                if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) closeDirectory(false);
                              }}
                            >
                              <span>{translate(item.labelKey)}</span>
                              {isActivePath(location.pathname, item.path) && currentItem.path === item.path
                                ? <span className="scheme-a-directory__current">{navText.currentPageBadge}</span>
                                : <ArrowUpRight aria-hidden="true" />}
                            </LocalizedLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              );
            })}
          </nav>
        </div>
        <div className="scheme-a-directory__foot">
          <a href={settings.phone_href} onClick={() => trackCtaClick("phone", "scheme_a_menu", { destination: "phone" })}><Phone aria-hidden="true" />{t.call}</a>
          <a className="is-whatsapp" href={settings.whatsapp_url(furnitureMessage)} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "scheme_a_menu", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
          <LocalizedLink className="is-quote" to={QUOTE_FORM_PATH}>{t.quote}<ArrowUpRight aria-hidden="true" /></LocalizedLink>
        </div>
      </div>

    </>
  );
};

export const SchemeAFooterPrelude = () => {
  const { hasPageConsultation, pageWhatsAppMessage } = usePublicChrome();
  const { language } = useLanguage();
  const location = useLocation();
  const settings = useSiteSettings();
  const t = schemeAChromeText[language];
  const publicPath = stripLanguagePrefix(location.pathname);
  const isHome = publicPath === "/";
  const furnitureMessage = publicPath === "/furniture" || publicPath.startsWith("/furniture/")
    ? pageWhatsAppMessage || furnitureText[language].generalEnquiryMessage
    : undefined;

  if (hasPageConsultation) return null;

  return (
    <section className="scheme-a-footer-prelude" data-home-section={isHome ? "cta" : undefined} data-cinematic-section>
      <div className="scheme-a-footer-prelude__frame scheme-a-frame">
        <div className="scheme-a-footer__panorama">
          <SmartImage src="/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp" alt={t.footerTitle} width={2560} height={1440} sizes="(max-width: 767px) max(100vw, 783px), (min-width: 1536px) 1440px, (min-width: 1024px) calc(100vw - 96px), 100vw" candidateWidths={[560, 720, 960, 1200, 1600, 2560]} quality={88} />
          <div className="scheme-a-footer__invitation scheme-a-frame">
            <div className="scheme-a-footer__invitation-copy">
              <p className="scheme-a-footer__kicker"><span>{t.footerKicker}</span></p>
              <h2>{t.footerTitle}</h2>
              <span>{t.footerBody}</span>
              <div className="scheme-a-footer__invitation-actions">
                <LocalizedLink to={QUOTE_FORM_PATH} onClick={() => trackCtaClick("quote", "scheme_a_footer_prelude", { destination: QUOTE_FORM_PATH })}>{t.quote}<ArrowUpRight /></LocalizedLink>
                <a href={settings.whatsapp_url(furnitureMessage)} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "scheme_a_footer_prelude", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const SchemeAFooter = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const translate = (key: string) => getNavigationLabel(key, language);
  const settings = useSiteSettings();
  const instagramUrl = safeSocialProfileUrl(settings.instagram_url, "instagram");
  const facebookUrl = safeSocialProfileUrl(settings.facebook_url, "facebook");
  const tiktokUrl = safeSocialProfileUrl(settings.tiktok_url, "tiktok");
  const xiaohongshuUrl = safeSocialProfileUrl(settings.xiaohongshu_url, "xiaohongshu");
  const t = schemeAChromeText[language];
  const footer = footerCopy[language];
  const socialProfiles = [
    { url: facebookUrl, label: "Facebook", accessibleLabel: "Facebook", Icon: Facebook },
    { url: instagramUrl, label: "Instagram", accessibleLabel: "Instagram", Icon: Instagram },
    { url: tiktokUrl, label: "TikTok", accessibleLabel: "TikTok", Icon: TikTokIcon },
    { url: xiaohongshuUrl, label: t.xiaohongshuShort, accessibleLabel: t.xiaohongshu, Icon: RednoteIcon },
  ].filter(({ url }) => url);
  const navText = navbarText[language];
  const areas = footerLocationLinks[language];
  const nextLanguage = language === "zh" ? "en" : "zh";
  const languagePath = switchLanguagePath(location.pathname, nextLanguage, location.search, location.hash);

  return (
    <footer className="scheme-a-footer">
      <div className="scheme-a-footer__surface">
        <div className="scheme-a-footer__wordmark scheme-a-frame" aria-hidden="true"><span>FLASH</span><em>CAST</em></div>
        <div className="scheme-a-footer__frame scheme-a-frame">
          <div className="scheme-a-footer__grid">
            <section className="scheme-a-footer__studio">
              <p>{t.contactTitle}</p>
              <strong>{settings.company_name}</strong>
              <div className="public-contact-list">
                <address>
                  <PublicContactRow icon={<MapPin />} value={settings.address} action={footer.openMap} asChild>
                    <a href={buildGoogleMapOpenUrl(settings.address, settings.map_latitude, settings.map_longitude)} target="_blank" rel="noopener noreferrer" />
                  </PublicContactRow>
                </address>
                <PublicContactRow icon={<Phone />} value={settings.phone_display} action={footer.callAction} asChild>
                  <a href={settings.phone_href} />
                </PublicContactRow>
                <PublicContactRow icon={<Mail />} value={settings.email} action={footer.emailAction} asChild>
                  <a href={`mailto:${settings.email}`} />
                </PublicContactRow>
                <div className="scheme-a-footer__appointment">
                  <PublicContactRow icon={<Clock />} value={footer.hours} />
                  <Button variant="outline" size="sm" asChild className="scheme-a-footer__contact-entry">
                    <LocalizedLink to="/contact">{translate("nav.contact")}<ArrowUpRight aria-hidden="true" /></LocalizedLink>
                  </Button>
                </div>
              </div>
              {socialProfiles.length > 0 ? <div className="scheme-a-footer__social-group">
                <h3>{t.followUs}</h3>
                <div className="scheme-a-footer__socials">
                  {socialProfiles.map(({ url, label, accessibleLabel, Icon }) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              </div> : null}
            </section>
            <nav className="scheme-a-footer__directory" aria-label={t.navigationTitle}>
              {footerNavigationGroups.map((group) => (
                <section key={group.titleKey}>
                  <p>{footer[group.titleKey]}</p>
                  {group.items.map((item) => <LocalizedLink key={item.path} to={item.path}>{translate(item.labelKey)}<ArrowUpRight aria-hidden="true" /></LocalizedLink>)}
                </section>
              ))}
            </nav>
            <nav className="scheme-a-footer__mobile-directory" aria-label={t.navigationTitle}>
              {publicNavigationGroups.map((group) => (
                <details key={group.key}>
                  <summary><span>{getGroupLabel(group.key, navText)}</span><ChevronDown aria-hidden="true" /></summary>
                  <div>{group.items.map((item) => <LocalizedLink key={item.path} to={item.path}>{translate(item.labelKey)}<ArrowUpRight /></LocalizedLink>)}</div>
                </details>
              ))}
            </nav>
            <section className="scheme-a-footer__areas">
              <p>{t.areasTitle}</p>
              <div className="scheme-a-footer__area-links">{areas.map((area) => <LocalizedLink key={area.slug} to={`/locations/${area.slug}`}>{area.name}</LocalizedLink>)}</div>
              <small className="scheme-a-footer__area-summary">{footer.areasSummary}</small>
            </section>
          </div>
        </div>
        <div className="scheme-a-footer__legal scheme-a-frame">
          <span>{t.copyright} {footer.rights}</span>
          <nav><LocalizedLink to="/privacy">{footer.privacy}</LocalizedLink><LocalizedLink to="/terms">{footer.terms}</LocalizedLink><LanguageRouteLink to={languagePath} targetLanguage={nextLanguage}>{t.language}: {nextLanguage === "zh" ? "中文" : "EN"}</LanguageRouteLink><button type="button" onClick={() => scrollWindowToSmoothly(0)}>{t.backToTop}<ArrowUp /></button></nav>
        </div>
      </div>
    </footer>
  );
};

export const SchemeAMobileDock = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const t = schemeAChromeText[language];
  const items = [
    { path: "/", label: t.dockHome, icon: Home },
    { path: "/furniture", label: t.dockFurniture, icon: Armchair },
    { path: "/projects", label: t.dockProjects, icon: FolderOpen },
    { path: "/materials", label: t.dockMaterials, icon: PackageSearch },
    { path: "/promotions", label: t.dockPromotions, icon: BadgePercent },
    { path: "/contact", label: t.dockContact, icon: Mail },
  ];
  return <nav className="scheme-a-mobile-dock" aria-label={t.mainNavigation}>{items.map((item) => <LocalizedLink key={item.path} to={item.path} aria-current={isActivePath(location.pathname, item.path) ? "page" : undefined}><item.icon aria-hidden="true" /><span>{item.label}</span></LocalizedLink>)}</nav>;
};
