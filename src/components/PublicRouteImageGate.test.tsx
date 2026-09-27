import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";
import SmartImage from "@/components/SmartImage";

afterEach(() => vi.useRealTimers());

describe("public route image browsing deadline", () => {
  it("releases the page without emitting a false image failure and allows late decode", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const broadcast = vi.fn();
    window.addEventListener("public-image-timeout", broadcast);
    try {
      await act(async () => root.render(<LanguageProvider><PublicRouteImageGate routeKey="/test-slow-image"><main id="main-content"><h1>Ready content</h1><SmartImage src="/slow-gate.webp" alt="Slow" critical /></main></PublicRouteImageGate></LanguageProvider>));
      expect(container.querySelector(".scheme-a-page-loader--overlay")).not.toBeNull();
      await act(async () => vi.advanceTimersByTime(5100));
      expect(container.querySelector(".scheme-a-page-loader--overlay")).toBeNull();
      expect(broadcast).not.toHaveBeenCalled();
      const image = container.querySelector<HTMLImageElement>(".smart-image");
      expect(image?.dataset.imageState).toBe("loading");
      expect(container.querySelector(".smart-image-failure")).toBeNull();
      Object.defineProperty(image, "decode", { value: () => Promise.resolve() });
      await act(async () => image?.dispatchEvent(new Event("load", { bubbles: true })));
      expect(image?.dataset.imageState).toBe("loaded");
    } finally {
      await act(async () => root.unmount());
      container.remove();
      window.removeEventListener("public-image-timeout", broadcast);
    }
  });

  it("keeps retry and continue available for pending route data, then releases it when content arrives", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = (pending: boolean) => root.render(<LanguageProvider><PublicRouteImageGate routeKey="/test-slow-data"><main id="main-content">{pending ? <div data-route-pending="true" /> : <><h1>Ready content</h1><SmartImage src="/still-downloading.webp" alt="Slow" critical /></>}</main></PublicRouteImageGate></LanguageProvider>);
    try {
      await act(async () => render(true));
      await act(async () => vi.advanceTimersByTime(5100));
      expect(container.querySelectorAll(".scheme-a-page-loader__actions button")).toHaveLength(2);
      expect(container.textContent).not.toContain("Images are taking too long");
      expect(container.textContent).not.toContain("页面图片加载超时");
      await act(async () => render(false));
      expect(container.querySelector(".scheme-a-page-loader--overlay")).toBeNull();
      expect(container.querySelector(".smart-image-failure")).toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
