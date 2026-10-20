import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFloatingOcclusion } from "./useFloatingOcclusion";

let root: Root;
let container: HTMLDivElement;
let content: HTMLDivElement;
let boxes: WeakMap<HTMLElement, DOMRect>;
const rect = (top = 700, left = 283, width = 76, height = 76): DOMRect => ({
  x: left, y: top, left, right: left + width, top, bottom: top + height, width, height, toJSON: () => ({}),
});
function Entry({ route }: { route: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hidden = useFloatingOcclusion(ref, route);
  return <a ref={ref} className="entry" href="/shop" data-obstructed={hidden || undefined}>Shop</a>;
}
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
const entry = () => container.querySelector<HTMLAnchorElement>("a")!;
const expectObstructed = (expected: boolean) => expect(entry().hasAttribute("data-obstructed")).toBe(expected);
const mount = () => act(() => root.render(<Entry route="/zh/projects" />));
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  boxes = new WeakMap();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return boxes.get(this) ?? rect(this.classList.contains("entry") ? 686 : 700);
  });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  content = document.createElement("div"); content.className = "scheme-a-public-shell"; document.body.append(content);
});
afterEach(() => { act(() => root.unmount()); container.remove(); content.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("floating promotion stays available while reading", () => {
  it.each(["fc-furniture-detail__actions", "fc-furniture-card__actions", "fc-furniture-pagination"])("protects %s controls and restores the entries after they leave the corner", async (className) => {
    content.innerHTML = `<div class="${className}"><a href="/shop">Buy</a></div>`;
    const action = content.querySelector<HTMLAnchorElement>("a")!;
    mount(); await settle(); expectObstructed(true);
    boxes.set(action, rect(300));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
  });
  it("ignores overlapping text, cards, links and idle form controls across scrolling and routes", async () => {
    content.innerHTML = '<main id="main-content"><h1>Heading</h1><p>Paragraph</p><a href="/article"><h2>Whole card</h2><p>Card text</p></a><label>Form label<input /></label><button>Submit</button></main>';
    const ordinary = Array.from(content.querySelectorAll<HTMLElement>("h1,h2,p,a,label,input,button"));
    const measurements = ordinary.map(element => {
      const measure = vi.fn(() => boxes.get(element) ?? rect());
      element.getBoundingClientRect = measure;
      return measure;
    });
    ordinary.forEach(element => boxes.set(element, rect(686, 0, 390, 160)));
    mount();
    expectObstructed(false);
    for (const top of [100, 680, 740, 900, 686]) {
      ordinary.forEach(element => boxes.set(element, rect(top, 0, 390, 160)));
      window.dispatchEvent(new Event("scroll")); await settle();
      expectObstructed(false);
    }
    act(() => root.render(<Entry route="/en/contact" />));
    expectObstructed(false);
    measurements.forEach(measure => expect(measure).not.toHaveBeenCalled());
  });

  it("only yields to an overlapping focused form control and restores on scroll or blur", async () => {
    content.innerHTML = '<input aria-label="Name" /><textarea aria-label="Message"></textarea><a href="/article">Read more</a>';
    const input = content.querySelector("input")!;
    const textarea = content.querySelector("textarea")!;
    mount();
    expectObstructed(false);
    input.focus(); await settle(); expectObstructed(true);
    boxes.set(input, rect(400));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    textarea.focus(); await settle(); expectObstructed(true);
    textarea.blur(); await settle(); expectObstructed(false);
    content.querySelector("a")!.focus(); await settle(); expectObstructed(false);
  });

  it("lets a visible modal take priority over the promotion's old focus, even without geometric overlap", async () => {
    mount();
    entry().focus(); await settle();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true");
    boxes.set(dialog, rect(100, 20, 200, 100));
    content.append(dialog); await settle();
    expect(document.activeElement).toBe(entry());
    expectObstructed(true);
    dialog.setAttribute("data-state", "closed"); await settle(); expectObstructed(false);
    dialog.setAttribute("data-state", "open"); await settle(); expectObstructed(true);
    dialog.remove(); await settle(); expectObstructed(false);
  });

  it.each([
    ["hidden", ""], ["aria-hidden", "true"], ["inert", ""],
    ["style", "opacity: 0"], ["style", "display: none"], ["style", "visibility: hidden"],
  ])("ignores a modal beneath a hidden ancestor (%s=%s) and restores after close", async (attribute, value) => {
    content.innerHTML = '<section><div role="dialog" aria-modal="true"></div></section>';
    const parent = content.querySelector("section")!;
    parent.setAttribute(attribute, value);
    mount(); expectObstructed(false);
    parent.removeAttribute(attribute); await settle(); expectObstructed(true);
    parent.setAttribute(attribute, value); await settle(); expectObstructed(false);
  });

  it("ignores closed native dialogs and offscreen modals", async () => {
    content.innerHTML = '<dialog role="dialog" aria-modal="true">Confirm</dialog><div role="dialog" aria-modal="true"></div>';
    const native = content.querySelector("dialog")!;
    const offscreen = content.querySelector<HTMLDivElement>("div")!;
    boxes.set(offscreen, rect(1200));
    mount(); expectObstructed(false);
    native.open = true; await settle(); expectObstructed(true);
    native.open = false; await settle(); expectObstructed(false);
    offscreen.setAttribute("aria-modal", "false");
    boxes.set(offscreen, rect());
    await settle(); expectObstructed(false);
  });

  it("waits for a pointer-blocking decorative overlay to leave after its panel closes", async () => {
    content.innerHTML = '<div data-dialog-overlay aria-hidden="true" data-state="open"></div>';
    const overlay = content.querySelector<HTMLElement>("[data-dialog-overlay]")!;
    mount(); expectObstructed(true);
    overlay.setAttribute("data-state", "closed"); await settle(); expectObstructed(true);
    overlay.style.pointerEvents = "none"; await settle(); expectObstructed(false);
    overlay.style.pointerEvents = "auto"; await settle(); expectObstructed(true);
    overlay.remove(); await settle(); expectObstructed(false);
  });

  it.each([
    'data-interaction-feedback="public"', 'class="public-route-feedback__recovery"', 'class="public-update-notice"',
  ])("yields to overlapping recovery UI (%s) and restores when it moves or is removed", async (attributes) => {
    mount(); entry().focus(); await settle();
    content.innerHTML = `<aside ${attributes}><button>Retry</button></aside>`;
    await settle(); expectObstructed(true);
    const feedback = content.querySelector("aside")!;
    boxes.set(feedback, rect(100));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    boxes.set(feedback, rect());
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(true);
    feedback.remove(); await settle(); expectObstructed(false);
  });

  it("does not reserve room for transparent recovery UI or a hidden focused input", async () => {
    content.innerHTML = '<section><aside data-interaction-feedback="public">Retry</aside><input aria-label="Name" /></section>';
    mount(); expectObstructed(true);
    content.querySelector("input")!.focus(); await settle();
    const parent = content.querySelector("section")!;
    parent.style.opacity = "0"; await settle(); expectObstructed(false);
    parent.style.opacity = "1"; await settle(); expectObstructed(true);
    parent.remove(); await settle(); expectObstructed(false);
  });

  it.each([
    '<input aria-label="Name" />', '<textarea aria-label="Details"></textarea>',
    '<select aria-label="Project"><option>Kitchen</option></select>',
    '<button>Submit</button>', '<a href="/contact">Contact</a>',
  ])("yields to an idle quote control, stays hidden after blur, and restores outside overlap (%s)", async (markup) => {
    content.innerHTML = `<section id="quote-form">${markup}</section>`;
    const control = content.querySelector<HTMLElement>("#quote-form > *")!;
    mount(); expectObstructed(true);
    control.focus(); await settle(); expectObstructed(true);
    control.blur(); await settle(); expectObstructed(true);
    boxes.set(control, rect(300));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    boxes.set(control, rect());
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(true);
    control.remove(); await settle(); expectObstructed(false);
  });

  it("rechecks disabled quote controls and preserves ordinary idle controls", async () => {
    content.innerHTML = '<section id="quote-form"><input disabled /></section><input aria-label="Ordinary input" />';
    const control = content.querySelector<HTMLInputElement>("#quote-form input")!;
    mount(); expectObstructed(false);
    control.disabled = false; await settle(); expectObstructed(true);
    control.disabled = true; await settle(); expectObstructed(false);
    control.disabled = false; control.setAttribute("aria-disabled", "true"); await settle(); expectObstructed(false);
    control.removeAttribute("aria-disabled"); await settle(); expectObstructed(true);
    control.type = "hidden"; await settle(); expectObstructed(false);
  });

  it("also yields to overlapping contact form controls until they leave the entry area", async () => {
    content.innerHTML = '<section class="fc-route-contact-form"><form><button type="submit">Send</button></form></section>';
    const control = content.querySelector("button")!;
    mount(); expectObstructed(true);
    boxes.set(control, rect(200)); window.dispatchEvent(new Event("scroll"));
    await settle(); expectObstructed(false);
  });

  it.each([
    ["hidden", ""], ["aria-hidden", "true"], ["inert", ""],
    ["style", "opacity: 0"], ["style", "display: none"], ["style", "visibility: hidden"],
  ])("ignores idle quote controls beneath hidden ancestors (%s=%s)", async (attribute, value) => {
    content.innerHTML = '<section id="quote-form"><div><input /></div></section>';
    const ancestor = content.querySelector("#quote-form > div")!;
    ancestor.setAttribute(attribute, value); mount(); expectObstructed(false);
    ancestor.removeAttribute(attribute); await settle(); expectObstructed(true);
    ancestor.setAttribute(attribute, value); await settle(); expectObstructed(false);
  });

  it("rechecks viewport and recovery changes without hiding controls outside the viewport", async () => {
    const viewport = new EventTarget();
    vi.stubGlobal("visualViewport", viewport);
    content.innerHTML = '<section id="quote-form"><input /></section>';
    const control = content.querySelector("input")!;
    boxes.set(control, rect(1200)); mount(); expectObstructed(false);
    boxes.set(control, rect()); viewport.dispatchEvent(new Event("resize")); await settle(); expectObstructed(true);
    boxes.set(control, rect(300)); viewport.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    content.insertAdjacentHTML("beforeend", '<aside data-interaction-feedback="public"><button>Retry</button></aside>');
    await settle(); expectObstructed(true);
    content.querySelector("aside")!.remove(); await settle(); expectObstructed(false);
    boxes.set(control, rect()); window.dispatchEvent(new Event("resize")); await settle(); expectObstructed(true);
    act(() => root.render(<Entry route="/zh/quote" />)); expectObstructed(true);
    content.querySelector("section")!.remove(); await settle(); expectObstructed(false);
  });
});
