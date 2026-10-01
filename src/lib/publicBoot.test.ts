import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initializePublicBoot } from "./publicBoot";
import { publicContentStatusText } from "../i18n/publicContentStatusText";

const markup = '<div id="flashcast-public-boot" data-route-loader="initial"><p data-boot-copy="loaderPending"></p><div data-boot-recovery hidden><button data-boot-action="retry" data-boot-copy="loaderRetry"></button><button data-boot-action="continue" hidden></button></div></div><div id="root"></div>';
let listeners: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  window.history.replaceState(null, "", "/zh");
  document.body.innerHTML = markup;
  listeners = vi.spyOn(document, "addEventListener");
});
afterEach(() => {
  window.__flashcastPublicBoot?.dismiss();
  delete window.__flashcastPublicBoot;
  for (const [name, handler, options] of listeners.mock.calls) document.removeEventListener(name as string, handler as EventListener, options as boolean);
  document.body.replaceChildren();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("public document boot", () => {
  it("owns the prepaint theme, copy and the same screen before React exists", () => {
    const screen = document.getElementById("flashcast-public-boot");
    const boot = initializePublicBoot()!;
    expect(document.documentElement.dataset.publicBoot).toBe("waiting");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.getElementById("root")).toHaveAttribute("inert");
    expect(screen?.textContent).toContain(publicContentStatusText.zh.loaderPending);
    expect(initializePublicBoot()).toBe(boot);
    expect(document.getElementById("flashcast-public-boot")).toBe(screen);
  });
  it("shows the template's original brand node before body parsing and moves it without a duplicate", async () => {
    const body = document.body;
    body.remove();
    const template = document.createElement("template");
    template.id = "flashcast-public-boot-template";
    template.innerHTML = '<div id="flashcast-public-boot" data-route-loader="initial"><p data-boot-copy="loaderPending"></p></div>';
    const screen = template.content.firstElementChild;
    document.head.append(template);
    try {
      initializePublicBoot();
      expect(document.getElementById("flashcast-public-boot")).toBe(screen);
      expect(screen?.parentElement).toBe(document.documentElement);
      body.innerHTML = '<div id="root"></div>';
      document.documentElement.append(body);
      await Promise.resolve();
      expect(screen?.parentElement).toBe(body);
      expect(document.querySelectorAll("#flashcast-public-boot")).toHaveLength(1);
      expect(document.getElementById("root")).toHaveAttribute("inert");
    } finally { if (!body.isConnected) document.documentElement.append(body); }
  });
  it("keeps recovery available after five seconds and uses the current attempt's handlers", async () => {
    const boot = initializePublicBoot()!;
    const first = { retry: vi.fn(), continue: vi.fn(), timeout: vi.fn() };
    const release = boot.claim(first);
    await vi.advanceTimersByTimeAsync(5010);
    expect(boot.state).toBe("timeout");
    expect(document.querySelector("[data-boot-recovery]")).not.toHaveAttribute("hidden");
    expect(first.timeout).toHaveBeenCalledOnce();
    release();
    const next = { retry: vi.fn(), continue: vi.fn(), timeout: vi.fn() };
    boot.claim(next);
    document.querySelector<HTMLButtonElement>('[data-boot-action="retry"]')!.click();
    expect(first.retry).not.toHaveBeenCalled();
    expect(next.retry).toHaveBeenCalledOnce();
    boot.retry();
    expect(boot.state).toBe("waiting");
    expect(document.querySelector("[data-boot-recovery]")).toHaveAttribute("hidden");
  });
  it("hands off once, marks explicit continuation degraded and never reopens for late events", async () => {
    const boot = initializePublicBoot()!;
    const prepare = vi.fn();
    window.addEventListener("public-scene-prepare", prepare);
    const first = boot.complete(true);
    expect(boot.complete()).toBe(first);
    await first;
    expect(boot.state).toBe("degraded");
    expect(document.getElementById("flashcast-public-boot")).toBeNull();
    expect(document.getElementById("root")).not.toHaveAttribute("inert");
    boot.retry();
    document.dispatchEvent(new Event("loadingdone"));
    await vi.advanceTimersByTimeAsync(6000);
    expect(boot.state).toBe("degraded");
    expect(prepare).toHaveBeenCalledOnce();
    window.removeEventListener("public-scene-prepare", prepare);
  });
  it("cancels a superseded handoff without letting its callback unlock the new route", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    const finishes: (() => void)[] = [];
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: () => ({
      finished: new Promise<void>((resolve) => finishes.push(resolve)), cancel: vi.fn(),
    }) });
    const boot = initializePublicBoot()!;
    const stale = boot.complete();
    boot.hold();
    finishes[0]();
    await stale;
    expect(boot.state).toBe("waiting");
    expect(document.getElementById("root")).toHaveAttribute("inert");
    const current = boot.complete();
    finishes[1]();
    await current;
    expect(boot.state).toBe("ready");
  });
  it("keeps critical CSS pending while external fonts remain optional", () => {
    const boot = initializePublicBoot()!;
    const fonts = document.createElement("link");
    fonts.setAttribute("data-public-fonts", "");
    document.head.append(fonts);
    expect(boot.stylesReady).toBe(true);
    const css = document.createElement("link");
    css.setAttribute("data-public-style", "");
    css.media = "print";
    document.head.append(css);
    expect(boot.stylesReady).toBe(false);
    Object.defineProperty(css, "sheet", { value: {}, configurable: true });
    css.dispatchEvent(new Event("load"));
    expect(css.media).toBe("all");
    expect(boot.stylesReady).toBe(true);
    css.dispatchEvent(new Event("error"));
    expect(boot.stylesReady).toBe(false);
    css.remove(); fonts.remove();
  });
  it("initializes admin without a public theme or brand gate", () => {
    window.history.replaceState(null, "", "/admin/login");
    const boot = initializePublicBoot()!;
    expect(boot.state).toBe("ready");
    expect(document.documentElement.dataset.publicTheme).toBeUndefined();
    expect(document.documentElement.dataset.publicBoot).toBeUndefined();
    expect(document.getElementById("flashcast-public-boot")).toBeNull();
    expect(document.getElementById("root")).not.toHaveAttribute("inert");
  });
});
