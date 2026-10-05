import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";
import { requestPublicNavigation } from "@/lib/publicNavigation";

let container: HTMLDivElement;
let root: Root;
let finish: () => void;
const cancel = vi.fn();
const beforeCommit = vi.fn();
const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { finished: Promise<void>; cancel: () => void }>(() => ({ finished: new Promise<void>((resolve) => { finish = resolve; }), cancel }));
const render = async (route: string, pending = false, initial = false, regionOnly = false) => {
  await act(async () => root.render(<PublicRouteTransitionFrame routeKey={route} pending={pending} initial={initial} regionOnly={regionOnly} onBeforeCommit={beforeCommit}><main id="main-content">{route}<div data-public-results>Results</div></main></PublicRouteTransitionFrame>));
};
beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("public visual handoff", () => {
  it("lets the document boot own the initial handoff", async () => {
    await render("/zh", true, true);
    await render("/zh", false, true);
    expect(animate).not.toHaveBeenCalled();
  });
  it("fades the live scene before committing navigation, with no retained page", async () => {
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    expect(commit).not.toHaveBeenCalled();
    expect(animate.mock.calls[0]?.[1]).toMatchObject({ duration: 120 });
    const exitOpacity = Number(animate.mock.calls[0]?.[0].at(-1)?.opacity);
    expect(exitOpacity).toBeGreaterThanOrEqual(0.5);
    expect(container.querySelector("main")?.textContent).toContain("/zhResults");
    await act(async () => finish());
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
    expect(animate.mock.calls.at(-1)?.[1]).toMatchObject({ duration: 320 });
    expect(animate.mock.calls.at(-1)?.[0]).toEqual([{ opacity: .86 }, { opacity: 1 }]);
  });
  it("only commits the latest click, including while the first exit is finishing", async () => {
    await render("/zh");
    const first = vi.fn();
    const last = vi.fn();
    requestPublicNavigation("/zh/projects", first);
    const finishOld = finish;
    requestPublicNavigation("/zh/materials", last);
    expect(cancel).toHaveBeenCalled();
    await act(async () => finishOld());
    expect(first).not.toHaveBeenCalled();
    await act(async () => finish());
    expect(last).toHaveBeenCalledOnce();
  });
  it("invalidates an exit when browser history changes the route", async () => {
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    const finishOld = finish;
    await render("/zh/materials", true);
    await act(async () => finishOld());
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
  });
  it("honors reduced motion without delaying navigation", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    await render("/zh");
    const commit = vi.fn();
    requestPublicNavigation("/zh/projects", commit);
    expect(commit).toHaveBeenCalledOnce();
    await render("/zh/projects", true);
    await render("/zh/projects");
    expect(animate).not.toHaveBeenCalled();
  });
  it("navigates normally outside the public shell", () => {
    const commit = vi.fn();
    requestPublicNavigation("/admin", commit);
    expect(commit).toHaveBeenCalledOnce();
  });
});
