import { useLayoutEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { publicContentStatusText } from "@/i18n/publicContentStatusText";

const MAX_WAIT_MS = 5000;
const readyRouteImages = new Map<string, string[]>();

const criticalImages = (main: HTMLElement) => [...main.querySelectorAll<HTMLImageElement>('img[data-critical-image="true"]')];
const imageSourceKey = (img: HTMLImageElement) => [
  img.getAttribute("src"),
  img.getAttribute("srcset"),
  ...[...(img.closest("picture")?.querySelectorAll("source") || [])].map((source) => `${source.media}:${source.srcset}`),
].join("|");

/** Keeps the existing brand screen above a new public route until its visible images can be painted. */
export function PublicRouteImageGate({ children, routeKey }: { children: ReactNode; routeKey: string }) {
  const { language } = useLanguage();
  const [status, setStatus] = useState<"waiting" | "ready" | "timeout">(
    () => readyRouteImages.has(routeKey) ? "ready" : "waiting",
  );

  useLayoutEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    let frame = 0;
    let stopped = false;
    let timeout = 0;
    const cachedImages = readyRouteImages.get(routeKey);
    let usingCache = cachedImages !== undefined;
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
    const markReady = () => {
      const images = criticalImages(main);
      if (images.every((img) => img.dataset.imageState !== "error")) {
        readyRouteImages.set(routeKey, images.map(imageSourceKey));
      }
      window.clearTimeout(timeout);
      setStatus("ready");
    };
    const startTimeout = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        if (isReady()) {
          markReady();
          return;
        }
        window.dispatchEvent(new Event("public-image-timeout"));
        setStatus("timeout");
      }, MAX_WAIT_MS);
    };
    const check = () => {
      if (stopped) return;
      if (usingCache) {
        if (main.querySelector('[data-route-pending="true"]')) return;
        const images = criticalImages(main);
        if (images.length === cachedImages?.length && images.every((img, index) =>
          imageSourceKey(img) === cachedImages[index] && img.complete && img.naturalWidth > 0)) return;
        usingCache = false;
        readyRouteImages.delete(routeKey);
        setStatus("waiting");
        startTimeout();
      }
      if (isReady()) markReady();
    };
    const observer = new MutationObserver(check);
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src", "data-route-pending", "src", "srcset"] });
    const brand = document.querySelector(".scheme-a-chrome__brand");
    if (brand) observer.observe(brand, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-image-state", "data-decoded-src"] });
    frame = requestAnimationFrame(check);
    if (!usingCache) startTimeout();
    return () => {
      stopped = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [routeKey]);

  return (
    <>
      {children}
      {status !== "ready" ? (
        <div className="scheme-a-page-loader scheme-a-page-loader--overlay" role="status" aria-live="polite" aria-busy={status === "waiting"}>
          <div className="scheme-a-page-loader__brand">
            <p>{publicContentStatusText[language].loaderBrand}</p>
            <strong><span>FLASH</span><em>CAST</em></strong>
            <span>{status === "timeout"
              ? publicContentStatusText[language].loaderTimeout
              : publicContentStatusText[language].loaderPending}</span>
            {status === "waiting" ? <i aria-hidden="true" /> : (
              <div className="scheme-a-page-loader__actions">
                <button type="button" onClick={() => window.location.reload()}>{publicContentStatusText[language].loaderRetry}</button>
                <button type="button" onClick={() => setStatus("ready")}>{publicContentStatusText[language].loaderContinue}</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
