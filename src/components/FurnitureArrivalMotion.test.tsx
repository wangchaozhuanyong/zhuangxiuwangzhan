import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: window.location.pathname }) }));
vi.mock("@/lib/publicBoot", () => ({ getPublicBoot: () => ({ state: "waiting" }) }));

let root: Root;
let act: typeof import("react").act;
let entry: HTMLAnchorElement;
let container: HTMLDivElement;
let visibility: "visible" | "hidden";
let loaded: DocumentReadyState;
let reduced: boolean;

async function mount(path = "/zh") {
  window.history.replaceState(null, "", path);
  const React = await import("react");
  act = React.act;
  const { createRoot } = await import("react-dom/client");
  const { default: Motion } = await import("./FurnitureArrivalMotion");
  root = createRoot(container);
  await act(async () => root.render(<Motion entryRef={{ current: entry }} />));
}
const ready = () => window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { routeKey: window.location.pathname, degraded: false } }));
const tick = async (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  visibility = "visible"; loaded = "complete"; reduced = false;
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  vi.spyOn(document, "readyState", "get").mockImplementation(() => loaded);
  vi.stubGlobal("matchMedia", () => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("scrollY", 0);
  delete document.documentElement.dataset.publicRouteLoading;
  delete document.documentElement.dataset.menuOpen;
  document.body.innerHTML = '<main id="main-content"><div data-immersive-hero><img /></div></main><a class="fc-furniture-floating" href="https://shop.flashcast.com.my/">Shop</a><div id="motion-test"></div>';
  entry = document.querySelector("a")!;
  container = document.getElementById("motion-test") as HTMLDivElement;
  vi.spyOn(entry, "getBoundingClientRect").mockReturnValue({ x: 1000, y: 700, width: 264, height: 88 } as DOMRect);
  const hero = document.querySelector("img")!;
  Object.defineProperties(hero, { complete: { value: true }, naturalWidth: { value: 1000 } });
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  document.body.replaceChildren();
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
});

describe("furniture arrival lifecycle", () => {
  it("waits for both scene readiness and window load, then gives the page time to settle", async () => {
    loaded = "loading";
    await mount(); ready(); await tick(1000);
    expect(entry.dataset.arrival).toBeUndefined();
    loaded = "complete"; window.dispatchEvent(new Event("load"));
    await tick(699); expect(entry.dataset.arrival).toBe("waiting");
    await tick(1); expect(entry.dataset.arrival).toBe("flying");
  });
  it("does not consume the arrival on loading-time scroll and viewport resize", async () => {
    await mount();
    window.dispatchEvent(new Event("resize")); window.dispatchEvent(new Event("scroll"));
    ready(); await tick(500);
    window.dispatchEvent(new Event("resize"));
    await tick(500); expect(entry.dataset.arrival).toBe("waiting");
    await tick(200); expect(entry.dataset.arrival).toBe("flying");
    window.dispatchEvent(new Event("resize"));
    await tick(2400); expect(entry.dataset.arrival).toBe("done");
  });
  it("waits for a background document to become visible before playing", async () => {
    visibility = "hidden";
    await mount(); ready(); await tick(3000);
    expect(entry.dataset.arrival).toBeUndefined();
    visibility = "visible"; document.dispatchEvent(new Event("visibilitychange"));
    await tick(700); expect(entry.dataset.arrival).toBe("flying");
  });
  it.each(["pointerdown", "wheel", "keydown", "public-route-leave"])("cancels for deliberate %s input without blocking the link", async (event) => {
    await mount(); ready(); await tick(700);
    window.dispatchEvent(new Event(event));
    expect(entry.dataset.arrival).toBe("skipped");
    expect(document.querySelector("svg[data-active]")).toBeNull();
    expect(entry).not.toHaveAttribute("inert");
    expect(entry.href).toBe("https://shop.flashcast.com.my/");
  });
  it("never replays after completion in the same document", async () => {
    await mount(); ready(); await tick(3200);
    expect(entry.dataset.arrival).toBe("done");
    ready(); window.dispatchEvent(new Event("resize")); await tick(3200);
    expect(entry.dataset.arrival).toBe("done");
    expect(document.querySelector("svg[data-active]")).toBeNull();
  });
  it("does not fly under reduced motion or on an inner page", async () => {
    reduced = true;
    await mount(); ready(); await tick(710);
    expect(entry.dataset.arrival).toBe("settling");
    expect(document.querySelector("[data-arrival-tail]")).not.toHaveAttribute("d");
    await tick(300); expect(entry.dataset.arrival).toBe("done");
  });
  it("leaves an inner page entry immediately available without an introduction", async () => {
    await mount("/zh/furniture"); ready(); await tick(4000);
    expect(entry.dataset.arrival).toBeUndefined();
    expect(document.querySelector(".fc-furniture-arrival")).toBeNull();
  });
});
