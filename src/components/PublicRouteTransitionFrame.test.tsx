import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicRouteTransitionFrame } from "@/components/PublicRouteTransitionFrame";

let container: HTMLDivElement;
let root: Root;
let finish: () => void;
const cancel = vi.fn();
const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => { finished: Promise<void>; cancel: () => void }>(() => ({ finished: new Promise<void>((resolve) => { finish = resolve; }), cancel }));
const render = async (route: string, pending = false) => {
  await act(async () => root.render(<PublicRouteTransitionFrame routeKey={route} pending={pending} regionOnly={false}><main id="main-content">{route}</main></PublicRouteTransitionFrame>));
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
  it("does not clone the initial brand screen when the first route becomes ready", async () => {
    await render("/zh", true);
    await render("/zh", false);
    expect(container.querySelector(".public-route-retained")?.childElementCount).toBe(0);
    expect(animate).not.toHaveBeenCalled();
  });
  it("crossfades a retained scene without duplicate identities or live controls", async () => {
    await render("/zh");
    await render("/zh/projects");
    expect(container.querySelectorAll("#main-content")).toHaveLength(1);
    expect(container.querySelector(".public-route-retained")?.textContent).toBe("/zh");
    expect(container.querySelector(".public-route-retained > div")).toHaveAttribute("inert");
    expect(animate.mock.calls[0]?.[1]).toMatchObject({ duration: 240 });
    await act(async () => finish());
    expect(container.querySelector(".public-route-retained")?.childElementCount).toBe(0);
  });

  it("ignores a superseded animation completion", async () => {
    await render("/zh");
    await render("/zh/projects");
    const finishOld = finish;
    await render("/zh/materials", true);
    expect(cancel).toHaveBeenCalled();
    await act(async () => finishOld());
    expect(container.querySelector(".public-route-retained")?.textContent).toBe("/zh/projects");
    await render("/zh/blog", true);
    expect(container.querySelector(".public-route-retained")?.textContent).toBe("/zh/projects");
  });

  it("honors reduced motion without an artificial visual delay", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    await render("/zh");
    await render("/zh/projects");
    expect(animate).not.toHaveBeenCalled();
    expect(container.querySelector(".public-route-retained")?.childElementCount).toBe(0);
  });
});
