import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFloatingOcclusion } from "./useFloatingOcclusion";

let root: Root;
let container: HTMLDivElement;
let contentTop = 700;
const rect = (top: number) => ({ x: 283, y: top, left: 283, right: 359, top, bottom: top + 76, width: 76, height: 76, toJSON: () => ({}) });
function Entry({ route }: { route: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hidden = useFloatingOcclusion(ref, route);
  return <a ref={ref} className="entry" href="/shop" data-obstructed={hidden || undefined}>Shop</a>;
}
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); contentTop = 700;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) { return rect(this.classList.contains("entry") ? 686 : contentTop); });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); document.getElementById("main-content")?.remove(); document.querySelector('[role="dialog"]')?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("floating promotion yields to content independently of routes", () => {
  it("hides for overlapping paragraphs, restores in free space and checks new route controls", async () => {
    const main = document.createElement("main"); main.id = "main-content"; main.innerHTML = "<p>Readable paragraph</p>"; document.body.append(main);
    act(() => root.render(<Entry route="/zh/projects" />));
    expect(container.querySelector("a")?.getAttribute("data-obstructed")).toBe("true");
    contentTop = 400; window.dispatchEvent(new Event("scroll")); await settle();
    expect(container.querySelector("a")?.hasAttribute("data-obstructed")).toBe(false);
    contentTop = 700; main.innerHTML = "<button>Submit</button>";
    act(() => root.render(<Entry route="/en/contact" />));
    expect(container.querySelector("a")?.getAttribute("data-obstructed")).toBe("true");
  });
  it("reacts to asynchronously inserted content and portal dialogs", async () => {
    const main = document.createElement("main"); main.id = "main-content"; document.body.append(main);
    act(() => root.render(<Entry route="/zh/blog" />));
    main.innerHTML = "<label>Form label</label>"; await settle();
    expect(container.querySelector("a")?.getAttribute("data-obstructed")).toBe("true");
    main.innerHTML = ""; await settle();
    expect(container.querySelector("a")?.hasAttribute("data-obstructed")).toBe(false);
    const dialog = document.createElement("div"); dialog.setAttribute("role", "dialog"); document.body.append(dialog); await settle();
    expect(container.querySelector("a")?.getAttribute("data-obstructed")).toBe("true");
  });
});
