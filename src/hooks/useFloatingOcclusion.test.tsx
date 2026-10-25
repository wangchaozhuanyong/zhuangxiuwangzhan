import { act, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFloatingOcclusion } from "./useFloatingOcclusion";

import { QUOTE_FORM_ID } from "@/lib/quoteFormTarget";

let root: Root;
let container: HTMLDivElement;
let content: HTMLDivElement;
let boxes: WeakMap<HTMLElement, DOMRect>;
const rect = (top = 700, left = 283, width = 76, height = 76): DOMRect => ({
  x: left, y: top, left, right: left + width, top, bottom: top + height, width, height, toJSON: () => ({}),
});
function Entry({ route, reposition = true, enabled }: { route: string; reposition?: boolean | "fixed"; enabled?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hidden = useFloatingOcclusion(ref, route, reposition, enabled);
  return <a ref={ref} className="entry" href="/shop" data-obstructed={hidden || undefined}>Shop</a>;
}
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
const entry = () => container.querySelector<HTMLAnchorElement>("a")!;
const expectObstructed = (expected: boolean) => expect(entry().hasAttribute("data-obstructed")).toBe(expected);
const expectAvoids = (action: HTMLElement) => {
  expectObstructed(false);
  const a = entry().getBoundingClientRect(), b = action.getBoundingClientRect();
  expect(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom).toBe(true);
};
const mount = () => act(() => root.render(<Entry route="/zh/projects" />));
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  boxes = new WeakMap();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const box = boxes.get(this) ?? rect(this.classList.contains("entry") ? 686 : 700);
    const lift = parseFloat(this.style.getPropertyValue("--fc-contact-lift")) || 0;
    return rect(box.top - lift, box.left, box.width, box.height);
  });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  content = document.createElement("div"); content.className = "scheme-a-public-shell"; document.body.append(content);
});
afterEach(() => { act(() => root.unmount()); container.remove(); content.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("floating promotion stays available while reading", () => {
  it("does not measure or subscribe while disabled, including after navigation", async () => {
    const mutations = vi.spyOn(MutationObserver.prototype, "observe");
    const resize = vi.fn();
    vi.stubGlobal("ResizeObserver", class { constructor() { resize(); } });
    const windowEvents = vi.spyOn(window, "addEventListener");
    const measurements = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    act(() => root.render(<Entry route="/zh" reposition="fixed" enabled={false} />));
    act(() => root.render(<Entry route="/en/projects" reposition="fixed" enabled={false} />));
    content.innerHTML = '<div role="dialog" aria-modal="true">Contact panel</div>';
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    await settle();
    expectObstructed(false);
    expect(measurements).not.toHaveBeenCalled();
    expect(mutations).not.toHaveBeenCalled();
    expect(resize).not.toHaveBeenCalled();
    expect(windowEvents.mock.calls.filter(([name]) => name === "scroll" || name === "resize")).toHaveLength(0);
  });

  it("disconnects disabled and unmounted entries and cancels their queued scans", async () => {
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    });
    const cancelFrame = vi.fn((id: number) => { frames.delete(id); });
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    const mutationDisconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const resizeDisconnect = vi.fn();
    const resizeCallbacks: (() => void)[] = [];
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { resizeCallbacks.push(callback); }
      observe() {}
      disconnect() { resizeDisconnect(); }
    });
    const measurements = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    content.innerHTML = '<div role="dialog" aria-modal="true">Contact panel</div>';
    act(() => root.render(<Entry route="/zh" reposition="fixed" />));
    expectObstructed(true);
    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(1);
    const [frameId, staleFrame] = [...frames][0];
    act(() => root.render(<Entry route="/zh" reposition="fixed" enabled={false} />));
    expectObstructed(false);
    expect(cancelFrame).toHaveBeenCalledWith(frameId);
    expect(frames.size).toBe(0);
    expect(mutationDisconnect).toHaveBeenCalledTimes(1);
    expect(resizeDisconnect).toHaveBeenCalledTimes(1);

    measurements.mockClear();
    requestFrame.mockClear();
    staleFrame(performance.now());
    resizeCallbacks[0]();
    content.innerHTML = "";
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("load"));
    await Promise.resolve();
    expect(measurements).not.toHaveBeenCalled();
    expect(requestFrame).not.toHaveBeenCalled();

    act(() => root.render(<Entry route="/en/projects" reposition="fixed" />));
    expectObstructed(false);
    expect(measurements).toHaveBeenCalled();
    content.innerHTML = '<div role="dialog" aria-modal="true">New dialog</div>';
    // Re-enabling and a route change both check current content synchronously.
    act(() => root.render(<Entry route="/en/contact" reposition="fixed" />));
    expectObstructed(true);
    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(1);
    const [unmountFrameId, unmountedFrame] = [...frames][0];
    act(() => root.render(null));
    expect(cancelFrame).toHaveBeenCalledWith(unmountFrameId);
    expect(frames.size).toBe(0);
    expect(mutationDisconnect).toHaveBeenCalledTimes(3);
    expect(resizeDisconnect).toHaveBeenCalledTimes(3);
    measurements.mockClear();
    requestFrame.mockClear();
    unmountedFrame(performance.now());
    resizeCallbacks.forEach((callback) => callback());
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    document.dispatchEvent(new Event("transitionend"));
    content.innerHTML = "";
    await Promise.resolve();
    expect(measurements).not.toHaveBeenCalled();
    expect(requestFrame).not.toHaveBeenCalled();
  });

  it.each(["fc-furniture-card__actions", "fc-route-contact-form", "scheme-a-actions"])(
    "keeps fixed chrome stable while unfocused %s controls pass underneath", async (className) => {
      content.innerHTML = `<div class="${className}"><form><input /><button>Continue</button></form></div>`;
      act(() => root.render(<Entry route="/zh/contact" reposition="fixed" />));
      for (const top of [710, 680, 700, 300, 720]) {
        content.querySelectorAll<HTMLElement>("input,button,form").forEach(node => boxes.set(node, rect(top)));
        window.dispatchEvent(new Event("scroll")); await settle();
        expectObstructed(false);
        expect(entry().style.getPropertyValue("--fc-contact-lift")).toBe("");
      }
      content.innerHTML = '<div role="dialog" aria-modal="true">Contact panel</div>';
      await settle(); expectObstructed(true);
      content.innerHTML = ''; await settle(); expectObstructed(false);
    },
  );

  it.each(['<input type="checkbox" />', '<input type="range" />', '<input readonly />', '<select><option>One</option></select>'])(
    "keeps fixed chrome visible for non-editing focus: %s", async (html) => {
      content.innerHTML = html + '<div class="smart-image-failure"><button>Retry image</button></div>';
      act(() => root.render(<Entry route="/zh/contact" reposition="fixed" />));
      content.querySelector<HTMLElement>("input,select")!.focus();
      await settle(); expectObstructed(false);
    },
  );

  it("restores the bottom dock after a content action leaves, without yielding to its companion contact entry", async () => {
    content.innerHTML = '<div class="fc-contact-stack"><button class="fc-contact-entry">Contact us</button></div><main><button>Request quote</button></main>';
    const action = content.querySelector<HTMLElement>("main button")!;
    act(() => root.render(<Entry route="/ms" reposition={false} />));
    await settle();
    expectObstructed(true);
    boxes.set(action, rect(300));
    window.dispatchEvent(new Event("scroll"));
    await settle();
    // CSS lowers the companion when the dock hides. It must not keep the
    // dock hidden once the actual page action no longer intersects it.
    expectObstructed(false);
  });

  it("keeps shared bottom docks yielding unless repositioning is explicitly enabled", async () => {
    content.innerHTML = '<button type="submit">Submit</button>';
    act(() => root.render(<Entry route="/zh/quote" reposition={false} />));
    await settle();
    expectObstructed(true);
    expect(entry().style.getPropertyValue("--fc-contact-lift")).toBe("");
    expect(entry().hasAttribute("data-compact")).toBe(false);
  });
  it.each([
    [`#${QUOTE_FORM_ID}`, `<div id="${QUOTE_FORM_ID}"><button type="submit">Submit</button></div>`, "button"],
    [".fc-route-contact-form form", '<div class="fc-route-contact-form"><form><button type="submit">Send</button></form></div>', "button"],
  ])("protects %s controls and restores the entries after they leave the corner", async (_, html, controlSelector) => {
    content.innerHTML = html;
    const action = content.querySelector<HTMLElement>(controlSelector)!;
    mount(); await settle(); expectObstructed(true);
    boxes.set(action, rect(300));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
  });

  it.each(["fc-furniture-card__actions", "fc-furniture-pagination", "scheme-a-footer__invitation-actions"])(
    "moves around overlapping %s links while keeping entries available",
    async (className) => {
      content.innerHTML = `<div class="${className}"><a href="/shop">Buy</a></div>`;
      const action = content.querySelector<HTMLElement>("a")!;
      mount(); await settle();
      expectAvoids(action);
      boxes.set(action, rect(300));
      window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    },
  );
  it.each(["scheme-a-button", "scheme-a-page-cta__button", "fc-route-button"])(
    "protects the shared %s primary action outside a furniture page",
    async (className) => {
      content.innerHTML = `<main><a class="${className}" href="/quote">Request quote</a></main>`;
      mount(); await settle(); expectAvoids(content.querySelector("a")!);
      content.querySelector("a")!.setAttribute("aria-disabled", "true");
      await settle(); expectObstructed(false);
    },
  );
  it.each([
    '<button type="button">Filter</button>',
    '<a href="/en/quote">Request quote</a>',
    '<a href="https://wa.me/123">Enquire</a>',
    '<input type="submit" value="Send" />',
  ])("protects enabled primary controls without relying on a page-specific class: %s", async (html) => {
    content.innerHTML = `<main>${html}</main>`;
    const action = content.querySelector<HTMLElement>("main > *")!;
    mount(); await settle(); expectAvoids(action);
    action.hidden = true; await settle(); expectObstructed(false);
    action.hidden = false; await settle(); expectAvoids(action);
    boxes.set(action, rect(-100));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
  });
  it.each([
    '<button type="button">Back to top</button>',
    '<button class="language-selector" type="button">BM</button>',
    '<a class="public-contact-row" href="mailto:studio@example.test">Email studio</a>',
  ])("protects shared footer controls outside main content: %s", async (html) => {
    content.innerHTML = `<footer>${html}</footer>`;
    const action = content.querySelector<HTMLElement>("footer > *")!;
    mount(); await settle(); expectAvoids(action);
    boxes.set(action, rect(300));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
  });
  it.each([
    '<button type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">Directions</button>',
    '<button type="button" aria-expanded="false" data-state="closed">Expand details</button>',
    '<a href="/quote" role="button" aria-expanded="false" data-state="closed">Open quote</a>',
  ])("protects visible closed triggers without exposing a closed parent panel: %s", async (html) => {
    content.innerHTML = `<main><div data-state="open">${html}</div></main>`;
    const panel = content.querySelector<HTMLElement>("main > div")!;
    mount(); await settle(); expectAvoids(panel.querySelector<HTMLElement>("button,a")!);
    panel.setAttribute("data-state", "closed"); await settle(); expectObstructed(false);
    panel.setAttribute("data-state", "open"); await settle(); expectAvoids(panel.querySelector<HTMLElement>("button,a")!);
    panel.style.visibility = "hidden"; await settle(); expectObstructed(false);
  });
  it("keeps entries available when furniture purchase actions are visible without overlap", async () => {
    content.innerHTML = '<div class="fc-furniture-detail__actions"><a href="/shop">Buy now</a><a href="/contact">WhatsApp</a></div>';
    const actions = content.querySelector<HTMLElement>(".fc-furniture-detail__actions")!;
    const moveActions = (top: number) => {
      boxes.set(actions, rect(top, 600, 320, 50));
      actions.querySelectorAll<HTMLElement>("a").forEach((action) => boxes.set(action, rect(top, 600, 140, 50)));
    };
    moveActions(600);
    mount(); expectObstructed(false);
    moveActions(-100);
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    moveActions(400);
    window.dispatchEvent(new Event("resize")); await settle(); expectObstructed(false);
    expect(entry().style.getPropertyValue("--fc-contact-lift")).toBe("");
    actions.remove(); await settle(); expectObstructed(false);
  });

  it("avoids purchase controls, resists edge jitter and clears placement on navigation", async () => {
    vi.stubGlobal("innerHeight", 900);
    content.innerHTML = '<div class="fc-furniture-detail__actions"><a href="/shop">Buy</a></div>';
    const action = content.querySelector<HTMLElement>("a")!;
    mount(); await settle(); expectAvoids(action);
    const lifted = entry().style.getPropertyValue("--fc-contact-lift");
    expect(parseFloat(lifted)).toBeGreaterThan(0);
    boxes.set(action, rect(772)); window.dispatchEvent(new Event("scroll")); await settle();
    expect(entry().style.getPropertyValue("--fc-contact-lift")).toBe(lifted);
    boxes.set(action, rect(780)); window.dispatchEvent(new Event("scroll")); await settle();
    expect(entry().style.getPropertyValue("--fc-contact-lift")).toBe("0px");
    boxes.set(action, rect()); window.dispatchEvent(new Event("scroll")); await settle(); expectAvoids(action);
    action.remove();
    act(() => root.render(<Entry route="/en/furniture/bedroom" />));
    expect(entry().style.getPropertyValue("--fc-contact-lift")).toBe("");
    expectObstructed(false);
  });
  it("ignores overlapping text, cards, links and idle form controls across scrolling and routes", async () => {
    content.innerHTML = '<main id="main-content"><h1>Heading</h1><p>Paragraph</p><a href="/article"><h2>Whole card</h2><p>Card text</p></a><label>Form label<input /></label></main>';
    const ordinary = Array.from(content.querySelectorAll<HTMLElement>("h1,h2,p,a,label,input"));
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
    'data-interaction-feedback="public"', 'class="public-route-feedback__recovery"', 'class="public-update-notice"', 'class="smart-image-failure"',
  ])("yields to overlapping recovery UI (%s) and restores when it moves or is removed", async (attributes) => {
    mount(); entry().focus(); await settle();
    content.innerHTML = `<aside ${attributes}><button>Retry</button></aside>`;
    await settle(); expectObstructed(true);
    const feedback = content.querySelector("aside")!;
    boxes.set(feedback, rect(100));
    boxes.set(feedback.querySelector("button")!, rect(100));
    window.dispatchEvent(new Event("scroll")); await settle(); expectObstructed(false);
    boxes.set(feedback, rect());
    boxes.set(feedback.querySelector("button")!, rect());
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

  it("also protects a recovery message at the entry's lifted position", async () => {
    content.innerHTML = '<button>Buy</button><aside data-interaction-feedback="public">Retry</aside>';
    const feedback = content.querySelector("aside")!;
    boxes.set(feedback, rect(620, 283, 76, 30));
    mount(); await settle(); expectObstructed(true);
    feedback.remove(); await settle(); expectAvoids(content.querySelector("button")!);
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
