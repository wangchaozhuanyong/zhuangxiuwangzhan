import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MobileBottomDock from "@/components/MobileBottomDock";
import ImageComparisonSlider from "@/components/ImageComparisonSlider";

const chrome = vi.hoisted(() => ({ menuOpen: false, showMobileActionBar: false }));
vi.mock("@/contexts/PublicChromeContext", () => ({ usePublicChrome: () => chrome }));
vi.mock("@/components/MobileActionBar", () => ({ default: () => <nav>Contact actions</nav> }));
vi.mock("@/components/scheme-a/SchemeAPublicChrome", () => ({ SchemeAMobileDock: () => <nav>Navigation</nav> }));

describe("MobileBottomDock focus recovery", () => {
  let container: HTMLDivElement;
  let root: Root;
  let navigate: NavigateFunction;

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
    chrome.menuOpen = false;
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

  it("still hides both panels while the menu is open", () => {
    chrome.menuOpen = true;
    render();
    expect(dock()).toHaveAttribute("data-mode", "hidden");
    expect(container.querySelectorAll('[data-active="false"]')).toHaveLength(2);
  });
});
