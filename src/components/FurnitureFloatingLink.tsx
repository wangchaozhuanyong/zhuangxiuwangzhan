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
    const avoidCardActions = () => {
      frame = 0;
      const rect = floating.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Use the CSS anchor as the starting point each time, not the previous
      // translated rectangle. This prevents drift while the user scrolls.
      const bottom = Number.parseFloat(getComputedStyle(floating).bottom);
      const anchorTop = window.innerHeight - bottom - floating.offsetHeight;
      let top = anchorTop;
      const blockers = Array.from(document.querySelectorAll<HTMLElement>(
        ".fc-furniture-card__actions a, .public-update-notice",
      )).map((element) => element.getBoundingClientRect()).filter((blocker) =>
        blocker.width > 0 && blocker.height > 0
        && blocker.bottom > 0 && blocker.top < window.innerHeight
        && blocker.left < rect.right && blocker.right > rect.left,
      ).sort((a, b) => b.top - a.top);
      for (const blocker of blockers) {
        if (top < blocker.bottom + gap && top + floating.offsetHeight > blocker.top - gap) {
          top = blocker.top - gap - floating.offsetHeight;
        }
      }
      const offset = Math.min(0, top - anchorTop);
      // Individual translate keeps the original hover/press transform and
      // synchronous fixed-position CSS intact.
      floating.style.translate = offset ? `0 ${offset}px` : "";
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(avoidCardActions);
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
    };
  }, [isFurniturePage, pathname]);
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
