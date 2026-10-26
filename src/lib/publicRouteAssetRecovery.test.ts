import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { observeRecoveredPublicAssets } from "./publicRouteAssetRecovery";

let main: HTMLDivElement, image: HTMLImageElement, stop: () => void;
const source = "https://example.test/recovered.webp";
const settle = async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(40); };
const loaded = () => {
  Object.defineProperties(image, { complete: { configurable: true, value: true }, naturalWidth: { configurable: true, value: 100 } });
  image.dataset.imageState = "loaded"; image.dataset.decodedSrc = source;
};
beforeEach(() => {
  vi.useFakeTimers();
  main = document.createElement("div"); main.className = "public-route-content";
  main.dataset.routeVisualState = "degraded";
  image = document.createElement("img"); image.src = source; image.dataset.criticalImage = "true"; image.dataset.imageState = "loading";
  Object.defineProperties(image, { currentSrc: { configurable: true, value: source }, complete: { configurable: true, value: false }, naturalWidth: { configurable: true, value: 0 } });
  image.getBoundingClientRect = () => ({ top: 0, bottom: 100, left: 0, right: 100, height: 100, width: 100 } as DOMRect);
  main.append(image); document.body.append(main);
});
afterEach(() => { stop?.(); main.remove(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("decorative enhancement after actual asset recovery", () => {
  it("waits for real image decode without changing the degraded gate or emitting readiness", async () => {
    const recovered = vi.fn(), ready = vi.fn();
    window.addEventListener("public-route-ready", ready);
    try {
      stop = observeRecoveredPublicAssets(recovered);
      image.dataset.imageState = "error"; await settle();
      expect(recovered).not.toHaveBeenCalled();
      loaded(); await settle();
      expect(recovered).toHaveBeenCalledOnce();
      expect(main.dataset.routeVisualState).toBe("degraded");
      expect(main).not.toHaveAttribute("inert");
      expect(ready).not.toHaveBeenCalled();
      image.dataset.imageState = "loading"; await settle();
      expect(recovered).toHaveBeenCalledOnce();
    } finally { window.removeEventListener("public-route-ready", ready); }
  });
  it("keeps waiting for necessary data and cleans up when disposed", async () => {
    loaded(); const pending = document.createElement("div"); pending.dataset.routePending = "true"; main.append(pending);
    const recovered = vi.fn(); stop = observeRecoveredPublicAssets(recovered);
    await settle(); expect(recovered).not.toHaveBeenCalled();
    stop(); pending.remove(); await settle();
    expect(recovered).not.toHaveBeenCalled();
  });
  it("ignores completion belonging to a departed route", async () => {
    const original = location.pathname + location.search;
    const recovered = vi.fn(); stop = observeRecoveredPublicAssets(recovered);
    try {
      history.pushState({}, "", "/en/projects"); loaded(); await settle();
      expect(recovered).not.toHaveBeenCalled();
    } finally { history.replaceState({}, "", original); }
  });
});
