import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import SmartImage from "@/components/SmartImage";

describe("SmartImage", () => {
  it("tracks the cached candidate while decode is pending and gives its replacement a fresh deadline", async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(100);
    const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "decode");
    const decode = vi.fn(() => new Promise<void>(() => {}));
    Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: decode });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/cached.webp" alt="Cached" loading="eager" critical />));
      expect(decode).toHaveBeenCalledOnce();
      await act(async () => vi.advanceTimersByTime(5000));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/replacement.webp" });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(4999));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(1));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.restoreAllMocks();
      if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, "decode", originalDecode);
      else Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
      vi.useRealTimers();
    }
  });

  it("refreshes the decode deadline when a picture changes before the previous decode finishes", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/picture.webp" alt="Picture" loading="eager" critical />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/mobile.webp" });
      Object.defineProperty(image, "decode", { configurable: true, value: () => new Promise<void>(() => {}) });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      await act(async () => vi.advanceTimersByTime(5000));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/desktop.webp" });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(4999));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(1));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.useRealTimers();
    }
  });

  it("gives a newly selected picture candidate its own slow-image deadline", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/picture.webp" alt="Picture" loading="eager" critical />));
      await act(async () => vi.advanceTimersByTime(5000));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/mobile.webp" });
      Object.defineProperty(image, "decode", { configurable: true, value: () => Promise.resolve() });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      expect(image.dataset.imageState).toBe("loaded");
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/desktop.webp" });
      Object.defineProperty(image, "decode", { configurable: true, value: () => new Promise<void>(() => {}) });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      expect(image.dataset.imageState).toBe("loading");
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(4999));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(1));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.useRealTimers();
    }
  });

  it("does not report an offscreen lazy image as slow before it enters the loading range", async () => {
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
      await act(async () => root.render(<SmartImage src="/offscreen.webp" alt="Offscreen" loading="lazy" showFailureFallback />));
      await act(async () => vi.advanceTimersByTime(6000));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => notify?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
      await act(async () => vi.advanceTimersByTime(5000));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("waits for the selected candidate to decode and retains it while a replacement loads", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onLoad = vi.fn();
    await act(async () => root.render(<SmartImage src="/first.webp" alt="First" critical onLoad={onLoad} />));

    let image = container.querySelector<HTMLImageElement>(".smart-image");
    let finishDecode: (() => void) | undefined;
    Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/selected-first.webp" });
    Object.defineProperty(image, "decode", { configurable: true, value: () => new Promise<void>((resolve) => { finishDecode = resolve; }) });
    await act(async () => image?.dispatchEvent(new Event("load", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("loading");
    expect(onLoad).not.toHaveBeenCalled();

    await act(async () => finishDecode?.());
    expect(image?.dataset.imageState).toBe("loaded");
    expect(onLoad).toHaveBeenCalledOnce();

    await act(async () => root.render(<SmartImage src="/second.webp" alt="Second" critical onLoad={onLoad} />));
    image = container.querySelector<HTMLImageElement>(".smart-image");
    expect(image?.dataset.imageState).toBe("loading");
    expect(container.querySelector<HTMLImageElement>(".smart-image-previous")?.src).toBe("https://example.com/selected-first.webp");

    Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/selected-second.webp" });
    Object.defineProperty(image, "decode", { configurable: true, value: () => Promise.resolve() });
    await act(async () => image?.dispatchEvent(new Event("load", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("loaded");
    expect(container.querySelector(".smart-image-previous")).not.toBeNull();
    expect(container.querySelector(".smart-image-frame")).toHaveAttribute("data-image-ready", "true");
    await act(async () => new Promise((resolve) => setTimeout(resolve, 220)));
    expect(container.querySelector(".smart-image-previous")).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });

  it.each(["critical", "ordinary"] as const)("shows a retry action for failed %s images", async (mode) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(<SmartImage src="/broken.webp" alt="Broken" critical={mode === "critical"} showFailureFallback={mode === "ordinary"} />));
    const image = container.querySelector<HTMLImageElement>(".smart-image");
    await act(async () => image?.dispatchEvent(new Event("error", { bubbles: true })));
    expect(image?.dataset.imageState).toBe("error");
    expect(container.querySelector(".smart-image-failure button")?.textContent).toContain("Retry");
    await act(async () => (container.querySelector(".smart-image-failure button") as HTMLButtonElement).click());
    expect(container.querySelector<HTMLImageElement>(".smart-image")?.src).toContain("image_retry=");
    await act(async () => root.unmount());
    container.remove();
  });

  it("restarts a stalled transfer when the shared route recovery requests a retry", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(<SmartImage src="/stalled.webp" alt="Example" critical />));
    await act(async () => container.querySelector("img")?.dispatchEvent(new Event("public-image-retry")));
    expect(container.querySelector<HTMLImageElement>("img")?.src).toContain("image_retry=");
    await act(async () => root.unmount());
    container.remove();
  });

  it("does not hide ordinary images while they load", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => root.render(<SmartImage src="/logo.webp" alt="Logo" />));
    const image = container.querySelector<HTMLImageElement>("img");
    expect(image?.classList.contains("smart-image--critical")).toBe(false);
    expect(image?.dataset.imageState).toBe("loading");
    await act(async () => root.unmount());
  });

  it("keeps a pending healthy transfer loading after the route's browsing deadline", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/slow.webp" alt="Slow" critical />));
      await act(async () => {
        window.dispatchEvent(new Event("public-image-timeout"));
        vi.advanceTimersByTime(6000);
      });
      const image = container.querySelector<HTMLImageElement>(".smart-image");
      expect(image?.dataset.imageState).toBe("loading");
      expect(container.querySelector(".smart-image-failure:not(.smart-image-slow)")).toBeNull();
      Object.defineProperty(image, "decode", { value: () => Promise.resolve() });
      await act(async () => image?.dispatchEvent(new Event("load", { bubbles: true })));
      expect(image?.dataset.imageState).toBe("loaded");
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.useRealTimers();
    }
  });
});
