import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import DeferredSmartImage from "@/components/DeferredSmartImage";

describe("DeferredSmartImage", () => {
  it("starts slow feedback when deferred media enters its loading range, including a fresh retry", async () => {
    vi.useFakeTimers();
    let notify: IntersectionObserverCallback | undefined;
    class FakeObserver {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<DeferredSmartImage src="/offscreen-card.webp" alt="Deferred card" />));
      await act(async () => vi.advanceTimersByTime(6000));
      expect(container.querySelector(".smart-image-slow")).toBeNull();

      await act(async () => notify?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
      await act(async () => vi.advanceTimersByTime(4999));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(1));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();

      await act(async () => (container.querySelector(".smart-image-slow button") as HTMLButtonElement).click());
      expect(container.querySelector<HTMLImageElement>("img")?.src).toContain("image_retry=");
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(4999));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(1));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("does not turn slow eager media into an error after five seconds", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () => root.render(<DeferredSmartImage src="/slow-card.webp" alt="Slow card" loading="eager" />));
      await act(async () => vi.advanceTimersByTime(6000));
      expect(container.querySelector(".smart-image-placeholder")).toHaveAttribute("data-image-state", "loading");
      expect(container.querySelector("img")).toHaveAttribute("data-image-state", "loading");
      expect(container.querySelector(".smart-image-failure:not(.smart-image-slow)")).toBeNull();
    } finally {
      await act(async () => root.unmount());
      vi.useRealTimers();
    }
  });
  it("uses rootMargin to upgrade an already mounted image before it reaches the viewport", async () => {
    let notify: IntersectionObserverCallback | undefined;
    const observed = vi.fn();
    const disconnect = vi.fn();
    const constructorOptions: IntersectionObserverInit[] = [];
    class FakeObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        notify = callback;
        constructorOptions.push(options ?? {});
      }
      observe = observed;
      disconnect = disconnect;
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => root.render(<DeferredSmartImage src="/below.webp" alt="Below" loading="lazy" rootMargin="1000px 0px" />));
    const image = container.querySelector<HTMLImageElement>("img");
    expect(image).not.toBeNull();
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.hasAttribute("rootmargin")).toBe(false);
    expect(constructorOptions[0]?.rootMargin).toBe("1000px 0px");
    expect(observed).toHaveBeenCalledOnce();

    await act(async () => notify?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(container.querySelector<HTMLImageElement>("img")?.getAttribute("loading")).toBe("eager");
    expect(disconnect).toHaveBeenCalled();

    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });
});
