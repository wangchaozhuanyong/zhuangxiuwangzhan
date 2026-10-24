import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { PublicChromeProvider, usePublicChrome } from "./PublicChromeContext";

const Mode = () => <output>{usePublicChrome().showMobileActionBar ? "actions" : "navigation"}</output>;
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it("switches only after deliberate travel and ignores bottom overscroll rebound", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  vi.stubGlobal("innerHeight", 800);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(2000);
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("scrollY", 0);
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  const scroll = (y: number) => act(() => { vi.stubGlobal("scrollY", y); window.dispatchEvent(new Event("scroll")); vi.runAllTimers(); });
  try {
    act(() => root.render(<PublicChromeProvider isAdminRoute={false} routeKey="furniture" mobileActionBarMode="scroll-up"><Mode /></PublicChromeProvider>));
    expect(container).toHaveTextContent("navigation");
    scroll(160); expect(container).toHaveTextContent("actions");
    scroll(155); scroll(165); expect(container).toHaveTextContent("actions");
    scroll(1200); scroll(1280); scroll(1200);
    expect(container).toHaveTextContent("actions");
    scroll(1160); expect(container).toHaveTextContent("navigation");
    scroll(1165); expect(container).toHaveTextContent("navigation");
    scroll(1200); expect(container).toHaveTextContent("actions");
    scroll(0); scroll(-70); scroll(0); expect(container).toHaveTextContent("navigation");
  } finally { act(() => root.unmount()); container.remove(); }
});
