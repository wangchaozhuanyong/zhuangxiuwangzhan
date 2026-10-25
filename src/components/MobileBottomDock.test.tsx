import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MobileBottomDock from "@/components/MobileBottomDock";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";

const chrome = vi.hoisted(() => ({ menuOpen: false, hasOpenDialog: false, showMobileActionBar: false }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePublicChrome: () => chrome }));
vi.mock("@/components/MobileActionBar", () => ({ default: () => <nav>Contact actions</nav> }));
vi.mock("@/components/scheme-a/SchemeAPublicChrome", () => ({ SchemeAMobileDock: () => <nav>Navigation</nav> }));

describe("MobileBottomDock focus recovery", () => {
  let container: HTMLDivElement;
  let root: Root;
  let navigate: NavigateFunction;
  let mobileViewport: boolean;
  let mobileMedia: MediaQueryList;

  const changeViewport = (mobile: boolean) => act(() => {
    mobileViewport = mobile;
    mobileMedia.dispatchEvent(new Event("change"));
  });

  const Fixture = () => {
    const location = useLocation();
    navigate = useNavigate();
    return <>
      {location.pathname === "/form" && <input aria-label="Project name" autoFocus />}
      <MobileBottomDock />
    </>;
  };
  const dock = () => container.querySelector('[data-testid="mobile-bottom-dock"]');
  const render = (path = "/") => act(() => root.render(
    <MemoryRouter initialEntries={[path]}><Fixture /></MemoryRouter>,
  ));

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mobileViewport = true;
    mobileMedia = Object.defineProperties(new EventTarget(), {
      matches: { get: () => mobileViewport },
      media: { value: "(max-width: 767px)" },
    }) as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => mobileMedia));
    chrome.menuOpen = false;
    chrome.hasOpenDialog = false;
    chrome.showMobileActionBar = false;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.useFakeTimers();
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the desktop dock mounted without observing or measuring page changes", async () => {
    mobileViewport = false;
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const measurements = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const windowEvents = vi.spyOn(window, "addEventListener");
    render();
    const originalDock = dock();
    const panels = Array.from(originalDock!.children);
    expect(panels).toHaveLength(2);
    act(() => { navigate("/projects?view=all"); });
    container.appendChild(document.createElement("aside"));
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("resize"));
      await Promise.resolve();
      vi.runAllTimers();
    });
    expect(observe).not.toHaveBeenCalled();
    expect(measurements).not.toHaveBeenCalled();
    expect(windowEvents.mock.calls.filter(([name]) => name === "scroll" || name === "resize")).toHaveLength(0);

    changeViewport(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(observe).toHaveBeenCalledTimes(1);
    expect(measurements).toHaveBeenCalled();
    expect(dock()).toBe(originalDock);
    expect(Array.from(dock()!.children)).toEqual(panels);

    changeViewport(false);
    expect(disconnect).toHaveBeenCalledTimes(1);
    measurements.mockClear();
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      container.appendChild(document.createElement("aside"));
      await Promise.resolve();
      vi.runAllTimers();
    });
    expect(measurements).not.toHaveBeenCalled();
    expect(dock()).toBe(originalDock);
  });

  it("checks current modal protection when the mobile breakpoint activates and removes its media listener on unmount", async () => {
    mobileViewport = false;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 100, left: 0, top: 100, right: 390, bottom: 160, width: 390, height: 60, toJSON: () => ({}),
    });
    const mediaListener = vi.spyOn(mobileMedia, "addEventListener");
    const removeMediaListener = vi.spyOn(mobileMedia, "removeEventListener");
    const observe = vi.spyOn(MutationObserver.prototype, "observe");
    render();
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    container.append(modal);
    changeViewport(true);
    expect(dock()).toHaveAttribute("data-mode", "hidden");

    changeViewport(false);
    modal.remove();
    changeViewport(true);
    expect(dock()).toHaveAttribute("data-mode", "navigation");
    await act(async () => {
      container.append(modal);
      await Promise.resolve();
      vi.runAllTimers();
    });
    expect(dock()).toHaveAttribute("data-mode", "hidden");

    const listener = mediaListener.mock.calls.find(([name]) => name === "change")![1];
    act(() => root.render(null));
    expect(removeMediaListener).toHaveBeenCalledWith("change", listener);
    observe.mockClear();
    changeViewport(false);
    changeViewport(true);
    expect(observe).not.toHaveBeenCalled();
  });

  it.each(["text", "search", "email", "tel", "url", "password", "number", "textarea", "contenteditable"])(
    "hides for %s editing and restores after focus leaves",
    (kind) => {
      render();
      const field = document.createElement(kind === "textarea" ? "textarea" : kind === "contenteditable" ? "div" : "input");
      if (field instanceof HTMLInputElement) field.type = kind;
      if (kind === "contenteditable") {
        field.setAttribute("contenteditable", "true");
        field.tabIndex = 0;
      }
      container.appendChild(field);
      act(() => field.focus());
      expect(dock()).toHaveAttribute("data-mode", "hidden");
      act(() => {
        field.blur();
        vi.runAllTimers();
      });
      expect(dock()).toHaveAttribute("data-mode", "navigation");
      field.remove();
    },
  );

  it.each(["range", "checkbox", "radio", "button", "select"])(
    "keeps navigation visible when the %s control is focused",
    (kind) => {
      render();
      const control = document.createElement(kind === "select" ? "select" : "input");
      if (control instanceof HTMLInputElement) control.type = kind;
      container.appendChild(control);
      act(() => control.focus());
      expect(control).toHaveFocus();
      expect(dock()).toHaveAttribute("data-mode", "navigation");
      control.remove();
    },
  );

  it("keeps contact actions visible when the image comparison takes focus", () => {
    chrome.showMobileActionBar = true;
    act(() => root.render(<MemoryRouter>
      <MobileBottomDock />
      <ImageComparisonSlider ariaLabel="Compare images" className="comparison" initialValue={50} positionVariable="--compare-position">
        <span>Images</span>
      </ImageComparisonSlider>
    </MemoryRouter>));
    const slider = container.querySelector<HTMLDivElement>(".comparison")!;
    const input = slider.querySelector("input")!;
    const pointer = new Event("pointerdown", { bubbles: true, cancelable: true });
    Object.defineProperties(pointer, { isPrimary: { value: true }, pointerType: { value: "touch" }, pointerId: { value: 1 }, clientX: { value: 50 }, clientY: { value: 50 } });
    act(() => slider.dispatchEvent(pointer));
    expect(input).toHaveFocus();
    expect(dock()).toHaveAttribute("data-mode", "actions");
  });

  it("recognizes a field focused before the dock subscribes", () => {
    render("/form");
    expect(container.querySelector("input")).toHaveFocus();
    expect(dock()).toHaveAttribute("data-mode", "hidden");
  });

  it("restores navigation when a route removes the focused field without focusout", () => {
    render("/form");
    expect(dock()).toHaveAttribute("data-mode", "hidden");
    const field = container.querySelector("input")!;
    field.addEventListener("focusout", (event) => event.stopPropagation());
    act(() => { navigate("/"); });
    expect(container.querySelector("input")).toBeNull();
    expect(dock()).toHaveAttribute("data-mode", "navigation");
  });

  it("continues avoiding a focused field retained across query navigation", () => {
    render("/form");
    const field = container.querySelector("input");
    act(() => { navigate("/form?step=2"); });
    expect(field).toHaveFocus();
    expect(dock()).toHaveAttribute("data-mode", "hidden");
  });

  it("keeps navigation visible for read-only text", () => {
    render();
    const field = document.createElement("input");
    field.readOnly = true;
    container.appendChild(field);
    act(() => field.focus());
    expect(field).toHaveFocus();
    expect(dock()).toHaveAttribute("data-mode", "navigation");
    field.remove();
  });

  it("hides both panels for a registered language dialog and restores navigation on close", () => {
    chrome.hasOpenDialog = true;
    render();
    expect(dock()).toHaveAttribute("data-mode", "hidden");
    chrome.hasOpenDialog = false;
    render();
    expect(dock()).toHaveAttribute("data-mode", "navigation");
  });

  it("still hides both panels while the menu is open", () => {
    chrome.menuOpen = true;
    render();
    expect(dock()).toHaveAttribute("data-mode", "hidden");
    expect(container.querySelectorAll('[data-active="false"]')).toHaveLength(2);
  });

  it("restores navigation after editing even while a page button crosses the dock", async () => {
    let overlap = true;
    const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const top = this.classList.contains("scheme-a-mobile-switcher") ? 700
        : this.tagName === "BUTTON" ? overlap ? 710 : 400 : 300;
      return { x: 0, y: top, left: 0, top, right: 390, bottom: top + 60, width: 390, height: 60, toJSON: () => ({}) };
    });
    render();
    const fixture = document.createElement("div");
    fixture.className = "scheme-a-public-shell";
    fixture.innerHTML = '<form><input aria-label="Last field" /><button type="submit">Submit</button></form>';
    container.appendChild(fixture);
    try {
      await act(async () => { fixture.querySelector("input")!.focus(); await Promise.resolve(); vi.runAllTimers(); });
      expect(dock()).toHaveAttribute("data-mode", "hidden");
      await act(async () => { fixture.querySelector("button")!.focus(); await Promise.resolve(); vi.runAllTimers(); });
      expect(dock()).toHaveAttribute("data-mode", "navigation");
      overlap = false;
      await act(async () => { fixture.querySelector("button")!.blur(); window.dispatchEvent(new Event("scroll")); vi.runAllTimers(); });
      expect(dock()).toHaveAttribute("data-mode", "navigation");
    } finally { fixture.remove(); bounds.mockRestore(); }
  });
});
