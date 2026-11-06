import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicRoutePrefetch from "./PublicRoutePrefetch";

const reads = vi.hoisted(() => ({ module: vi.fn(), content: vi.fn(), hint: vi.fn() }));
vi.mock("@/lib/publicPagePrefetch", () => ({ prefetchPublicPageModule: reads.module }));
vi.mock("@/lib/publicPageModules", () => ({ publicPageModules: { Services: reads.hint, Projects: reads.hint, Materials: reads.hint, FurnitureShowcase: reads.hint } }));
vi.mock("@/lib/publicRoutePrefetch", () => ({ prefetchPublishedRouteContent: reads.content }));

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;
const originalConnection = Object.getOwnPropertyDescriptor(navigator, "connection");
const setConnection = (value: unknown) => Object.defineProperty(navigator, "connection", { configurable: true, value });
const link = (id: string) => container.querySelector<HTMLAnchorElement>(`#${id}`)!;
const point = (element: Element) => element.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
const announceReady = (degraded = false) => window.dispatchEvent(new CustomEvent("public-route-ready", {
  detail: { routeKey: "/en", attempt: 0, degraded },
}));
const mount = (initialReady = false) => act(async () => root.render(<QueryClientProvider client={queryClient}>
  <div className="public-route-content" data-route-visual-state={initialReady ? "ready" : "waiting"} />
  <PublicRoutePrefetch />
  <a id="services" href="/zh/services"><span>Services</span></a>
  <a id="projects" href="/en/projects">Projects</a>
  <a id="current" href="/en#main-content">Current</a>
  <a id="external" href="https://example.com/zh/services">External</a>
  <a id="download" href="/en/services" download>Download</a>
  <a id="new-window" href="/en/services" target="_blank">New window</a>
  <a id="admin" href="/admin/projects">Admin</a>
</QueryClientProvider>));

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  reads.module.mockReset().mockResolvedValue(undefined);
  reads.hint.mockReset().mockResolvedValue(undefined);
  reads.content.mockReset().mockResolvedValue(undefined);
  window.history.replaceState({}, "", "/en");
  setConnection(undefined);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  queryClient = new QueryClient();
  await mount();
});

afterEach(async () => {
  await act(async () => root.unmount());
  queryClient.clear();
  container.remove();
  if (originalConnection) Object.defineProperty(navigator, "connection", originalConnection);
  else Reflect.deleteProperty(navigator, "connection");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("public navigation intent", () => {
  it("leaves initial CSS and critical images alone until a successful route-ready event", async () => {
    await act(async () => point(link("services")));
    expect(reads.module).not.toHaveBeenCalled();
    expect(reads.content).not.toHaveBeenCalled();
    announceReady(true);
    await act(async () => point(link("services")));
    expect(reads.module).not.toHaveBeenCalled();
    expect(reads.content).not.toHaveBeenCalled();
    announceReady();
    await act(async () => point(link("services")));
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledOnce());
    expect(reads.module).toHaveBeenCalledExactlyOnceWith("/zh/services");
  });

  it("recognizes an already-ready route when mounted after its readiness event", async () => {
    await act(async () => root.unmount());
    root = createRoot(container);
    await mount(true);
    await act(async () => point(link("services")));
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledOnce());
    expect(reads.module).toHaveBeenCalledOnce();
  });

  it("removes readiness and intent listeners on unmount", async () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const destination = link("services");
    await act(async () => root.unmount());
    expect(remove).toHaveBeenCalledWith("public-route-ready", expect.any(Function));
    root = createRoot(container);
    container.append(destination);
    announceReady();
    await act(async () => point(destination));
    expect(reads.module).not.toHaveBeenCalled();
    expect(reads.content).not.toHaveBeenCalled();
  });

  it("warms internal content on pointer and keyboard intent without intercepting navigation", async () => {
    announceReady();
    const event = new Event("pointerover", { bubbles: true, cancelable: true });
    await act(async () => link("services").querySelector("span")!.dispatchEvent(event));
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledWith(queryClient, "/zh/services", "zh"));
    expect(event.defaultPrevented).toBe(false);
    await act(async () => link("projects").dispatchEvent(new Event("focusin", { bubbles: true })));
    expect(reads.content).toHaveBeenLastCalledWith(queryClient, "/en/projects", "en");
    reads.content.mockClear();
    for (const id of ["current", "external", "download", "new-window", "admin"]) {
      await act(async () => link(id).dispatchEvent(new Event("focusin", { bubbles: true })));
    }
    expect(reads.content).not.toHaveBeenCalled();
  });

  it("loads nothing on mount, then warms code and data once for a hover/focus/touch gesture", async () => {
    expect(reads.module).not.toHaveBeenCalled();
    expect(reads.content).not.toHaveBeenCalled();
    announceReady();
    await act(async () => {
      point(link("services"));
      expect(reads.hint).toHaveBeenCalledOnce();
      link("services").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      link("services").dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledOnce());
    expect(reads.module).toHaveBeenCalledExactlyOnceWith("/zh/services");
    expect(reads.content).toHaveBeenCalledWith(queryClient, "/zh/services", "zh");
    await act(async () => point(link("services")));
    expect(reads.module).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe("/en");
  });

  it("starts code without waiting for content and deduplicates an in-flight destination", async () => {
    announceReady();
    let finish: () => void;
    reads.content.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
    await act(async () => point(link("services")));
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledOnce());
    expect(reads.module).toHaveBeenCalledOnce();
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 5_000);
    await act(async () => point(link("services")));
    expect(reads.module).toHaveBeenCalledOnce();
    await act(async () => finish!());
  });

  it("allows a new intended page and later revisits after the gesture cooldown", async () => {
    announceReady();
    const time = vi.spyOn(Date, "now").mockReturnValue(1_000);
    await act(async () => point(link("services")));
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledOnce());
    await act(async () => point(link("projects")));
    expect(reads.module).toHaveBeenLastCalledWith("/en/projects");
    time.mockReturnValue(2_001);
    await act(async () => point(link("services")));
    expect(reads.module).toHaveBeenCalledTimes(3);
  });

  it("ignores internal pointer movement and links that are not same-tab public destinations", async () => {
    announceReady();
    await act(async () => {
      link("services").querySelector("span")!.dispatchEvent(new MouseEvent("pointerover", {
        bubbles: true, relatedTarget: link("services"),
      }));
      for (const id of ["current", "external", "download", "new-window", "admin"]) point(link(id));
    });
    expect(reads.module).not.toHaveBeenCalled();
    expect(reads.content).not.toHaveBeenCalled();
  });

  it("respects save-data and 2G connections without affecting ordinary links", async () => {
    announceReady();
    for (const connection of [{ saveData: true }, { effectiveType: "2g" }, { effectiveType: "slow-2g" }]) {
      setConnection(connection);
      await act(async () => point(link("services")));
    }
    expect(reads.module).not.toHaveBeenCalled();
    setConnection({ saveData: false, effectiveType: "4g" });
    await act(async () => point(link("services")));
    expect(reads.module).toHaveBeenCalledOnce();
    expect(link("services").getAttribute("href")).toBe("/zh/services");
  });

  it("contains speculative failures and permits the next intent to retry", async () => {
    announceReady();
    reads.module.mockRejectedValueOnce(new Error("temporary module failure"));
    await act(async () => point(link("services")));
    await vi.waitFor(() => expect(reads.content).toHaveBeenCalledOnce());
    await act(async () => point(link("services")));
    expect(reads.module).toHaveBeenCalledTimes(2);
    expect(window.location.pathname).toBe("/en");
  });
});
