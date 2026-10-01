import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate, type NavigateFunction, type Location } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScrollToTop from "./ScrollToTop";
import { usePublicListingState } from "@/hooks/usePublicListingState";
import { ELEMENT_SCROLL_INTENT, LISTING_SCROLL_INTENT } from "@/lib/publicScrollRestoration";

vi.mock("@/lib/instantScroll", () => {
  const scroll = (top: number) => { Object.defineProperty(window, "scrollY", { configurable: true, value: top }); };
  return { scrollWindowToImmediately: vi.fn(scroll), scrollWindowToSmoothly: vi.fn((top: number) => { scroll(top); return vi.fn(); }) };
});
let container: HTMLDivElement;
let root: Root;
let navigate: NavigateFunction;
let location: Location;
const rect = (top: number) => ({ top: top - window.scrollY, bottom: top + 100 - window.scrollY, height: 100 } as DOMRect);
function Scene() {
  navigate = useNavigate();
  location = useLocation();
  const [dialog, setDialog] = useState(false);
  const { filter, setFilter } = usePublicListingState(["all", "budget"] as const, "all", 9);
  return <><ScrollToTop /><main id="main-content">
    <a id="normal-anchor" href={`${location.pathname}${location.search}#articles`}>Articles</a>
    <a id="dialog-link" href={`${location.pathname}${location.search}#articles`} aria-haspopup="dialog" onClick={(event) => { event.preventDefault(); setDialog(true); }}>Dialog</a>
    <a id="component-anchor" href={`${location.pathname}${location.search}#articles`} onClick={(event) => event.preventDefault()}>Owned anchor</a>
    {dialog && <div role="dialog">Example</div>}
    <button id="topic" onClick={() => setFilter("budget", "articles")}>Topic</button>
    <button id="filter" onClick={() => setFilter("budget")}>Filter</button>
    <div id="articles" tabIndex={-1} ref={(node) => { if (node) { node.getBoundingClientRect = () => rect(1200); Object.defineProperty(node, "offsetTop", { configurable: true, value: 1200 }); } }}>{filter}</div>
    <div data-public-results ref={(node) => { if (node) node.getBoundingClientRect = () => rect(1500); }} />
  </main></>;
}
const mount = async (entry = "/zh/blog") => act(async () => root.render(<MemoryRouter initialEntries={[entry]}><Scene /></MemoryRouter>));
const go = async (to: string | number, state?: unknown) => act(async () => {
  if (typeof to === "number") navigate(to); else navigate(to, { state });
});
const readAt = (top: number) => {
  Object.defineProperty(window, "scrollY", { configurable: true, value: top });
  window.dispatchEvent(new Event("scroll"));
};
const click = async (id: string) => act(async () => document.getElementById(id)!.click());
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 6000 });
  readAt(0);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); });

describe("single public scroll owner", () => {
  it("restores each same-page history entry, including a fragment entry read further down", async () => {
    await mount(); readAt(720);
    await click("normal-anchor");
    expect(location.hash).toBe("#articles");
    expect(window.scrollY).toBe(1110);
    readAt(1330);
    await go(-1); expect(location.hash).toBe(""); expect(window.scrollY).toBe(720);
    await go(1); expect(location.hash).toBe("#articles"); expect(window.scrollY).toBe(1330);
  });
  it("lets component handlers cancel anchors without creating hidden fragment history", async () => {
    await mount(); readAt(630);
    const key = location.key;
    await click("dialog-link");
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(location.key).toBe(key); expect(location.hash).toBe(""); expect(window.scrollY).toBe(630);
    await click("component-anchor"); expect(location.key).toBe(key);
  });
  it("locates filtered results after URL commit and repeats the action for the selected topic", async () => {
    await mount(); readAt(2600);
    await click("topic");
    expect(location.search).toBe("?filter=budget"); expect(window.scrollY).toBe(1110);
    window.dispatchEvent(new Event("public-route-layout")); expect(window.scrollY).toBe(1110);
    expect(document.activeElement?.id).toBe("articles");
    readAt(2100); await click("topic"); expect(window.scrollY).toBe(1110);
    await go(-1); expect(window.scrollY).toBe(2100);
    await go(-1); expect(window.scrollY).toBe(2600);
  });
  it("preserves position for ordinary filter changes with no explicit target", async () => {
    await mount(); readAt(2600); await click("filter"); expect(window.scrollY).toBe(2600);
    window.dispatchEvent(new Event("public-route-layout")); expect(window.scrollY).toBe(2600);
  });
  it("does not reapply an old target after user interaction during readiness", async () => {
    await mount(); await go("/zh/blog?filter=budget", { scrollIntent: ELEMENT_SCROLL_INTENT, scrollTarget: "articles" });
    expect(window.scrollY).toBe(1110);
    window.dispatchEvent(new Event("wheel")); readAt(820);
    window.dispatchEvent(new Event("public-route-layout"));
    await act(async () => vi.advanceTimersByTime(200));
    expect(window.scrollY).toBe(820);
  });
  it("honors catalog return position before query pagination positioning", async () => {
    await mount("/zh/furniture/product/example");
    await go("/zh/furniture/bedroom/double-beds?page=2", { scrollIntent: LISTING_SCROLL_INTENT, scrollTop: 420 });
    expect(window.scrollY).toBe(420);
    window.dispatchEvent(new Event("public-route-layout")); expect(window.scrollY).toBe(420);
    expect(location.search).toBe("?page=2");
  });
  it("focuses a labelled form heading through shared hash restoration", async () => {
    await mount();
    document.getElementById("articles")!.setAttribute("aria-labelledby", "form-heading");
    const heading = document.createElement("h2"); heading.id = "form-heading"; heading.tabIndex = -1; container.append(heading);
    await go("/zh/blog#articles"); expect(document.activeElement).toBe(heading);
  });
  it("uses layout position instead of an animated reveal offset and focuses when content unlocks", async () => {
    await mount();
    const target = document.getElementById("articles")!;
    target.getBoundingClientRect = () => rect(1224);
    await go("/zh/blog#articles");
    expect(window.scrollY).toBe(1110);
    const focus = vi.spyOn(target, "focus");
    window.dispatchEvent(new Event("public-route-ready"));
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(window.scrollY).toBe(1110);
  });
});
