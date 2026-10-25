import { scrollWindowToSmoothly } from "@/lib/instantScroll";
import { PUBLIC_MOTION, prefersReducedMotion } from "@/lib/publicMotion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import LanguageSelector from "@/components/LanguageSelector";
import SmartImage from "@/components/SmartImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import TikTokIcon from "@/components/TikTokIcon";
import RednoteIcon from "@/components/RednoteIcon";
import WeChatIcon from "@/components/WeChatIcon";
import type { ContactEntryPanelProps } from "@/components/ContactEntryPanel";
import { contactEntryText } from "@/i18n/contactEntryText";
import { wechatContactText } from "@/i18n/wechatContactText";
import {
  primaryPublicNavigationItems,
  publicNavigationGroups,
  type PublicNavGroupKey,
  type PublicNavItem,
} from "@/config/publicNavigation";
import { furnitureShopText } from "@/i18n/furnitureShopText";
import { usePublicChrome } from "@/contexts/PublicChromeContext";
import { useSiteSettings, useSiteSettingsReadiness } from "@/hooks/useSiteSettings";
import { usePublishedCtaBlock } from "@/hooks/usePublishedCtaBlock";
import { useLanguage } from "@/i18n/LanguageContext";
import { footerCopy, footerLocationLinks } from "@/i18n/footerText";
import { getNavigationLabel, navbarText } from "@/i18n/navbarText";
import { schemeAChromeText } from "@/i18n/schemeAChromeText";
import { getChineseBrandLine, getHeaderChineseBrandName, getPublicSiteName } from "@/i18n/brandIdentity";
import { stripLanguagePrefix, type Language } from "@/i18n/routes";
import { languageTag } from "@/i18n/languageDetection";
import { trackCtaClick } from "@/lib/analytics";
import { chooseAdaptiveTextColor, compositeColors, getImageSourcePoint, parseCssColor, type RgbColor } from "@/lib/colorContrast";
import { buildGoogleMapOpenUrl } from "@/lib/mapUrls";
import { QUOTE_FORM_PATH } from "@/lib/quoteFormTarget";
import { isSafeContentUrl } from "@/lib/safeContentUrl";
import { addCacheBuster, type SiteSettings } from "@/lib/siteSettingsApi";
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

const BrandMark = ({ logo, name, displayName, language }: { logo: string; name: string; displayName: string | null; language: Language }) => {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const displayedLogo = failedLogo === logo ? logoFallback : logo;
  const builtInLogo = displayedLogo === logoFallback
    || /^(?:https?:\/\/[^/]+)?\/logo-flashcast(?:-20260605)?\.(?:png|webp)(?:[?#].*)?$/i.test(displayedLogo);
  const showLocalizedName = Boolean(displayName && builtInLogo);
  return (
    <LocalizedLink className="scheme-a-chrome__brand" to="/" aria-label={showLocalizedName && displayName ? language === "zh" ? `${displayName} ${getPublicSiteName({ company_name: name })}` : displayName : name}>
      <span className={`scheme-a-chrome__wordmark${showLocalizedName ? " scheme-a-chrome__wordmark--localized" : ""}`} data-builtin-logo={builtInLogo || undefined}>
        <span className={showLocalizedName ? "scheme-a-chrome__symbol" : undefined} aria-hidden="true">
          <SmartImage
            src={displayedLogo}
            alt=""
            width={190}
            height={52}
            loading="eager"
            onError={() => { if (failedLogo !== logo) setFailedLogo(logo); }}
          />
        </span>
        {showLocalizedName && <span className="scheme-a-chrome__wordmark-copy"><span className="scheme-a-chrome__wordmark-name" lang={languageTag(language)}>{displayName}</span>{language === "zh" && <span className="scheme-a-chrome__wordmark-english" lang="en">{getPublicSiteName({ company_name: name })}</span>}</span>}
      </span>
      {!showLocalizedName && <span className="sr-only">{name}</span>}
    </LocalizedLink>
  );
};

const getGroupLabel = (key: PublicNavGroupKey, navText: (typeof navbarText)[Language]) => ({
  spaces: navText.spacesGroup,
  services: navText.servicesGroup,
  studio: navText.studioGroup,
  contact: navText.contactGroup,
})[key];

const SchemeASocialLinks = ({ settings, placement }: {
  settings: Pick<SiteSettings, "facebook_url" | "instagram_url" | "tiktok_url" | "xiaohongshu_url">;
  placement: "directory" | "footer";
}) => {
  const { language } = useLanguage();
  const t = schemeAChromeText[language];
  const profiles = [
    { brand: "facebook", url: safeSocialProfileUrl(settings.facebook_url, "facebook"), label: "Facebook", accessibleLabel: "Facebook", Icon: Facebook },
    { brand: "instagram", url: safeSocialProfileUrl(settings.instagram_url, "instagram"), label: "Instagram", accessibleLabel: "Instagram", Icon: Instagram },
    { brand: "tiktok", url: safeSocialProfileUrl(settings.tiktok_url, "tiktok"), label: "TikTok", accessibleLabel: "TikTok", Icon: TikTokIcon },
    { brand: "rednote", url: safeSocialProfileUrl(settings.xiaohongshu_url, "xiaohongshu"), label: t.xiaohongshuShort, accessibleLabel: t.xiaohongshu, Icon: RednoteIcon },
  ].filter(({ url }) => url);
  if (profiles.length === 0) return null;
  const classes = placement === "directory"
    ? { group: "scheme-a-directory__social-group", heading: "scheme-a-directory__social-heading", links: "scheme-a-directory__socials" }
    : { group: "scheme-a-footer__social-group", heading: "scheme-a-footer__social-heading", links: "scheme-a-footer__socials" };

  return (
    <div className={classes.group} role="group" aria-label={t.followUs}>
      <div className={classes.heading}>
        <h3>{t.followUs}</h3>
        {placement === "directory" ? <span>{t.socialProfiles}</span> : null}
      </div>
      <div className={classes.links}>
        {profiles.map(({ brand, url, label, accessibleLabel, Icon }) => (
          <a key={brand} data-brand={brand} href={url} target="_blank" rel="noopener noreferrer" aria-label={accessibleLabel}>
            <span className="scheme-a-social-icon" aria-hidden="true"><Icon /></span>
            <span>{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export const SchemeANavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const translate = (key: string) => getNavigationLabel(key, language);
  const t = schemeAChromeText[language];
  const navText = navbarText[language];
  const contactText = contactEntryText[language];
  const wechatText = wechatContactText[language];
  const [ContactPanel, setContactPanel] = useState<ComponentType<ContactEntryPanelProps> | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactLoadError, setContactLoadError] = useState(false);
  const [contactOwner] = useState(() => crypto.randomUUID());
  const contactOpening = useRef(false);
  const contactClosing = useRef(false);
  const contactOpen = (location.state as { contactEntry?: string } | null)?.contactEntry === contactOwner;
  useEffect(() => { if (!contactOpen) contactClosing.current = false; }, [contactOpen]);
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
  const headerBrandName = getHeaderChineseBrandName(settings)
    ? language === "zh" ? getHeaderChineseBrandName(settings) : getPublicSiteName(settings)
    : null;
  const publicPath = stripLanguagePrefix(location.pathname);
  const furnitureMessage = publicPath === "/furniture" || publicPath.startsWith("/furniture/")
    ? pageWhatsAppMessage || furnitureShopText[language].generalEnquiryMessage
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
    const imageStyles = new WeakMap<HTMLImageElement, { objectFit: string; objectPosition: string }>();
    const targetBackgrounds = new WeakMap<HTMLElement, RgbColor | null>();
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
        const label = target.querySelector<HTMLElement>("img, span") || target;
        const rect = label.getBoundingClientRect();
        if (!rect.width || !rect.height) { clear(target); return; }
        // Standard split heroes sit below the header and keep the regular skin color.
        const img = images.find((candidate) => {
          const box = candidate.getBoundingClientRect();
          return rect.left >= box.left && rect.right <= box.right && rect.top >= box.top && rect.bottom <= box.bottom;
        });
        if (!img) { clear(target); return; }
        const box = img.getBoundingClientRect();
        let imageStyle = imageStyles.get(img);
        if (!imageStyle) {
          const computed = getComputedStyle(img);
          imageStyle = { objectFit: computed.objectFit, objectPosition: computed.objectPosition };
          imageStyles.set(img, imageStyle);
        }
        let background = targetBackgrounds.get(target);
        if (background === undefined) {
          background = parseCssColor(getComputedStyle(target).backgroundColor);
          targetBackgrounds.set(target, background);
        }
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

  const openWechatContact = async () => {
    if (contactOpening.current) return;
    contactOpening.current = true;
    setContactLoading(true);
    setContactLoadError(false);
    try {
      const { default: Panel } = await import("@/components/ContactEntryPanel");
      // The visitor may have closed the directory while the shared panel loaded.
      if (menuRef.current?.dataset.state !== "open") return;
      setContactPanel(() => Panel);
      closeDirectory();
      void navigate(`${location.pathname}${location.search}${location.hash}`, {
        state: { ...location.state, contactEntry: contactOwner }, preventScrollReset: true,
      });
      trackCtaClick("wechat_open", "scheme_a_menu");
    } catch {
      setContactLoadError(true);
    } finally {
      contactOpening.current = false;
      setContactLoading(false);
    }
  };

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
    let scrollRaf = 0;
    const scheduleUpdateScrolled = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        updateScrolled();
      });
    };
    window.addEventListener("scroll", scheduleUpdateScrolled, { passive: true });
    window.addEventListener("resize", scheduleUpdateScrolled, { passive: true });
    return () => {
      observer?.disconnect();
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", scheduleUpdateScrolled);
      window.removeEventListener("resize", scheduleUpdateScrolled);
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
          <BrandMark logo={logo} name={companyName} displayName={headerBrandName} language={language} />
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
            <div className="scheme-a-chrome__contacts">
              <a
                className="scheme-a-chrome__contact scheme-a-chrome__contact--whatsapp"
                href={settings.whatsapp_url(furnitureMessage)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.whatsapp}
                title={t.whatsapp}
                onClick={() => trackCtaClick("whatsapp", "scheme_a_header", { destination: "whatsapp" })}
              >
                <WhatsAppIcon />
              </a>
              <a
                className="scheme-a-chrome__contact scheme-a-chrome__contact--phone"
                href={settings.phone_href}
                aria-label={t.call}
                title={t.call}
                onClick={() => trackCtaClick("phone", "scheme_a_header", { destination: "phone" })}
              >
                <Phone aria-hidden="true" />
              </a>
            </div>
            <LocalizedLink className="scheme-a-chrome__quote" to={QUOTE_FORM_PATH} onClick={() => trackCtaClick("quote", "scheme_a_header", { destination: QUOTE_FORM_PATH })}>
              {t.quote}<ArrowUpRight aria-hidden="true" />
            </LocalizedLink>
            <LanguageSelector />
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
        <div className="scheme-a-directory__bottom">
          <SchemeASocialLinks settings={settings} placement="directory" />
          <div className="scheme-a-directory__foot">
          <a href={settings.phone_href} onClick={() => trackCtaClick("phone", "scheme_a_menu", { destination: "phone" })}><Phone aria-hidden="true" />{t.call}</a>
          <a className="is-whatsapp" href={settings.whatsapp_url(furnitureMessage)} target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick("whatsapp", "scheme_a_menu", { destination: "whatsapp" })}><WhatsAppIcon />{t.whatsapp}</a>
          <button type="button" className="is-wechat" aria-haspopup="dialog" aria-busy={contactLoading || undefined} disabled={contactLoading} onClick={() => void openWechatContact()}>
            <WeChatIcon /><span aria-live="polite">{contactLoading ? contactText.loading : contactLoadError ? contactText.loadError : wechatText.wechat}</span>
          </button>
          <LocalizedLink className="is-quote" to={QUOTE_FORM_PATH}>{t.quote}<ArrowUpRight aria-hidden="true" /></LocalizedLink>
          </div>
        </div>
      </div>

      {contactOpen && !menuOpen && ContactPanel && <ContactPanel
        initialContact="wechat"
        message={pageWhatsAppMessage || contactText.message(contactText.genericService)}
        onClose={() => {
          if (contactClosing.current) return;
          contactClosing.current = true;
          void navigate(-1);
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          [desktopTriggerRef.current, compactTriggerRef.current]
            .find((trigger) => trigger && trigger.getClientRects().length > 0)?.focus({ preventScroll: true });
        }}
      />}

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
  const hasManagedInvitation = isHome || publicPath === "/about";
  const publishedInvitation = usePublishedCtaBlock(language, isHome ? "home_final" : "about_final", {
    enabled: hasManagedInvitation && !hasPageConsultation,
  });
  // A disabled query may retain another page's cached data. Only these two
  // routes own the corresponding CMS invitation; every other page keeps its copy.
  const invitation = hasManagedInvitation ? publishedInvitation.data : null;
  const furnitureMessage = publicPath === "/furniture" || publicPath.startsWith("/furniture/")
    ? pageWhatsAppMessage || furnitureShopText[language].generalEnquiryMessage
    : undefined;
  const title = invitation?.title || t.footerTitle;
  const primaryUrl = invitation?.primary_url && isSafeContentUrl(invitation.primary_url) ? invitation.primary_url : QUOTE_FORM_PATH;
  const hasSecondaryUrl = Boolean(invitation?.secondary_url && isSafeContentUrl(invitation.secondary_url));
  const secondaryUrl = hasSecondaryUrl ? invitation!.secondary_url : settings.whatsapp_url(furnitureMessage);
  const secondaryExternal = /^(?:https?:\/\/|mailto:|tel:|\/\/)/i.test(secondaryUrl);
  const primaryName = /\/quote(?:[?#]|$)/.test(primaryUrl) ? "quote" : "cta";
  const secondaryName = /(?:wa\.me|whatsapp\.com)/i.test(secondaryUrl) ? "whatsapp" : "cta";
  const image = invitation?.image_url && isSafeContentUrl(invitation.image_url, true)
    ? invitation.image_url : "/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp";

  if (hasPageConsultation) return null;

  return (
    <section className="scheme-a-footer-prelude" data-home-section={isHome ? "cta" : undefined} data-cinematic-section>
      <div className="scheme-a-footer-prelude__frame scheme-a-frame">
        <div className="scheme-a-footer__panorama">
          <SmartImage src={image} alt={title} width={2560} height={1440} sizes="(max-width: 767px) max(100vw, 783px), (min-width: 1536px) 1440px, (min-width: 1024px) calc(100vw - 96px), 100vw" candidateWidths={[560, 720, 960, 1200, 1600, 2560]} quality={88} />
          <div className="scheme-a-footer__invitation scheme-a-frame">
            <div className="scheme-a-footer__invitation-copy">
              <p className="scheme-a-footer__kicker"><span>{t.footerKicker}</span></p>
              <h2>{title}</h2>
              <span>{invitation?.description || t.footerBody}</span>
              <div className="scheme-a-footer__invitation-actions">
                <LocalizedLink to={primaryUrl} onClick={() => trackCtaClick(primaryName, "scheme_a_footer_prelude", { destination: primaryUrl })}>{invitation?.primary_label || t.quote}<ArrowUpRight /></LocalizedLink>
                <LocalizedLink to={secondaryUrl} target={secondaryExternal ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackCtaClick(secondaryName, "scheme_a_footer_prelude", { destination: hasSecondaryUrl ? secondaryUrl : "whatsapp" })}>{secondaryName === "whatsapp" ? <WhatsAppIcon /> : <ArrowUpRight />}{invitation?.secondary_label || (hasSecondaryUrl ? getNavigationLabel("nav.contact", language) : t.whatsapp)}</LocalizedLink>
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
  const translate = (key: string) => getNavigationLabel(key, language);
  const settings = useSiteSettings();
  const t = schemeAChromeText[language];
  const footer = footerCopy[language];
  const navText = navbarText[language];
  const areas = footerLocationLinks[language];
  const chineseBrandLine = getChineseBrandLine(settings, language);

  return (
    <footer className="scheme-a-footer">
      <div className="scheme-a-footer__surface">
        <div className="scheme-a-footer__wordmark scheme-a-frame" aria-hidden="true"><span>FLASH</span><em>CAST</em></div>
        <div className="scheme-a-footer__frame scheme-a-frame">
          <div className="scheme-a-footer__grid">
            <section className="scheme-a-footer__studio">
              <p>{t.contactTitle}</p>
              <strong>{settings.company_name}</strong>
              {chineseBrandLine && <p className="scheme-a-footer__brand-names">{chineseBrandLine}</p>}
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
              <SchemeASocialLinks settings={settings} placement="footer" />
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
          <nav><LocalizedLink to="/privacy">{footer.privacy}</LocalizedLink><LocalizedLink to="/terms">{footer.terms}</LocalizedLink><LanguageSelector placement="footer" /><button type="button" onClick={() => scrollWindowToSmoothly(0)}>{t.backToTop}<ArrowUp /></button></nav>
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
