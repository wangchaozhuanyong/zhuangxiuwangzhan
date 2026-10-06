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
const snapshotSkip = vi.fn();
const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { finished: Promise<void>; cancel: () => void }>(() => ({ finished: new Promise<void>((resolve) => { finish = resolve; }), cancel }));
const render = async (route: string, pending = false, initial = false, regionOnly = false, covered = false) => {
  await act(async () => root.render(<PublicRouteTransitionFrame ref={frame} routeKey={route} pending={pending} initial={initial} regionOnly={regionOnly} covered={covered} onSnapshotSkip={snapshotSkip} onBeforeCommit={beforeCommit}><main id="main-content">{route}<div data-public-results>Results</div></main></PublicRouteTransitionFrame>));
};
const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};
const mockViewTransitions = () => {
  const transitions: {
    update: () => void | Promise<void>;
    ready: ReturnType<typeof deferred>;
    finished: ReturnType<typeof deferred>;
    skip: ReturnType<typeof vi.fn>;
  }[] = [];
  const start = vi.fn((update: () => void | Promise<void>) => {
    const ready = deferred();
    const finished = deferred();
    const skip = vi.fn(() => finished.resolve());
    transitions.push({ update, ready, finished, skip });
    return { ready: ready.promise, finished: finished.promise, skipTransition: skip };
  });
  Object.defineProperty(document, "startViewTransition", { configurable: true, value: start });
  return { start, transitions };
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

describe("native public scene handoff", () => {
  it.each(["ready", "covered"] as const)("holds the old bitmap until the destination is %s", async (state) => {
    const { start, transitions } = mockViewTransitions();
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects?category=home", commit);
    await act(async () => {});
    expect(start).toHaveBeenCalledOnce();
    expect(commit).not.toHaveBeenCalled();
    expect(frame.current?.isCapturing("/zh/projects?category=home")).toBe(true);
    const transition = transitions[0];
    const updated = vi.fn();
    void Promise.resolve(transition.update()).then(updated);
    expect(commit).toHaveBeenCalledOnce();
    await render("/zh/projects?category=home", true);
    expect(updated).not.toHaveBeenCalled();
    await render("/zh/projects?category=home", state === "covered", false, false, state === "covered");
    expect(updated).toHaveBeenCalledOnce();
    expect(frame.current?.isCapturing("/zh/projects?category=home")).toBe(false);
    const presented = vi.fn();
    void frame.current?.whenPresented().then(presented);
    expect(presented).not.toHaveBeenCalled();
    await act(async () => { transition.ready.resolve(); transition.finished.resolve(); });
    expect(presented).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
    expect(snapshotSkip).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  it("starts only the latest native transition for same-turn clicks", async () => {
    const { start, transitions } = mockViewTransitions();
    await render("/zh");
    const first = vi.fn();
    const last = vi.fn();
    requestPublicNavigation("/zh/projects", first);
    requestPublicNavigation("/zh/materials", last);
    await act(async () => {});
    expect(start).toHaveBeenCalledOnce();
    void transitions[0].update();
    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledOnce();
    expect(frame.current?.isCapturing("/zh/materials")).toBe(true);
  });

  it("skips a superseded capture and prevents its delayed callback from navigating", async () => {
    const { transitions } = mockViewTransitions();
    await render("/zh");
    const first = vi.fn();
    requestPublicNavigation("/zh/projects", first);
    await act(async () => {});
    const old = transitions[0];
    const last = vi.fn();
    requestPublicNavigation("/zh/materials", last);
    expect(old.skip).toHaveBeenCalledOnce();
    await act(async () => {});
    void old.update();
    void transitions[1].update();
    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledOnce();
    await act(async () => old.ready.reject(new Error("superseded")));
    expect(snapshotSkip).not.toHaveBeenCalled();
    expect(frame.current?.isCapturing("/zh/materials")).toBe(true);
  });

  it("recovers a rejected snapshot and releases the waiting callback", async () => {
    const { transitions } = mockViewTransitions();
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    const transition = transitions[0];
    const updated = vi.fn();
    void Promise.resolve(transition.update()).then(updated);
    await render("/zh/projects", true);
    await act(async () => transition.ready.reject(new Error("snapshot unavailable")));
    expect(snapshotSkip).toHaveBeenCalledOnce();
    expect(transition.skip).toHaveBeenCalledOnce();
    expect(updated).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
  });

  it("falls back to one normal commit when native capture throws", async () => {
    const start = vi.fn(() => { throw new Error("capture unavailable"); });
    Object.defineProperty(document, "startViewTransition", { configurable: true, value: start });
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    expect(commit).toHaveBeenCalledOnce();
    expect(snapshotSkip).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
  });

  it.each(["unsupported", "reduced", "pending"] as const)("navigates normally when capture is %s", async (condition) => {
    const { start } = mockViewTransitions();
    if (condition === "unsupported") Object.defineProperty(document, "startViewTransition", { configurable: true, value: undefined });
    if (condition === "reduced") vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    await render("/zh", condition === "pending");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    expect(commit).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
  });

  it("releases a capture that misses its readiness deadline without repeating navigation", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { transitions } = mockViewTransitions();
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    const transition = transitions[0];
    const updated = vi.fn();
    void Promise.resolve(transition.update()).then(updated);
    await render("/zh/projects", true);
    await act(async () => vi.advanceTimersByTime(359));
    expect(updated).not.toHaveBeenCalled();
    expect(snapshotSkip).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(1));
    expect(snapshotSkip).toHaveBeenCalledOnce();
    expect(updated).toHaveBeenCalledOnce();
    expect(transition.skip).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["pop", "unmount"] as const)("cancels a pending native callback on %s", async (action) => {
    const { transitions } = mockViewTransitions();
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    await act(async () => {});
    const transition = transitions[0];
    await act(async () => {
      if (action === "pop") window.dispatchEvent(new PopStateEvent("popstate"));
      else { root.unmount(); unmounted = true; }
    });
    void transition.update();
    expect(commit).not.toHaveBeenCalled();
    expect(transition.skip).toHaveBeenCalledOnce();
    expect(document.documentElement.dataset.publicViewTransition).toBeUndefined();
    expect(snapshotSkip).toHaveBeenCalledTimes(action === "pop" ? 1 : 0);
  });
});

describe("public visual handoff", () => {
  it("lets the document boot own the initial handoff", async () => {
    await render("/zh", true, true);
    await render("/zh", false, true);
    expect(animate).not.toHaveBeenCalled();
  });
  it("hands off a full page without dimming either scene or retaining the old page", async () => {
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
    expect(animate).not.toHaveBeenCalled();
    await expect(frame.current?.whenPresented()).resolves.toBeUndefined();
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
    const presented = vi.fn();
    void frame.current?.whenPresented().then(presented);
    expect(presented).not.toHaveBeenCalled();
    await act(async () => finish());
    expect(presented).toHaveBeenCalledOnce();
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
