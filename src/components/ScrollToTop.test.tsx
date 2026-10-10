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
  it("temporarily suppresses browser anchoring until the target language paints, then restores the original policy", async () => {
    const style = document.documentElement.style;
    // JSDOM does not implement this CSS property. Exercise lifecycle ownership
    // here; the actual scroll effect is checked in native Chrome separately.
    const anchor = { value: "auto", priority: "important" };
    const get = style.getPropertyValue.bind(style);
    const priority = style.getPropertyPriority.bind(style);
    const set = style.setProperty.bind(style);
    const remove = style.removeProperty.bind(style);
    vi.spyOn(style, "getPropertyValue").mockImplementation((key) => key === "overflow-anchor" ? anchor.value : get(key));
    vi.spyOn(style, "getPropertyPriority").mockImplementation((key) => key === "overflow-anchor" ? anchor.priority : priority(key));
    vi.spyOn(style, "setProperty").mockImplementation((key, value, importance) => {
      if (key === "overflow-anchor") { anchor.value = value ?? ""; anchor.priority = importance ?? ""; }
      else set(key, value, importance);
    });
    vi.spyOn(style, "removeProperty").mockImplementation((key) => {
      if (key !== "overflow-anchor") return remove(key);
      const previous = anchor.value; anchor.value = ""; anchor.priority = ""; return previous;
    });
    try {
      await mount("/zh/contact");
      readAt(1750);
      await go("/en/contact");
      expect(style.getPropertyValue("overflow-anchor")).toBe("none");
      window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { routeKey: "/zh/contact" } }));
      await act(async () => vi.advanceTimersByTime(40));
      expect(style.getPropertyValue("overflow-anchor")).toBe("none");
      window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { routeKey: "/en/contact" } }));
      await act(async () => vi.advanceTimersByTime(40));
      expect(style.getPropertyValue("overflow-anchor")).toBe("auto");
      expect(style.getPropertyPriority("overflow-anchor")).toBe("important");
      expect(window.scrollY).toBe(1750);
      await go("/zh/contact");
      expect(style.getPropertyValue("overflow-anchor")).toBe("none");
      window.dispatchEvent(new Event("wheel"));
      expect(style.getPropertyValue("overflow-anchor")).toBe("auto");
    } finally { vi.restoreAllMocks(); }
  });

  it("keeps language-only updates at the current position and does not refocus the unchanged fragment", async () => {
    await mount("/zh/blog?filter=budget#articles");
    readAt(1750);
    const button = document.getElementById("topic")!;
    button.focus();
    await go("/en/blog?filter=budget#articles");
    expect(window.scrollY).toBe(1750);
    expect(document.activeElement).toBe(button);
    window.dispatchEvent(new CustomEvent("public-route-layout", { detail: { routeKey: "/en/blog?filter=budget" } }));
    window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { routeKey: "/en/blog?filter=budget" } }));
    expect(window.scrollY).toBe(1750);
    expect(document.activeElement).toBe(button);
  });

  it("records both language entries for back/forward without changing detail navigation", async () => {
    await mount("/zh/services/design"); readAt(640);
    await go("/en/services/design"); expect(window.scrollY).toBe(640);
    readAt(910);
    await go("/en/services/kitchen"); expect(window.scrollY).toBe(0);
    await go(-1); expect(window.scrollY).toBe(910);
    await go(-1); expect(window.scrollY).toBe(640);
    await go(1); expect(window.scrollY).toBe(910);
  });
  it("records an admin filtered entry for detail/back without resetting its scroll", async () => {
    await mount("/admin/services"); readAt(520);
    await go("/admin/services?status=published&page=1"); expect(window.scrollY).toBe(520);
    readAt(860); window.dispatchEvent(new Event("admin-route-layout")); expect(window.scrollY).toBe(860);
    await go("/admin/services/synthetic"); expect(window.scrollY).toBe(0);
    await go(-1); expect(location.search).toBe("?status=published&page=1"); expect(window.scrollY).toBe(860);
  });
  it("records admin fragment entries instead of losing the later reading position", async () => {
    await mount("/admin/services"); readAt(410);
    await go("/admin/services#section"); expect(window.scrollY).toBe(410);
    readAt(740); await go("/admin/services/synthetic");
    await go(-1); expect(location.hash).toBe("#section"); expect(window.scrollY).toBe(740);
  });
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
    const scroll = vi.spyOn(window, "scrollTo");
    scroll.mockClear();
    window.dispatchEvent(new Event("public-route-ready"));
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(window.scrollY).toBe(1110);
    expect(scroll).not.toHaveBeenCalled();
    window.dispatchEvent(new CustomEvent("public-route-layout", { detail: { routeKey: "/zh/old-route" } }));
    expect(scroll).not.toHaveBeenCalled();
  });
});
