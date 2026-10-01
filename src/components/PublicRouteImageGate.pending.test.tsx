import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

afterEach(() => vi.useRealTimers());

describe("public route pending content", () => {
  it("keeps retry and continue available, then releases the page when content arrives", async () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const render = (pending: boolean) => root.render(<QueryClientProvider client={client}><LanguageProvider><PublicRouteImageGate routeKey="/test-slow-data"><main id="main-content">{pending ? <div data-route-pending="true" /> : <h1>Ready content</h1>}</main></PublicRouteImageGate></LanguageProvider></QueryClientProvider>);
    try {
      await act(async () => render(true));
      await act(async () => vi.advanceTimersByTime(5100));
      expect(container.querySelectorAll(".scheme-a-page-loader__actions button")).toHaveLength(2);
      expect(container.textContent).not.toContain("Images are taking too long");
      expect(container.textContent).not.toContain("页面图片加载超时");
      await act(async () => render(false));
      await act(async () => vi.advanceTimersByTime(40));
      expect(container.querySelector("[data-route-loader]")).toBeNull();
      expect(container.querySelector("[data-route-visual-state]")).toHaveAttribute("data-route-visual-state", "ready");
      expect(container.querySelector(".smart-image-failure")).toBeNull();
    } finally {
      await act(async () => root.unmount());
      client.clear();
      container.remove();
    }
  });
});
