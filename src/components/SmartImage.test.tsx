import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import SmartImage from "@/components/SmartImage";

function mockCompleteImages(decode: () => Promise<void>) {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(100);
  vi.spyOn(HTMLImageElement.prototype, "currentSrc", "get").mockImplementation(function (this: HTMLImageElement) { return this.src; });
  const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "decode");
  Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: decode });
  return () => {
    vi.restoreAllMocks();
    if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, "decode", originalDecode);
    else Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
  };
}

describe("SmartImage", () => {
  it("retries a failed transfer once, then keeps manual recovery without an automatic retry loop", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/interrupted.webp" alt="Interrupted" showFailureFallback retryOnError pictureSources={[{ srcSet: "/small.webp 360w, /large.webp 640w" }]} />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      await act(async () => image.dispatchEvent(new Event("error", { bubbles: true })));
      expect(image.dataset.imageState).toBe("error");
      await act(async () => vi.advanceTimersByTime(300));
      const retrySource = image.src;
      expect(retrySource).toContain("image_retry=");
      expect(container.querySelector("source")?.srcset.match(/image_retry=/g)).toHaveLength(2);
      expect(image.dataset.imageState).toBe("loading");
      expect(image.dataset.decodedSrc).toBeUndefined();
      await act(async () => image.dispatchEvent(new Event("error", { bubbles: true })));
      await act(async () => vi.advanceTimersByTime(5000));
      expect(image.src).toBe(retrySource);
      expect(image.dataset.imageState).toBe("error");
      await act(async () => container.querySelector<HTMLButtonElement>(".smart-image-failure button")!.click());
      expect(image.src).not.toBe(retrySource);
      expect(image.dataset.imageState).toBe("loading");
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.useRealTimers();
    }
  });

  it("cancels a scheduled automatic retry when the image source changes", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/old-interrupted.webp" alt="Old" retryOnError />));
      await act(async () => container.querySelector("img")!.dispatchEvent(new Event("error", { bubbles: true })));
      await act(async () => root.render(<SmartImage src="/new-product.webp" alt="New" retryOnError />));
      await act(async () => vi.advanceTimersByTime(5000));
      expect(container.querySelector("img")?.src).not.toContain("image_retry=");
      expect(container.querySelector("img")?.src).toContain("/new-product.webp");
    } finally {
      await act(async () => root.unmount());
      container.remove();
      vi.useRealTimers();
    }
  });

  it("keeps a successfully decoded candidate ready after a real unmount and remount", async () => {
    const decode = vi.fn(() => Promise.resolve());
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/remount-decoded.webp" alt="Cached" critical revealOnLoad />));
      expect(container.querySelector("img")).toHaveAttribute("data-image-state", "loaded");
      expect(decode).toHaveBeenCalledOnce();
      await act(async () => root.render(null));
      decode.mockImplementation(() => new Promise<void>(() => {}));

      await act(async () => root.render(<SmartImage src="/remount-decoded.webp" alt="Cached" critical revealOnLoad />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      expect(image.dataset.imageState).toBe("loaded");
      expect(container.querySelector(".smart-image-frame")).toHaveAttribute("data-image-ready", "true");
      expect(decode).toHaveBeenCalledOnce();

      const stateChanges: MutationRecord[] = [];
      const observer = new MutationObserver((records) => stateChanges.push(...records));
      observer.observe(image, { attributes: true, attributeFilter: ["data-image-state"] });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      observer.disconnect();
      expect(stateChanges).toHaveLength(0);
      expect(image.dataset.imageState).toBe("loaded");
      expect(decode).toHaveBeenCalledOnce();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it.each(["plain", "picture"] as const)("keeps a new %s source loading while currentSrc still describes the successful old image", async (kind) => {
    let finishDecode: (() => void) | undefined;
    const decode = vi.fn(() => Promise.resolve());
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const firstSource = `/stale-success-${kind}-first.webp`;
    const secondSource = `/stale-success-${kind}-second.webp`;
    try {
      await act(async () => root.render(<SmartImage src={firstSource} alt="First" pictureSources={kind === "picture" ? [{ srcSet: firstSource }] : undefined} critical />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      const oldSelected = image.currentSrc;
      expect(image.dataset.imageState).toBe("loaded");
      expect(decode).toHaveBeenCalledOnce();
      Object.defineProperty(image, "currentSrc", { configurable: true, value: oldSelected });
      decode.mockImplementation(() => new Promise<void>((resolve) => { finishDecode = resolve; }));

      await act(async () => root.render(<SmartImage src={secondSource} alt="Second" pictureSources={kind === "picture" ? [{ srcSet: secondSource }] : undefined} critical />));
      expect(image.complete).toBe(true);
      expect(image.currentSrc).toBe(oldSelected);
      expect(image.dataset.imageState).toBe("loading");
      expect(image.dataset.decodedSrc).toBeUndefined();
      expect(decode).toHaveBeenCalledOnce();
      expect(container.querySelector<HTMLImageElement>(".smart-image-previous")?.src).toBe(oldSelected);

      // A subsequent sizes-only render must not clear a still-pending real
      // source change and reuse its old picture candidate.
      await act(async () => root.render(<SmartImage src={secondSource} sizes="50vw" alt="Second" pictureSources={kind === "picture" ? [{ srcSet: secondSource }] : undefined} critical />));
      expect(image.dataset.imageState).toBe("loading");
      expect(decode).toHaveBeenCalledOnce();

      Object.defineProperty(image, "currentSrc", { configurable: true, value: image.src });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      expect(image.dataset.imageState).toBe("loading");
      expect(decode).toHaveBeenCalledTimes(2);
      await act(async () => finishDecode?.());
      expect(image.dataset.imageState).toBe("loaded");
      expect(image.dataset.decodedSrc).toBe(image.src);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it.each(["plain", "srcset", "picture"] as const)("keeps a complete decoded %s candidate ready when only sizes changes without a new load event", async (kind) => {
    const decode = vi.fn(() => Promise.resolve());
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const src = kind === "srcset"
      ? "https://example.supabase.co/storage/v1/object/public/images/sizes-only-candidate.webp"
      : `/sizes-only-${kind}-candidate.webp`;
    const onLoad = vi.fn();
    const renderImage = (size: string) => <SmartImage src={src} alt="Image" sizes={size} pictureSources={kind === "picture" ? [{ srcSet: src, sizes: size }] : undefined} critical onLoad={onLoad} />;
    try {
      await act(async () => root.render(renderImage("100vw")));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      const selected = image.currentSrc;
      const initialSrcSet = image.srcset;
      expect(image.dataset.imageState).toBe("loaded");
      expect(decode).toHaveBeenCalledOnce();

      await act(async () => root.render(renderImage("50vw")));
      expect(image.currentSrc).toBe(selected);
      expect(image.srcset).toBe(initialSrcSet);
      expect(image.getAttribute("sizes")).toBe(kind === "srcset" ? "50vw" : null);
      if (kind === "picture") expect(container.querySelector("source")).toHaveAttribute("sizes", "50vw");
      expect(image.dataset.imageState).toBe("loaded");
      expect(image.dataset.decodedSrc).toBe(selected);
      expect(container.querySelector(".smart-image-frame")).toHaveAttribute("data-image-ready", "true");
      expect(decode).toHaveBeenCalledOnce();
      expect(onLoad).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it("does not remember a complete image when the browser has no decode function", async () => {
    const decode = vi.fn(() => new Promise<void>(() => {}));
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: undefined });
      await act(async () => root.render(<SmartImage src="/decode-not-supported.webp" alt="Image" critical />));
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loaded");
      await act(async () => root.render(null));
      Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: decode });
      await act(async () => root.render(<SmartImage src="/decode-not-supported.webp" alt="Image" critical />));
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loading");
      expect(decode).toHaveBeenCalledOnce();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it("does not use the fallback's successful decode for a newly selected picture candidate", async () => {
    vi.useFakeTimers();
    const decode = vi.fn(() => Promise.resolve());
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/known-fallback.webp" alt="Picture" pictureSources={[{ srcSet: "https://example.com/unknown-picture-candidate.webp" }]} loading="eager" critical />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      expect(image.dataset.imageState).toBe("loaded");
      decode.mockImplementation(() => new Promise<void>(() => {}));
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/unknown-picture-candidate.webp" });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      expect(image.dataset.imageState).toBe("loading");
      expect(decode).toHaveBeenCalledTimes(2);
      expect(container.querySelector(".smart-image-previous")).not.toBeNull();
      await act(async () => vi.advanceTimersByTime(4999));
      expect(container.querySelector(".smart-image-slow")).toBeNull();
      await act(async () => vi.advanceTimersByTime(1));
      expect(container.querySelector(".smart-image-slow")).not.toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
      vi.useRealTimers();
    }
  });

  it("forgets failed image evidence and decodes its retry URL independently", async () => {
    const decode = vi.fn(() => Promise.resolve());
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/retry-evidence.webp" alt="Retry" critical />));
      const firstImage = container.querySelector<HTMLImageElement>(".smart-image")!;
      const firstUrl = firstImage.src;
      expect(firstImage.dataset.imageState).toBe("loaded");
      await act(async () => firstImage.dispatchEvent(new Event("error", { bubbles: true })));
      expect(firstImage.dataset.imageState).toBe("error");
      decode.mockImplementation(() => new Promise<void>(() => {}));

      await act(async () => root.render(null));
      await act(async () => root.render(<SmartImage src="/retry-evidence.webp" alt="Retry" critical />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      expect(image.src).toBe(firstUrl);
      expect(image.dataset.imageState).toBe("loading");
      expect(decode).toHaveBeenCalledTimes(2);

      await act(async () => image.dispatchEvent(new Event("error", { bubbles: true })));
      await act(async () => (container.querySelector(".smart-image-failure button") as HTMLButtonElement).click());
      expect(image.src).toContain("image_retry=");
      expect(image.dataset.imageState).toBe("loading");
      expect(decode).toHaveBeenCalledTimes(3);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it("does not remember a failed decode as successful when the same image remounts", async () => {
    const decode = vi.fn<() => Promise<void>>(() => Promise.reject(new Error("Bitmap unavailable")));
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/failed-decode-evidence.webp" alt="Failed" critical />));
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "error");
      await act(async () => root.render(null));
      decode.mockImplementation(() => new Promise<void>(() => {}));
      await act(async () => root.render(<SmartImage src="/failed-decode-evidence.webp" alt="Failed" critical />));
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loading");
      expect(decode).toHaveBeenCalledTimes(2);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it("does not remember a decode that completes after its image unmounts", async () => {
    let finishDecode: (() => void) | undefined;
    const decode = vi.fn(() => new Promise<void>((resolve) => { finishDecode = resolve; }));
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/unmounted-decode-evidence.webp" alt="Pending" critical />));
      await act(async () => root.render(null));
      await act(async () => finishDecode?.());
      decode.mockImplementation(() => new Promise<void>(() => {}));
      await act(async () => root.render(<SmartImage src="/unmounted-decode-evidence.webp" alt="Pending" critical />));
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loading");
      expect(decode).toHaveBeenCalledTimes(2);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it("ignores a stale candidate's failed decode after the browser selects a replacement", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onError = vi.fn();
    let failDecode: ((reason: Error) => void) | undefined;
    try {
      await act(async () => root.render(<SmartImage src="/candidate-race.webp" alt="Picture" pictureSources={[{ srcSet: "https://example.com/stale-candidate.webp 480w, https://example.com/replacement-race.webp 1440w" }]} critical onError={onError} />));
      const image = container.querySelector<HTMLImageElement>(".smart-image")!;
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/stale-candidate.webp" });
      Object.defineProperty(image, "decode", { configurable: true, value: () => new Promise<void>((_resolve, reject) => { failDecode = reject; }) });
      await act(async () => image.dispatchEvent(new Event("load", { bubbles: true })));
      Object.defineProperty(image, "currentSrc", { configurable: true, value: "https://example.com/replacement-race.webp" });
      await act(async () => failDecode?.(new Error("Stale decode failed")));
      expect(image.dataset.imageState).toBe("loading");
      expect(onError).not.toHaveBeenCalled();
      expect(container.querySelector(".smart-image-failure")).toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("does not remember a decode from an obsolete source request", async () => {
    let finishOldDecode: (() => void) | undefined;
    const decode = vi.fn(() => new Promise<void>((resolve) => { finishOldDecode = resolve; }));
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/obsolete-source-evidence.webp" alt="First" critical />));
      const finishFirst = finishOldDecode;
      await act(async () => root.render(<SmartImage src="/replacement-source-evidence.webp" alt="Second" critical />));
      await act(async () => finishFirst?.());
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loading");
      await act(async () => root.render(null));
      decode.mockImplementation(() => new Promise<void>(() => {}));
      await act(async () => root.render(<SmartImage src="/obsolete-source-evidence.webp" alt="First" critical />));
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loading");
      expect(decode).toHaveBeenCalledTimes(3);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      restore();
    }
  });

  it("tracks the cached candidate while decode is pending and gives its replacement a fresh deadline", async () => {
    vi.useFakeTimers();
    const decode = vi.fn(() => new Promise<void>(() => {}));
    const restore = mockCompleteImages(decode);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/cached.webp" alt="Cached" pictureSources={[{ srcSet: "https://example.com/replacement.webp" }]} loading="eager" critical />));
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
      restore();
      vi.useRealTimers();
    }
  });

  it("refreshes the decode deadline when a picture changes before the previous decode finishes", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<SmartImage src="/picture.webp" alt="Picture" pictureSources={[{ srcSet: "https://example.com/mobile.webp 480w, https://example.com/desktop.webp 1440w" }]} loading="eager" critical />));
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
      await act(async () => root.render(<SmartImage src="/picture.webp" alt="Picture" pictureSources={[{ srcSet: "https://example.com/mobile.webp 480w, https://example.com/desktop.webp 1440w" }]} loading="eager" critical />));
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
    await act(async () => root.render(<SmartImage src="/first.webp" alt="First" pictureSources={[{ srcSet: "https://example.com/selected-first.webp" }]} critical onLoad={onLoad} />));

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

    await act(async () => root.render(<SmartImage src="/second.webp" alt="Second" pictureSources={[{ srcSet: "https://example.com/selected-second.webp" }]} critical onLoad={onLoad} />));
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
