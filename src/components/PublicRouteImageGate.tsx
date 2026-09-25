import { useLayoutEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const MAX_WAIT_MS = 5000;

/** Keeps the existing brand screen above a new public route until its visible images can be painted. */
export function PublicRouteImageGate({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [status, setStatus] = useState<"waiting" | "ready" | "timeout">("waiting");

  useLayoutEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    let frame = 0;
    let stopped = false;
    const isReady = () => {
      if (main.querySelector('[data-route-pending="true"]')) return false;
      const brandImage = document.querySelector<HTMLImageElement>(".scheme-a-chrome__brand img");
      const images = [...main.querySelectorAll<HTMLImageElement>("img"), ...(brandImage ? [brandImage] : [])].filter((img) => {
        if (img.dataset.criticalImage === "true") return true;
        const rect = img.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      });
      return images.every((img) => (img.dataset.imageState === "loaded" && img.dataset.decodedSrc === img.currentSrc) || img.dataset.imageState === "error"
        || (!img.dataset.imageState && img.complete && img.naturalWidth > 0));
    };
    const check = () => {
      if (!stopped && isReady()) setStatus("ready");
    };
    const observer = new MutationObserver(check);
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src", "data-route-pending"] });
    const brand = document.querySelector(".scheme-a-chrome__brand");
    if (brand) observer.observe(brand, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src"] });
    frame = requestAnimationFrame(check);
    const timeout = window.setTimeout(() => {
      if (isReady()) {
        setStatus("ready");
        return;
      }
      window.dispatchEvent(new Event("public-image-timeout"));
      setStatus("timeout");
    }, MAX_WAIT_MS);
    return () => {
      stopped = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {children}
      {status !== "ready" ? (
        <div className="scheme-a-page-loader scheme-a-page-loader--overlay" role="status" aria-live="polite" aria-busy={status === "waiting"}>
          <div className="scheme-a-page-loader__brand">
            <p>INTERIOR &amp; RENOVATION</p>
            <strong><span>FLASH</span><em>CAST</em></strong>
            <span>{status === "timeout"
              ? language === "zh" ? "页面图片加载超时" : "Images are taking too long"
              : language === "zh" ? "空间正在显影" : "Bringing the space into focus"}</span>
            {status === "waiting" ? <i aria-hidden="true" /> : (
              <div className="scheme-a-page-loader__actions">
                <button type="button" onClick={() => window.location.reload()}>{language === "zh" ? "重试" : "Retry"}</button>
                <button type="button" onClick={() => setStatus("ready")}>{language === "zh" ? "继续浏览" : "Continue"}</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
