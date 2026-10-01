import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLanguage } from "@/i18n/LanguageContext";
import { stripLanguagePrefix } from "@/i18n/routes";
import { furnitureText } from "@/i18n/furnitureText";
import { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export default function FurnitureFloatingLink() {
  const { language } = useLanguage();
  const floatingRef = useRef<HTMLAnchorElement>(null);
  const { pathname } = useLocation();
  const [discover, setDiscover] = useState(false);
  useEffect(() => {
    let timer = 0;
    const start = () => {
      if (timer) return;
      setDiscover(true);
      timer = window.setTimeout(() => setDiscover(false), 2400);
    };
    if (document.documentElement.dataset.publicRouteLoading !== "true") start();
    window.addEventListener("public-route-ready", start, { once: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("public-route-ready", start); };
  }, []);
  const path = stripLanguagePrefix(pathname);
  const isFurniturePage = path === "/furniture" || path.startsWith("/furniture/");
  useEffect(() => {
    const floating = floatingRef.current;
    if (!floating || !isFurniturePage) return;
    let frame = 0;
    const gap = 8;
    const avoidFurnitureContent = () => {
      frame = 0;
      // A narrow list has images on the left and product facts on the right.
      // Keep the complete shop label, wrapping it to fit that image column.
      const compact = window.innerWidth < 540;
      floating.style.width = compact ? "136px" : "";
      floating.style.minWidth = compact ? "136px" : "";
      floating.style.whiteSpace = compact ? "normal" : "";
      floating.style.padding = compact ? "0.5rem" : "";
      floating.style.gap = compact ? "0.375rem" : "";
      floating.style.fontSize = compact ? "0.85rem" : "";
      const width = floating.offsetWidth;
      const height = floating.offsetHeight;
      if (!width || !height) return;
      // Use the CSS anchor as the starting point each time, not the previous
      // translated rectangle. This prevents drift while the user scrolls.
      const style = getComputedStyle(floating);
      const anchorLeft = window.innerWidth - Number.parseFloat(style.right) - width;
      const anchorTop = window.innerHeight - Number.parseFloat(style.bottom) - height;
      const header = document.querySelector(".scheme-a-chrome")?.getBoundingClientRect();
      const dock = document.querySelector(".scheme-a-mobile-dock")?.getBoundingClientRect();
      const minTop = Math.max(gap, (header?.bottom || 0) + gap);
      const maxTop = (dock?.height ? dock.top : window.innerHeight) - gap - height;
      const maxLeft = window.innerWidth - gap - width;
      const blockers = Array.from(document.querySelectorAll<HTMLElement>(
        ".fc-furniture-card__body, .fc-furniture-card__actions, "
        + ".fc-furniture-card__image > span, .fc-furniture-primary, .fc-furniture-secondary, "
        + ".fc-furniture-list-head, .fc-furniture-detail__note, .fc-furniture-pagination, .public-update-notice",
      )).map((element) => element.getBoundingClientRect()).filter((blocker) =>
        blocker.width > 0 && blocker.height > 0
        && blocker.bottom > minTop && blocker.top < maxTop + height,
      );
      const xs = [anchorLeft, gap, maxLeft];
      const ys = [anchorTop, minTop, maxTop];
      for (const blocker of blockers) {
        xs.push(blocker.left - gap - width, blocker.right + gap);
        ys.push(blocker.top - gap - height, blocker.bottom + gap);
      }
      let best = { left: Math.max(gap, Math.min(maxLeft, anchorLeft)), top: Math.max(minTop, Math.min(maxTop, anchorTop)) };
      let distance = Infinity;
      // Search both axes: moving upward alone can land on another product's
      // description or price. Whole text/action boxes stay unobstructed.
      for (const left of xs.filter(x => x >= gap && x <= maxLeft)) {
        for (const top of ys.filter(y => y >= minTop && y <= maxTop)) {
          const cost = (left - anchorLeft) ** 2 + (top - anchorTop) ** 2;
          if (cost >= distance || blockers.some(blocker =>
            left < blocker.right + gap && left + width > blocker.left - gap
            && top < blocker.bottom + gap && top + height > blocker.top - gap,
          )) continue;
          best = { left, top };
          distance = cost;
        }
      }
      // Individual translate keeps the original hover/press transform and
      // synchronous fixed-position CSS intact.
      floating.style.translate = `${best.left - anchorLeft}px ${best.top - anchorTop}px`;
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(avoidFurnitureContent);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(floating);
    const main = document.querySelector("#main-content");
    if (main) resizeObserver.observe(main);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("public-route-ready", schedule);
    schedule();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("public-route-ready", schedule);
      floating.style.translate = "";
      for (const property of ["width", "min-width", "white-space", "padding", "gap", "font-size"]) floating.style.removeProperty(property);
    };
  }, [isFurniturePage, pathname, language]);
  const copy = furnitureText[language];
  const Arrow = isFurniturePage ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      {isFurniturePage ? copy.floatingShop : copy.floating}
      <span aria-hidden="true"><Arrow size={18} strokeWidth={1.8} /></span>
    </>
  );

  return isFurniturePage ? (
    <a ref={floatingRef} className="fc-furniture-floating" data-discover={discover || undefined} href={furnitureShopUrl} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    <LocalizedLink className="fc-furniture-floating" data-discover={discover || undefined} to="/furniture">
      {content}
    </LocalizedLink>
  );
}
