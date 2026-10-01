import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { observeAdaptiveContrast } from "./adaptiveContrast";

describe("public contrast controller", () => {
  let stop: (() => void) | undefined;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0));
    vi.stubGlobal("cancelAnimationFrame", window.clearTimeout.bind(window));
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.stubGlobal("getComputedStyle", (element: HTMLElement, pseudo?: string) => ({
      color: element.style.color || "rgb(41, 46, 41)", backgroundColor: element.dataset.state === "unparsed" ? "oklab(0.5 0 0)" : element.dataset.state === "dark" ? "black" : element.style.backgroundColor || "rgba(0, 0, 0, 0)",
      backgroundImage: element.style.backgroundImage || "none", visibility: "visible", opacity: "1", filter: "none", content: pseudo ? "none" : "normal",
      pointerEvents: element.style.pointerEvents || "auto", objectFit: "cover", objectPosition: "50% 50%",
      transitionProperty: element.style.transitionProperty || "all", transitionDuration: element.style.transitionDuration || "0s", transitionDelay: element.style.transitionDelay || "0s",
    }));
    document.body.innerHTML = '<div id="root" style="background-color:white"><header style="background:transparent"><a href="#" data-adaptive-text style="color:#292E29">首页</a></header><button disabled data-adaptive-text>暂停</button></div>';
    const link = document.querySelector("a")!;
    link.getBoundingClientRect = () => ({ x: 20, y: 20, left: 20, top: 20, right: 80, bottom: 44, width: 60, height: 24, toJSON: () => ({}) });
    Object.defineProperty(document, "elementsFromPoint", { configurable: true, value: () => [link, link.parentElement!, document.getElementById("root")!, document.body] });
  });
  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = "";
    delete document.documentElement.dataset.publicBoot;
  });
  it("responds to a changed background and keeps the header transparent", async () => {
    const root = document.getElementById("root")!;
    const link = root.querySelector("a")!;
    stop = observeAdaptiveContrast(root);
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("rgb(41, 46, 41)");
    root.style.backgroundColor = "black";
    await vi.advanceTimersByTimeAsync(150);
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("#ffffff");
    expect(root.querySelector("header")!.style.background).toBe("transparent");
    expect(root.querySelector("button")!.hasAttribute("data-adaptive-contrast")).toBe(false);
  });
  it("uses a glyph fallback for a background that cannot be measured", () => {
    const root = document.getElementById("root")!;
    root.style.backgroundImage = 'url("/unreadable-fixture.webp")';
    stop = observeAdaptiveContrast(root);
    const link = root.querySelector("a")!;
    expect(link.dataset.adaptiveContrast).toBe("outline");
    expect(link.dataset.adaptiveSource).toBe("unavailable");
    expect(link.hasAttribute("data-adaptive-ratio")).toBe(false);
    expect(link.style.getPropertyValue("--adaptive-shadow")).toContain("1px");
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("rgb(41, 46, 41)");
  });
  it("never recolors ordinary text, solid controls, forms or retained scenes", () => {
    const root = document.getElementById("root")!;
    root.insertAdjacentHTML("beforeend", '<h1>Heading</h1><a data-adaptive-text style="background-color:#3F4E42;color:#FDFCFA">Quote</a><form><label data-adaptive-text>Email</label></form><div class="public-route-retained" aria-hidden="true"><span data-adaptive-text>Old page</span></div>');
    const quote = root.querySelectorAll("a")[1];
    quote.getBoundingClientRect = root.querySelector("a")!.getBoundingClientRect;
    stop = observeAdaptiveContrast(root);
    expect(root.querySelector("h1")!.hasAttribute("data-adaptive-contrast")).toBe(false);
    expect(quote.hasAttribute("data-adaptive-contrast")).toBe(false);
    expect(root.querySelector("label")!.hasAttribute("data-adaptive-contrast")).toBe(false);
    expect(root.querySelector(".public-route-retained span")!.hasAttribute("data-adaptive-contrast")).toBe(false);
  });
  it("ignores the fading brand and retained overlay when sampling the destination", () => {
    const root = document.getElementById("root")!;
    const link = root.querySelector("a")!;
    const overlay = document.createElement("div");
    overlay.id = "flashcast-public-boot";
    overlay.style.backgroundImage = "linear-gradient(black,white)";
    document.body.prepend(overlay);
    Object.defineProperty(document, "elementsFromPoint", { configurable: true, value: () => [overlay, link, root, document.body] });
    stop = observeAdaptiveContrast(root);
    expect(link.dataset.adaptiveSource).toBe("surface");
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("rgb(41, 46, 41)");
  });
  it("re-evaluates CSS controlled by component data-state attributes", async () => {
    const root = document.getElementById("root")!;
    stop = observeAdaptiveContrast(root);
    root.dataset.state = "dark";
    await vi.advanceTimersByTimeAsync(150);
    expect(root.querySelector("a")!.style.getPropertyValue("--adaptive-color")).toBe("#ffffff");
  });
  it("does not invent a white background for a CSS color it cannot parse", () => {
    const root = document.getElementById("root")!;
    root.dataset.state = "unparsed";
    stop = observeAdaptiveContrast(root);
    const link = root.querySelector("a")!;
    expect(link.dataset.adaptiveSource).toBe("unavailable");
    expect(link.dataset.adaptiveContrast).toBe("outline");
    expect(link.hasAttribute("data-adaptive-ratio")).toBe(false);
  });
  it("samples a decorative photo even when it is excluded from pointer hit testing", () => {
    const root = document.getElementById("root")!;
    const image = document.createElement("img");
    image.src = "/contrast-fixture.webp";
    image.style.pointerEvents = "none";
    image.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 200, width: 400, height: 200, toJSON: () => ({}) });
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 400 }, naturalHeight: { value: 200 } });
    root.append(image);
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({ drawImage: () => {}, getImageData: (_x: number, _y: number, width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let offset = 3; offset < data.length; offset += 4) data[offset] = 255;
      return { data };
    } } as unknown as CanvasRenderingContext2D);
    stop = observeAdaptiveContrast(root);
    expect(root.querySelector("a")!.style.getPropertyValue("--adaptive-color")).toBe("#ffffff");
    expect(root.querySelector("a")!.dataset.adaptiveSource).toBe("image");
  });
  it("prepares real photo layers before handoff and restores the interaction gate synchronously", () => {
    const root = document.getElementById("root")!;
    const link = root.querySelector("a")!;
    const content = document.createElement("div");
    content.className = "public-route-content";
    content.dataset.routeVisualState = "handoff";
    content.setAttribute("inert", "");
    const image = document.createElement("img");
    image.src = "/contrast-fixture.webp";
    image.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 400, bottom: 200, width: 400, height: 200, toJSON: () => ({}) });
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 400 }, naturalHeight: { value: 200 } });
    content.append(image);
    root.append(content);
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({ drawImage: () => {}, getImageData: (_x: number, _y: number, width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let offset = 3; offset < data.length; offset += 4) data[offset] = 255;
      return { data };
    } } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(document, "elementsFromPoint", { configurable: true, value: () => root.hasAttribute("inert") || content.hasAttribute("inert") ? [root] : [link, image, content, root] });
    root.setAttribute("inert", "");
    document.documentElement.dataset.publicBoot = "handoff";
    stop = observeAdaptiveContrast(root);
    window.dispatchEvent(new Event("public-scene-prepare"));
    expect(link.dataset.adaptiveSource).toBe("image");
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("#ffffff");
    expect(root.hasAttribute("inert")).toBe(true);
    expect(content.hasAttribute("inert")).toBe(true);
  });
  it("restores skin foregrounds and leaves unrelated inline styles intact when unmounted", () => {
    const root = document.getElementById("root")!;
    const link = root.querySelector("a")!;
    link.style.marginLeft = "12px";
    const dispose = observeAdaptiveContrast(root);
    dispose();
    expect(link.hasAttribute("data-adaptive-contrast")).toBe(false);
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("");
    expect(link.style.color).toBe("rgb(41, 46, 41)");
    expect(link.style.marginLeft).toBe("12px");
  });
  it("keeps authored background and motion transition timing after an adaptive update", async () => {
    const root = document.getElementById("root")!;
    const link = root.querySelector("a")!;
    link.style.transitionProperty = "color, background-color, transform";
    link.style.transitionDuration = ".2s, .4s, .5s";
    link.style.transitionDelay = ".1s, 0s, 0s";
    stop = observeAdaptiveContrast(root);
    root.style.backgroundColor = "black";
    await vi.advanceTimersByTimeAsync(150);
    expect(link.style.getPropertyValue("--adaptive-color")).toBe("#ffffff");
    expect(link.style.transitionProperty).toBe("color, background-color, transform");
    expect(link.style.transitionDuration).toBe(".2s, .4s, .5s");
    expect(link.style.transitionDelay).toBe(".1s, 0s, 0s");
  });
  it("keeps a cross-origin displayed image intact and attempts anonymous sampling only once", async () => {
    const root = document.getElementById("root")!;
    const link = root.querySelector("a")!;
    const image = document.createElement("img");
    image.src = "https://images.example.invalid/fixture.webp";
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 400 }, naturalHeight: { value: 200 } });
    root.append(image);
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({ drawImage: () => { throw new DOMException("", "SecurityError"); } } as unknown as CanvasRenderingContext2D);
    const readers: HTMLImageElement[] = [];
    vi.stubGlobal("Image", function () { const reader = document.createElement("img"); readers.push(reader); return reader; });
    Object.defineProperty(document, "elementsFromPoint", { configurable: true, value: () => [link, image, root] });
    stop = observeAdaptiveContrast(root);
    expect(readers).toHaveLength(1);
    expect(readers[0].crossOrigin).toBe("anonymous");
    expect(readers[0].referrerPolicy).toBe("no-referrer");
    expect(image.src).toBe("https://images.example.invalid/fixture.webp");
    expect(link.dataset.adaptiveSource).toBe("unavailable");
    readers[0].dispatchEvent(new Event("error"));
    window.dispatchEvent(new Event("resize"));
    await vi.advanceTimersByTimeAsync(150);
    expect(readers).toHaveLength(1);
    expect(link.dataset.adaptiveContrast).toBe("outline");
  });
});
