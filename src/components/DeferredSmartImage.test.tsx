import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import DeferredSmartImage from "@/components/DeferredSmartImage";

describe("DeferredSmartImage", () => {
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
