import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";
import { requestPublicNavigation } from "@/lib/publicNavigation";
import { PUBLIC_LOADING_PROGRESS } from "@/lib/publicLoadingProgress";

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
const src = "http://localhost/image.webp";

function Image({ ready = false, offscreen = false, failed = false, raw = false }: { ready?: boolean; offscreen?: boolean; failed?: boolean; raw?: boolean }) {
  return <img src={src} alt="Example" data-critical-image="true"
    data-image-state={raw ? undefined : failed ? "error" : ready ? "loaded" : "loading"}
    data-decoded-src={ready ? src : undefined}
    ref={(image) => {
      if (!image) return;
      Object.defineProperties(image, {
        currentSrc: { configurable: true, value: src },
        complete: { configurable: true, value: ready },
        naturalWidth: { configurable: true, value: ready ? 1000 : 0 },
      });
      image.getBoundingClientRect = () => ({ x: 0, y: offscreen ? 2000 : 100, left: 0, right: 500, top: offscreen ? 2000 : 100, bottom: offscreen ? 2300 : 400, width: 500, height: 300, toJSON: () => ({}) });
    }} />;
}

const render = async (children: React.ReactNode, routeKey = "/zh/services") => {
  await act(async () => root.render(<QueryClientProvider client={client}><LanguageProvider><PublicRouteImageGate routeKey={routeKey}><main id="main-content">{children}</main></PublicRouteImageGate></LanguageProvider></QueryClientProvider>));
  await act(async () => vi.advanceTimersByTime(40));
};
const loader = () => container.querySelector("[data-route-loader]");
const pageFeedback = () => container.querySelector('.public-route-scene[data-pending="true"]:not([data-region-only]) + .public-route-feedback[aria-busy="true"]');
const state = () => container.querySelector("[data-route-visual-state]")?.getAttribute("data-route-visual-state");

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  document.querySelectorAll(".scheme-a-chrome__brand").forEach((node) => node.remove());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("public route visual readiness", () => {
  it("retires cached content before navigation and delays a previously completed bar until needed", async () => {
    const previousAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
    let finishExit!: () => void;
    const exit = new Promise<void>((resolve) => { finishExit = resolve; });
    const cancel = vi.fn();
    const animate = vi.fn().mockReturnValueOnce({ finished: exit, cancel })
      .mockImplementation(() => ({ finished: Promise.resolve(), cancel: vi.fn() }));
    await render(<Image ready />, "/zh/start");
    await render(<Image />, "/zh/projects");
    await act(async () => vi.advanceTimersByTime(180));
    expect(loader()).not.toBeNull();
    await render(<Image ready />, "/zh/projects");
    await act(async () => vi.advanceTimersByTimeAsync(PUBLIC_LOADING_PROGRESS.finish + PUBLIC_LOADING_PROGRESS.fade));
    expect(loader()).toBeNull();
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    try {
      await render(<Image ready />, "/zh/projects");
      expect(state()).toBe("ready");
      const commit = vi.fn(() => ({
        state: state(),
        feedbackVisible: pageFeedback() !== null && pageFeedback() === loader(),
        busy: loader()?.getAttribute("aria-busy"),
        hasPendingLabel: container.querySelector(".public-route-feedback__pending") !== null,
        inert: container.querySelector(".public-route-content")?.hasAttribute("inert"),
        hidden: container.querySelector(".public-route-content")?.getAttribute("aria-hidden"),
        hasRecoveryActions: container.querySelector(".scheme-a-page-loader__actions") !== null,
      }));
      await act(async () => requestPublicNavigation("/zh/materials", commit));
      expect(commit).not.toHaveBeenCalled();
      await act(async () => finishExit());
      expect(commit).toHaveBeenCalledOnce();
      expect(commit.mock.results[0]?.value).toEqual({ state: "waiting", feedbackVisible: false, busy: undefined, hasPendingLabel: false, inert: true, hidden: "true", hasRecoveryActions: false });
      expect(cancel).toHaveBeenCalledOnce();
      // Router can commit the URL before a deferred destination render finishes.
      // The outgoing route's cached images must not mark it ready again.
      await act(async () => vi.advanceTimersByTime(200));
      expect(state()).toBe("waiting");
      expect(pageFeedback()).not.toBeNull();
      expect(pageFeedback()).toBe(loader());
      expect(container.querySelector(".public-route-content")).toHaveAttribute("inert");
      expect(animate).toHaveBeenCalledOnce();
      await render(<Image ready />, "/zh/materials");
      expect(state()).toBe("ready");
      expect(loader()).toBeNull();
    } finally {
      if (previousAnimate) Object.defineProperty(HTMLElement.prototype, "animate", previousAnimate);
      else Reflect.deleteProperty(HTMLElement.prototype, "animate");
    }
  });

  it("degrades slow critical images after the deadline and leaves image recovery local", async () => {
    const brand = document.createElement("a");
    brand.className = "scheme-a-chrome__brand";
    const oldLogo = document.createElement("img");
    oldLogo.dataset.imageState = "loading";
    oldLogo.getBoundingClientRect = () => ({ top: 10, bottom: 50, left: 10, right: 110, width: 100, height: 40 } as DOMRect);
    brand.append(oldLogo);
    document.body.prepend(brand);
    await render(<Image />);
    expect(loader()).not.toBeNull();
    expect(state()).toBe("waiting");
    await act(async () => vi.advanceTimersByTime(5100));
    expect(state()).toBe("degraded");
    expect(loader()).toBeNull();
    expect(container.querySelector(".smart-image-failure")).toBeNull();
    const newLogo = document.createElement("img");
    newLogo.src = src;
    newLogo.dataset.imageState = "loaded";
    newLogo.dataset.decodedSrc = src;
    Object.defineProperties(newLogo, { complete: {value:true}, naturalWidth: {value:100}, currentSrc: {value:src} });
    newLogo.getBoundingClientRect = oldLogo.getBoundingClientRect;
    await act(async () => brand.replaceChildren(newLogo));
    await render(<Image ready />);
    expect(state()).toBe("degraded");
    expect(loader()).toBeNull();
    brand.remove();
  });

  it("waits on subsequent routes with lightweight feedback instead of the brand screen", async () => {
    await render(<Image ready />, "/zh/projects");
    await render(<Image />);
    expect(container.querySelector(".public-route-scene")).toHaveAttribute("data-pending", "true");
    expect(loader()).toBeNull();
    await act(async () => vi.advanceTimersByTime(180));
    expect(loader()?.getAttribute("data-route-loader")).toBe("navigation");
    expect(container.querySelector(".public-route-feedback__pending")).not.toBeNull();
    expect(pageFeedback()).toBe(loader());
    expect(container.querySelector(".public-route-feedback > span")?.textContent).toBeTruthy();
    expect(document.documentElement.dataset.publicRouteLoading).toBe("navigation");
    expect(container.querySelector(".scheme-a-page-loader__brand")).toBeNull();
    expect(container.querySelector(".public-route-content")).toHaveAttribute("inert");
    await render(<Image ready />);
    expect(state()).toBe("ready");
    expect(container.querySelector("[data-loading-progress]")).toHaveAttribute("data-progress-state", "complete");
    expect(document.documentElement.dataset.publicRouteLoading).toBeUndefined();
    expect(container.querySelector(".public-route-content")).not.toHaveAttribute("inert");
    await act(async () => vi.advanceTimersByTime(PUBLIC_LOADING_PROGRESS.finish));
    expect(container.querySelector("[data-loading-progress]")).toHaveAttribute("data-progress-state", "fading");
    await act(async () => vi.advanceTimersByTime(PUBLIC_LOADING_PROGRESS.fade));
    expect(loader()).toBeNull();
  });

  it("keeps page-level feedback out of local results updates and preserves existing content", async () => {
    await render(<><h1>Furniture</h1><div data-public-results><Image ready /></div></>, "/zh/furniture");
    await render(<><h1>Furniture</h1><div data-public-results data-route-pending="true"><Image /></div></>, "/zh/furniture?page=2");
    await act(async () => vi.advanceTimersByTime(180));
    expect(loader()?.getAttribute("data-route-loader")).toBe("navigation");
    expect(pageFeedback()).toBeNull();
    expect(container.querySelector(".public-route-feedback > span")).toHaveClass("sr-only");
    expect(container.querySelector(".public-route-scene")).toHaveAttribute("data-region-only");
    expect(container.querySelector("h1")).toHaveTextContent("Furniture");
    expect(container.querySelector(".public-route-content")).not.toHaveAttribute("inert");
    expect(container.querySelector("[data-public-results]")).toHaveAttribute("inert");
  });

  it("ends busy page feedback and keeps visible accessible recovery when data times out", async () => {
    await render(<Image ready />, "/zh/projects");
    await render(<div data-route-pending="true" />);
    await act(async () => vi.advanceTimersByTime(5100));
    expect(state()).toBe("timeout");
    expect(pageFeedback()).toBeNull();
    expect(loader()).toHaveAttribute("aria-busy", "false");
    const pendingLabel = container.querySelector(".public-route-feedback > span");
    expect(pendingLabel).toHaveClass("public-route-feedback__pending");
    expect(pendingLabel).not.toHaveClass("sr-only");
    expect(container.querySelector(".public-route-feedback__recovery p")?.textContent).toBeTruthy();
    expect(container.querySelectorAll(".public-route-feedback__recovery button")).toHaveLength(2);
    expect(container.querySelector(".public-route-content")).toHaveAttribute("inert");
  });

  it("releases cached decoded images without a fixed minimum loading delay", async () => {
    await render(<Image ready />);
    expect(loader()).toBeNull();
    await render(<Image ready />, "/zh/projects");
    expect(state()).toBe("ready");
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(loader()).toBeNull();
  });

  it("excludes offscreen critical gallery images from first viewport readiness", async () => {
    await render(<><Image ready /><Image offscreen /></>);
    expect(loader()).toBeNull();
  });

  it("exposes actual image failure so the existing image retry remains available", async () => {
    await render(<Image failed />);
    expect(loader()).toBeNull();
  });

  it("keeps route data placeholders covered until the real content arrives", async () => {
    await render(<div data-route-pending="true">Pending</div>);
    expect(loader()).not.toBeNull();
    await render(<Image ready />);
    expect(loader()).toBeNull();
  });

  it("leaves speculative and background queries to their owners instead of treating prefetch as readiness", async () => {
    const observer = new QueryObserver(client, { queryKey: ["published", "site_page", "zh", "services"], queryFn: () => new Promise(() => {}) });
    const unsubscribe = observer.subscribe(() => {});
    client.getQueryCache().build(client, { queryKey: ["published", "blog", "zh"] });
    await render(<Image ready />);
    expect(loader()).toBeNull();
    await act(async () => client.setQueryData(["published", "site_page", "zh", "services"], {}));
    await act(async () => vi.advanceTimersByTime(40));
    expect(loader()).toBeNull();
    unsubscribe();
  });

  it("does not block a supported local fallback when a CMS query is disabled", async () => {
    const observer = new QueryObserver(client, { queryKey: ["published", "site_page", "zh", "services"], enabled: false });
    const unsubscribe = observer.subscribe(() => {});
    await render(<Image ready />);
    expect(loader()).toBeNull();
    unsubscribe();
  });

  it.each(["/zh/furniture/bedroom", "/zh/furniture?page=2"])("rechecks readiness for preserved route %s", async (nextRoute) => {
    await render(<Image ready />, "/zh/furniture");
    expect(loader()).toBeNull();
    await render(<Image />, nextRoute);
    expect(container.querySelector(".public-route-scene")).toHaveAttribute("data-pending", "true");
    await act(async () => vi.advanceTimersByTime(180));
    expect(loader()).not.toBeNull();
    await render(<Image ready />, nextRoute);
    expect(state()).toBe("ready");
    await act(async () => vi.advanceTimersByTimeAsync(PUBLIC_LOADING_PROGRESS.finish + PUBLIC_LOADING_PROGRESS.fade));
    expect(loader()).toBeNull();
  });

  it("allows explicit continue after a slow response without manufacturing image errors", async () => {
    const ready = vi.fn();
    window.addEventListener("public-route-ready", ready);
    await render(<div data-route-pending="true"><Image /></div>);
    await act(async () => vi.advanceTimersByTime(5100));
    const buttons = container.querySelectorAll<HTMLButtonElement>(".scheme-a-page-loader__actions button");
    await act(async () => buttons[1].click());
    expect(loader()).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("data-image-state", "loading");
    expect(state()).toBe("degraded");
    await render(<Image ready />);
    expect(state()).toBe("degraded");
    expect(ready).toHaveBeenCalledTimes(1);
    window.removeEventListener("public-route-ready", ready);
  });

  it("keeps only the latest destination through rapid navigation", async () => {
    await render(<Image ready />, "/zh/projects");
    await render(<Image />, "/zh/materials");
    await render(<div data-route-pending="true" />, "/zh/blog");
    expect(container.querySelectorAll("#main-content")).toHaveLength(1);
    expect(container.querySelector(".public-route-retained")).toBeNull();
    expect(container.querySelector(".public-route-scene")).toHaveAttribute("data-pending", "true");
    await render(<Image ready />, "/zh/blog");
    expect(container.querySelector(".public-route-scene")).not.toHaveAttribute("data-pending");
  });

  it("does not let an obsolete route timer cover the next ready route", async () => {
    await render(<Image />, "/zh/materials");
    await render(<Image ready />, "/zh/projects");
    await act(async () => vi.advanceTimersByTime(6000));
    expect(loader()).toBeNull();
    expect(state()).toBe("ready");
  });

  it("invalidates an old handoff even when rapid navigation returns to the same URL", async () => {
    await render(<Image ready />, "/zh/start");
    let release!: () => void;
    const pending = new Promise<void>((resolve) => release = resolve);
    const transition = vi.spyOn(PublicRouteTransitionFrame.prototype, "whenPresented").mockReturnValueOnce(pending);
    const ready = vi.fn();
    window.addEventListener("public-route-ready", ready);
    try {
      await render(<Image ready />, "/zh/materials");
      expect(state()).toBe("handoff");
      expect(loader()).toBeNull();
      expect(container.querySelector(".scheme-a-page-loader__actions")).toBeNull();
      await render(<Image />, "/zh/projects");
      await render(<Image />, "/zh/materials");
      expect(state()).toBe("waiting");
      await act(async () => release());
      expect(state()).toBe("waiting");
      expect(container.querySelector(".public-route-content")).toHaveAttribute("inert");
      expect(ready).not.toHaveBeenCalled();
      await render(<Image ready />, "/zh/materials");
      expect(state()).toBe("ready");
      expect(loader()).toBeNull();
      expect(ready).toHaveBeenCalledTimes(1);
    } finally {
      transition.mockRestore();
      window.removeEventListener("public-route-ready", ready);
    }
  });
});
