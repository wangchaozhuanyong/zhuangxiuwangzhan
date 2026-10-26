import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const renderPrefetch = vi.fn();
let PublicRoutePrefetchGate: typeof import("./PublicRoutePrefetchGate").default;
let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  // Each transfer scenario models a fresh document, with a fresh ESM result.
  // Do not reuse the prior scenario's successfully cached mock import.
  vi.resetModules();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  renderPrefetch.mockClear();
  vi.doMock("./PublicRouteEnhancements", () => ({ default: () => { renderPrefetch(); return null; } }));
  PublicRoutePrefetchGate = (await import("./PublicRoutePrefetchGate")).default;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); await vi.dynamicImportSettled(); });
  container.remove(); vi.doUnmock("./PublicRouteEnhancements"); vi.unstubAllGlobals();
});
const announce = (degraded: boolean) => window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { degraded } }));

describe("optional prefetch startup", () => {
  it("loads no optional component before real readiness or after a degraded timeout", async () => {
    await act(async () => root.render(<PublicRoutePrefetchGate />));
    expect(renderPrefetch).not.toHaveBeenCalled();
    await act(async () => { announce(true); });
    expect(renderPrefetch).not.toHaveBeenCalled();
    await act(async () => { announce(false); });
    await vi.waitFor(() => expect(renderPrefetch).toHaveBeenCalledOnce());
  });
  it("supports mounting after the successful ready event", async () => {
    container.innerHTML = '<div class="public-route-content" data-route-visual-state="ready"></div>';
    // The actual ready content belongs to the route, outside this optional root.
    const readyContent = container.firstElementChild!;
    document.body.append(readyContent);
    try {
      await act(async () => root.render(<PublicRoutePrefetchGate />));
      await vi.waitFor(() => expect(renderPrefetch).toHaveBeenCalledOnce());
    } finally { readyContent.remove(); }
  });
  it("restores optional decoration after real late images without emitting a false ready event", async () => {
    const page = document.createElement("main"); page.className = "public-route-content"; page.dataset.routeVisualState = "degraded";
    const image = document.createElement("img"); image.src = "https://example.test/late.webp"; image.dataset.criticalImage = "true"; image.dataset.imageState = "loading";
    Object.defineProperties(image, { complete: { configurable: true, value: false }, naturalWidth: { configurable: true, value: 0 }, currentSrc: { configurable: true, value: image.src } });
    image.getBoundingClientRect = () => ({ top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 } as DOMRect);
    page.append(image); document.body.append(page);
    const ready = vi.fn(); window.addEventListener("public-route-ready", ready);
    try {
      await act(async () => root.render(<PublicRoutePrefetchGate />));
      expect(renderPrefetch).not.toHaveBeenCalled();
      await act(async () => {
        Object.defineProperties(image, { complete: { configurable: true, value: true }, naturalWidth: { configurable: true, value: 100 } });
        image.dataset.imageState = "loaded"; image.dataset.decodedSrc = image.src;
        image.dispatchEvent(new Event("load"));
      });
      await vi.waitFor(() => expect(renderPrefetch).toHaveBeenCalledOnce());
      expect(page.dataset.routeVisualState).toBe("degraded");
      expect(ready).not.toHaveBeenCalled();
    } finally { page.remove(); window.removeEventListener("public-route-ready", ready); }
  });
  it("contains optional transfer failures without blocking subsequent route readiness", async () => {
    const failedImport = vi.fn(() => { throw new Error("Optional transfer unavailable"); });
    const unhandled = vi.fn();
    vi.doMock("./PublicRouteEnhancements", failedImport);
    window.addEventListener("unhandledrejection", unhandled);
    try {
      await act(async () => root.render(<PublicRoutePrefetchGate />));
      await act(async () => { announce(false); });
      await vi.waitFor(() => expect(failedImport).toHaveBeenCalledOnce());
      expect(renderPrefetch).not.toHaveBeenCalled();
      // Browsers can cache failed ESM URLs. Core navigation must remain usable
      // even when a later optional attempt fails in that same document.
      await act(async () => { expect(announce(false)).toBe(true); });
      expect(container).toBeEmptyDOMElement();
      expect(unhandled).not.toHaveBeenCalled();
    } finally { window.removeEventListener("unhandledrejection", unhandled); }
  });
});
