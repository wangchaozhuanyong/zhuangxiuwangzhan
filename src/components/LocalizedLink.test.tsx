import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { PUBLIC_NAVIGATION_EVENT } from "@/lib/publicNavigation";
import LocalizedLink from "./LocalizedLink";

let root: Root;
let container: HTMLDivElement;
const Location = () => { const location = useLocation(); return <output>{location.pathname}{location.search}{location.hash}</output>; };
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/zh/projects");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const render = async (to: string, target?: string) => {
  await act(() => root.render(<LanguageProvider><MemoryRouter initialEntries={["/zh/projects"]}>
    <LocalizedLink to={to} target={target}>link</LocalizedLink><Location />
  </MemoryRouter></LanguageProvider>));
  return container.querySelector("a")!;
};

describe("localized navigation after the router upgrade", () => {
  it("keeps quote context and lets the public frame commit the SPA transition", async () => {
    const link = await render("/quote?source=project&title=Concept%20A#form");
    const listener = vi.fn((event: Event) => {
      event.preventDefault();
      (event as CustomEvent<{ commit: () => void }>).detail.commit();
    });
    window.addEventListener(PUBLIC_NAVIGATION_EVENT, listener, { once: true });
    await act(() => link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })));
    expect(listener).toHaveBeenCalledOnce();
    expect(container.querySelector("output")).toHaveTextContent("/zh/quote?source=project&title=Concept%20A#form");
  });

  it.each(["https://example.com/shop", "mailto:team@example.com", "tel:+60123456789", "//example.com/shop"])(
    "preserves an external destination %s", async (to) => {
      const link = await render(to);
      expect(link.getAttribute("href")).toBe(to);
    },
  );

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }])(
    "leaves modifier clicks to the browser %s", async (modifiers) => {
      const link = await render("/contact");
      // jsdom can perform a hash default action, but cannot open a new document.
      link.setAttribute("href", "#browser-default");
      const listener = vi.fn();
      window.addEventListener(PUBLIC_NAVIGATION_EVENT, listener);
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...modifiers });
      await act(() => link.dispatchEvent(event));
      expect(listener).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      window.removeEventListener(PUBLIC_NAVIGATION_EVENT, listener);
    },
  );
});
