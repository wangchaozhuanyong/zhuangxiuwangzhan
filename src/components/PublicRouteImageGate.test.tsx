import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PublicRouteImageGate } from "@/components/PublicRouteImageGate";

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
const state = () => container.querySelector("[data-route-visual-state]")?.getAttribute("data-route-visual-state");

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.useRealTimers();
});

describe("public route visual readiness", () => {
  it("waits past the deadline and follows the replacement site logo instead of a detached image", async () => {
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
    expect(state()).toBe("timeout");
    expect(loader()).not.toBeNull();
    expect(container.querySelectorAll(".scheme-a-page-loader__actions button")).toHaveLength(2);
    expect(container.querySelector(".smart-image-failure")).toBeNull();
    const newLogo = document.createElement("img");
    newLogo.src = src;
    newLogo.dataset.imageState = "loaded";
    newLogo.dataset.decodedSrc = src;
    Object.defineProperties(newLogo, { complete: {value:true}, naturalWidth: {value:100}, currentSrc: {value:src} });
    newLogo.getBoundingClientRect = oldLogo.getBoundingClientRect;
    await act(async () => brand.replaceChildren(newLogo));
    await render(<Image ready />);
    expect(state()).toBe("ready");
    expect(loader()).toBeNull();
    brand.remove();
  });

  it("waits on subsequent routes with lightweight feedback instead of the brand screen", async () => {
    await render(<Image ready />, "/zh/projects");
    await render(<Image />);
    expect(container.querySelector(".public-route-retained img")).not.toBeNull();
    expect(loader()).toBeNull();
    await act(async () => vi.advanceTimersByTime(180));
    expect(loader()?.getAttribute("data-route-loader")).toBe("navigation");
    expect(document.documentElement.dataset.publicRouteLoading).toBe("navigation");
    expect(container.querySelector(".scheme-a-page-loader__brand")).toBeNull();
    expect(container.querySelector(".public-route-content")).toHaveAttribute("inert");
    await render(<Image ready />);
    expect(loader()).toBeNull();
    expect(document.documentElement.dataset.publicRouteLoading).toBeUndefined();
    expect(container.querySelector(".public-route-content")).not.toHaveAttribute("inert");
  });

  it("releases cached decoded images without a fixed minimum loading delay", async () => {
    await render(<Image ready />);
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

  it("waits for initial route queries but not background refetches or other routes", async () => {
    const observer = new QueryObserver(client, { queryKey: ["published", "site_page", "zh", "services"], queryFn: () => new Promise(() => {}) });
    const unsubscribe = observer.subscribe(() => {});
    client.getQueryCache().build(client, { queryKey: ["published", "blog", "zh"] });
    await render(<Image ready />);
    expect(loader()).not.toBeNull();
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
    expect(container.querySelector(".public-route-retained img")).not.toBeNull();
    await act(async () => vi.advanceTimersByTime(180));
    expect(loader()).not.toBeNull();
    await render(<Image ready />, nextRoute);
    expect(loader()).toBeNull();
  });

  it("allows explicit continue after a slow response without manufacturing image errors", async () => {
    await render(<Image />);
    await act(async () => vi.advanceTimersByTime(5100));
    const buttons = container.querySelectorAll<HTMLButtonElement>(".scheme-a-page-loader__actions button");
    await act(async () => buttons[1].click());
    expect(loader()).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("data-image-state", "loading");
  });

  it("retains one complete scene through rapid navigation and strips duplicate IDs", async () => {
    await render(<Image ready />, "/zh/projects");
    await render(<Image />, "/zh/materials");
    await render(<div data-route-pending="true" />, "/zh/blog");
    expect(container.querySelectorAll("#main-content")).toHaveLength(1);
    expect(container.querySelectorAll(".public-route-retained > div")).toHaveLength(1);
    expect(container.querySelector(".public-route-retained img")?.getAttribute("src")).toBe(src);
    expect(container.querySelector(".public-route-retained > div")).toHaveAttribute("inert");
    await render(<Image ready />, "/zh/blog");
    expect(container.querySelector(".public-route-retained")?.childElementCount).toBe(0);
  });

  it("does not let an obsolete route timer cover the next ready route", async () => {
    await render(<Image />, "/zh/materials");
    await render(<Image ready />, "/zh/projects");
    await act(async () => vi.advanceTimersByTime(6000));
    expect(loader()).toBeNull();
    expect(state()).toBe("ready");
  });
});
