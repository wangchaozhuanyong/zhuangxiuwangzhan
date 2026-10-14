import { act } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LocalizedLink from "@/components/LocalizedLink";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";
import SmartImage from "@/components/SmartImage";
import { withSynchronousPublicHistory } from "@/lib/synchronousPublicHistory";

function Scene() {
  const { pathname } = useLocation();
  const name = pathname.endsWith("projects") ? "projects" : "services";
  return <>
    <nav><LocalizedLink to="/services">Services</LocalizedLink><LocalizedLink to="/projects">Projects</LocalizedLink></nav>
    <PublicRouteImageGate routeKey={pathname}>
      <main key={pathname} id="main-content"><h1>{name}</h1>
        <SmartImage src={`/cached-navigation-${name}.webp`} alt={name} loading="eager" critical />
      </main>
    </PublicRouteImageGate>
  </>;
}

it("keeps real cached SmartImage pages ready through native Data router clicks without inserting navigation feedback", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const originalUrl = window.location.href;
  const originalHistory = window.history.state;
  const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "decode");
  const decode = vi.fn(() => Promise.resolve());
  Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: decode });
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(100);
  vi.spyOn(HTMLImageElement.prototype, "currentSrc", "get").mockImplementation(function (this: HTMLImageElement) { return this.src; });
  vi.spyOn(HTMLImageElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0, y: 80, top: 80, bottom: 180, left: 0, right: 100, width: 100, height: 100, toJSON: () => ({}),
  });
  window.history.replaceState(null, "", "/zh/services");
  const router = createBrowserRouter([{ path: "*", element: <Scene /> }]);
  const client = new QueryClient();
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  let observer: MutationObserver | undefined;
  try {
    await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><RouterProvider router={withSynchronousPublicHistory(router)} /></LanguageProvider></QueryClientProvider>));
    await act(async () => vi.advanceTimersByTime(40));
    await act(async () => container.querySelector<HTMLAnchorElement>('a[href="/zh/projects"]')!.click());
    await act(async () => vi.advanceTimersByTime(40));
    expect(container.querySelector(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready");
    const decodeCount = decode.mock.calls.length;
    expect(decodeCount).toBe(2);
    let feedbackInsertions = 0;
    observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches("[data-route-loader]") || node.querySelector("[data-route-loader]"))) feedbackInsertions++;
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    for (const name of ["services", "projects", "services", "projects"]) {
      await act(async () => container.querySelector<HTMLAnchorElement>(`a[href="/zh/${name}"]`)!.click());
      expect(window.location.pathname).toBe(`/zh/${name}`);
      expect(container.querySelector("h1")).toHaveTextContent(name);
      expect(container.querySelector(".public-route-content")).toHaveAttribute("data-route-visual-state", "ready");
      expect(container.querySelector(".public-route-scene")).not.toHaveAttribute("data-pending");
      expect(container.querySelector(".smart-image")).toHaveAttribute("data-image-state", "loaded");
    }
    expect(decode).toHaveBeenCalledTimes(decodeCount);
    expect(feedbackInsertions).toBe(0);
  } finally {
    observer?.disconnect();
    await act(async () => root.unmount());
    router.dispose(); client.clear(); container.remove();
    window.history.replaceState(originalHistory, "", originalUrl);
    vi.restoreAllMocks();
    if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, "decode", originalDecode);
    else Reflect.deleteProperty(HTMLImageElement.prototype, "decode");
    vi.useRealTimers(); vi.unstubAllGlobals();
  }
});
