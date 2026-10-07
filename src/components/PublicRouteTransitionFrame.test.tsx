import { act, createRef } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";
import { requestPublicNavigation } from "@/lib/publicNavigation";
import { registerNavigationProtection } from "@/lib/navigationProtection";

let container: HTMLDivElement;
let root: Root;
let unmounted: boolean;
let frame: ReturnType<typeof createRef<PublicRouteTransitionFrame>>;
let finish: () => void;
const cancel = vi.fn();
const beforeCommit = vi.fn();
const cancelDeparture = vi.fn();
const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { finished: Promise<void>; cancel: () => void }>(() => ({ finished: new Promise<void>((resolve) => { finish = resolve; }), cancel }));
const render = async (route: string, pending = false, initial = false, regionOnly = false) => {
  await act(async () => root.render(<PublicRouteTransitionFrame ref={frame} routeKey={route} pending={pending} initial={initial} regionOnly={regionOnly} onBeforeCommit={beforeCommit} onCancelDeparture={cancelDeparture}><main id="main-content">{route}<div data-public-results>Results</div></main></PublicRouteTransitionFrame>));
};
beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  unmounted = false;
  frame = createRef<PublicRouteTransitionFrame>();
  Object.defineProperty(document, "startViewTransition", { configurable: true, value: undefined });
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
afterEach(async () => {
  if (!unmounted) await act(async () => root.unmount());
  container.remove();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  Reflect.deleteProperty(document, "startViewTransition");
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("interruptible public scene handoff", () => {
  it("never captures the whole document even when native view transitions are available", async () => {
    const start = vi.fn(() => { throw new Error("Document snapshots block pointer input"); });
    Object.defineProperty(document, "startViewTransition", { configurable: true, value: start });
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    expect(commit).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
    await render("/zh/projects");
    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.instances[0]).toBe(container.querySelector(".public-route-scene"));
    expect(animate.mock.calls[0]?.[0]).toEqual([{ opacity: .86 }, { opacity: 1 }]);
  });

  it("accepts a new destination before the current visual animation finishes", async () => {
    await render("/zh");
    await render("/zh/materials");
    expect(animate).toHaveBeenCalledOnce();
    const first = vi.fn();
    const last = vi.fn();
    requestPublicNavigation("/zh/projects", first);
    requestPublicNavigation("/zh/services", last);
    await act(async () => {});
    expect(cancel).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledOnce();
    // No animation.finished resolution is needed to commit the last click.
  });

  it.each(["pointerdown", "keydown"])("cancels decorative motion on %s without taking over the interaction", async (type) => {
    await render("/zh");
    await render("/zh/projects");
    const interaction = type === "keydown"
      ? new KeyboardEvent(type, { key: "Enter", bubbles: true, cancelable: true })
      : new Event(type, { bubbles: true, cancelable: true });
    container.querySelector("main")!.dispatchEvent(interaction);
    expect(cancel).toHaveBeenCalledOnce();
    expect(interaction.defaultPrevented).toBe(false);
    expect(container.querySelector(".public-route-scene")).not.toHaveAttribute("data-pending");
  });

  it("remembers a ready destination before its animation finishes for timeout cancellation", async () => {
    await render("/zh");
    await render("/zh/materials");
    expect(animate).toHaveBeenCalledOnce();
    await render("/zh/projects", true);
    expect(frame.current?.previousRoute).toBe("/zh/materials");
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each(["pop", "unmount"] as const)("cancels active decorative motion on %s", async (action) => {
    await render("/zh");
    await render("/zh/materials");
    await act(async () => {
      if (action === "pop") window.dispatchEvent(new PopStateEvent("popstate"));
      else { root.unmount(); unmounted = true; }
    });
    expect(cancel).toHaveBeenCalledOnce();
  });
});

describe("public visual handoff", () => {
  it("lets the document boot own the initial handoff", async () => {
    await render("/zh", true, true);
    await render("/zh", false, true);
    expect(animate).not.toHaveBeenCalled();
  });
  it("prepares one destination before starting its nonblocking full-page fade", async () => {
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    expect(commit).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
    expect(container.querySelector("main")?.textContent).toContain("/zhResults");
    await act(async () => {});
    expect(commit).toHaveBeenCalledOnce();
    expect(beforeCommit).toHaveBeenCalledOnce();
    expect(beforeCommit.mock.invocationCallOrder[0]).toBeLessThan(commit.mock.invocationCallOrder[0]!);
    expect(container.querySelector(".public-route-scene")).toHaveAttribute("data-leaving", "true");
    await render("/zh/projects", true);
    expect(container.querySelector(".public-route-scene")).not.toHaveAttribute("data-leaving");
    expect(container.querySelectorAll("#main-content")).toHaveLength(1);
    expect(container.querySelector(".public-route-retained")).toBeNull();
    expect(container.querySelector("main")?.textContent).not.toContain("/zhResults");
    expect(container.querySelector(".public-route-scene")).toHaveAttribute("data-pending", "true");
    await render("/zh/projects");
    expect(animate).toHaveBeenCalledOnce();
    expect(animate.mock.calls[0]?.[1]).toMatchObject({ duration: 200 });
  });
  it.each([false, true])("only commits the latest same-turn full-page click, pending=%s", async (pending) => {
    await render("/zh", pending);
    const first = vi.fn();
    const last = vi.fn();
    requestPublicNavigation("/zh/projects", first);
    requestPublicNavigation("/zh/materials", last);
    expect(first).not.toHaveBeenCalled();
    expect(last).not.toHaveBeenCalled();
    await act(async () => {});
    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledOnce();
    expect(animate).not.toHaveBeenCalled();
  });
  it("invalidates a queued click as soon as browser history moves", async () => {
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await act(async () => {});
    expect(commit).not.toHaveBeenCalled();
  });
  it("invalidates a queued click when another route commits", async () => {
    await render("/zh");
    const commit = vi.fn();
    await act(async () => {
      requestPublicNavigation("/zh/projects", commit);
      flushSync(() => root.render(<PublicRouteTransitionFrame routeKey="/zh/materials" pending regionOnly={false}><main>Materials</main></PublicRouteTransitionFrame>));
    });
    expect(commit).not.toHaveBeenCalled();
  });
  it("invalidates a queued click when the public frame unmounts", async () => {
    await render("/zh");
    const commit = vi.fn();
    await act(async () => {
      requestPublicNavigation("/zh/projects", commit);
      root.unmount();
      unmounted = true;
    });
    expect(commit).not.toHaveBeenCalled();
  });
  it("does not fade out the page for anchors or furniture filtering", async () => {
    await render("/zh/furniture");
    const commit = vi.fn();
    requestPublicNavigation("/zh/furniture?category=chairs", commit);
    expect(commit).toHaveBeenCalledOnce();
    expect(animate).not.toHaveBeenCalled();
    await render("/zh/furniture?category=chairs", true, false, true);
    await render("/zh/furniture?category=chairs", false, false, true);
    expect(animate.mock.instances.at(-1)).toBe(container.querySelector("[data-public-results]"));
    expect(animate.mock.calls.at(-1)?.[1]).toMatchObject({ duration: 200 });
    expect(container.querySelector(".public-route-scene")).not.toHaveAttribute("data-pending");
    await act(async () => finish());
    expect(cancel).not.toHaveBeenCalled();
  });
  it("lets local updates and protected navigation supersede a queued full-page click immediately", async () => {
    await render("/zh/contact");
    const queued = vi.fn();
    requestPublicNavigation("/zh/projects", queued);
    const local = vi.fn();
    requestPublicNavigation("/zh/contact#form", local);
    expect(local).toHaveBeenCalledOnce();
    await act(async () => {});
    expect(queued).not.toHaveBeenCalled();
    const unregister = registerNavigationProtection();
    try {
      const protectedCommit = vi.fn();
      requestPublicNavigation("/zh/materials", protectedCommit);
      expect(protectedCommit).toHaveBeenCalledOnce();
    } finally {
      unregister();
    }
  });
  it.each(["/zh/materials?category=wood", "/zh/materials?category=wood#details"])("reopens an unchanged destination before committing %s", async (destination) => {
    await render("/zh/materials?category=wood");
    const depart = vi.fn();
    await act(async () => requestPublicNavigation("/zh/projects", depart));
    expect(depart).toHaveBeenCalledOnce();
    expect(beforeCommit).toHaveBeenCalledOnce();
    // The router has not rendered /zh/projects, so the visible route is still A.
    const returnToCurrent = vi.fn();
    await act(async () => requestPublicNavigation(destination, returnToCurrent));
    expect(cancelDeparture).toHaveBeenCalledOnce();
    expect(returnToCurrent).toHaveBeenCalledOnce();
    expect(cancelDeparture.mock.invocationCallOrder[0]).toBeLessThan(returnToCurrent.mock.invocationCallOrder[0]!);
    expect(beforeCommit).toHaveBeenCalledOnce();
  });
  it("does not reopen unchanged content for a different local query or a protected destination", async () => {
    await render("/zh/furniture?category=chairs");
    const filter = vi.fn();
    requestPublicNavigation("/zh/furniture?category=tables", filter);
    expect(filter).toHaveBeenCalledOnce();
    expect(cancelDeparture).not.toHaveBeenCalled();
    const unregister = registerNavigationProtection();
    try {
      const guarded = vi.fn();
      requestPublicNavigation("/zh/projects", guarded);
      expect(guarded).toHaveBeenCalledOnce();
      expect(cancelDeparture).not.toHaveBeenCalled();
      expect(beforeCommit).not.toHaveBeenCalled();
    } finally { unregister(); }
  });
  it("honors reduced motion without an animation or timer delay", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    expect(commit).toHaveBeenCalledOnce();
    await render("/zh/projects", true);
    await render("/zh/projects");
    await render("/zh/projects?category=home", true, false, true);
    await render("/zh/projects?category=home", false, false, true);
    expect(animate).not.toHaveBeenCalled();
  });
  it("navigates normally outside the public shell", () => {
    const commit = vi.fn();
    requestPublicNavigation("/admin", commit);
    expect(commit).toHaveBeenCalledOnce();
  });
});
