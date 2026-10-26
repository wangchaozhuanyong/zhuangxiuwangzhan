import { getPublicBoot } from "./publicBoot";
import { getPublicImageSelectedSource, hasDecodedPublicImage } from "./publicImageDecodeCache";

/** Observe only a degraded document's remaining real assets. This does not
 * change route state, emit ready, hide content, or retry a failed resource. */
export function observeRecoveredPublicAssets(onRecovered: () => void) {
  const main = document.querySelector<HTMLElement>(".public-route-content");
  if (!main) return () => {};
  const route = location.pathname + location.search;
  let disposed = false, frame = 0;
  const decoded = new WeakMap<HTMLImageElement, string>();
  const decoding = new WeakMap<HTMLImageElement, string>();
  const failed = new WeakMap<HTMLImageElement, string>();
  const visible = (image: HTMLImageElement) => {
    const rect = image.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
  };
  const check = () => {
    frame = 0;
    if (disposed) return;
    if (!main.isConnected || route !== location.pathname + location.search) { cleanup(); return; }
    const brand = document.querySelector(".scheme-a-chrome__brand");
    if (getPublicBoot()?.stylesReady === false || main.querySelector('[data-route-pending="true"]') || brand?.closest('[data-route-pending="true"]')) return;
    const images = [...main.querySelectorAll<HTMLImageElement>('img[data-critical-image="true"]:not(.smart-image-previous)'), ...(brand?.querySelectorAll<HTMLImageElement>("img") || [])].filter(visible);
    const ready = images.every(image => {
      const source = getPublicImageSelectedSource(image);
      if (!source || !image.complete || !image.naturalWidth || image.dataset.imageState === "error") return false;
      if (image.dataset.imageState) return image.dataset.imageState === "loaded" && image.dataset.decodedSrc === source;
      if (hasDecodedPublicImage(image) || decoded.get(image) === source) return true;
      if (failed.get(image) === source || decoding.get(image) === source) return false;
      decoding.set(image, source);
      void Promise.resolve(typeof image.decode === "function" ? image.decode() : undefined).then(() => {
        if (disposed || getPublicImageSelectedSource(image) !== source) return;
        decoded.set(image, source); schedule();
      }, () => { if (!disposed) failed.set(image, source); });
      return false;
    });
    if (ready) { cleanup(); onRecovered(); }
  };
  const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(check); };
  const loaded = (event: Event) => {
    if (event.target instanceof HTMLImageElement) { failed.delete(event.target); decoding.delete(event.target); }
    schedule();
  };
  const observer = new MutationObserver(schedule);
  const cleanup = () => {
    if (disposed) return;
    disposed = true; observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    document.removeEventListener("load", loaded, true);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("public-assets-change", schedule);
  };
  observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "sizes", "data-image-state", "data-decoded-src", "data-route-pending"] });
  const header = document.querySelector(".scheme-a-chrome__brand")?.closest("header");
  if (header) observer.observe(header, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "data-image-state", "data-decoded-src", "data-route-pending"] });
  document.addEventListener("load", loaded, true);
  window.addEventListener("resize", schedule);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("public-assets-change", schedule);
  check();
  return cleanup;
}
