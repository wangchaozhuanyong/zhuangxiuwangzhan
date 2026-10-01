import { chooseAdaptiveTextColor, compositeColors, getImageSourcePoint, getRelativeLuminance, parseCssColor, type RgbColor } from "./colorContrast";

const EXCLUDED = '.sr-only,.fcd-sr-only,[aria-hidden="true"],[hidden],svg,script,style,noscript,template,[data-adaptive-contrast="off"],input,textarea,select';
const TRANSPARENT: RgbColor = { r: 0, g: 0, b: 0, a: 0 };
type Bitmap = { width: number; height: number; data: Uint8ClampedArray };

/** One public-shell controller. It changes glyphs only, never backgrounds or image URLs. */
export const observeAdaptiveContrast = (root: HTMLElement) => {
  let stopped = false;
  let dirty = true;
  let targets: HTMLElement[] = [];
  let images: HTMLImageElement[] = [];
  let frame = 0;
  let timer = 0;
  let lastUpdate = 0;
  const active = new Set<HTMLElement>();
  const previous = new WeakMap<HTMLElement, string>();
  const writtenStyles = new WeakMap<HTMLElement, string | null>();
  // Bounded decoded-pixel cache; no canvas export or persistence. Foreign images
  // may need one anonymous, low-priority CORS read without changing the displayed image.
  const bitmaps = new Map<string, Bitmap | null>();
  const attemptedCors = new Map<string, "pending" | "ready" | "failed">();
  const pendingImages = new Set<HTMLImageElement>();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  const bitmap = (image: HTMLImageElement): Bitmap | null => {
    if (!image.complete || !image.naturalWidth || !context) return null;
    const source = image.currentSrc || image.src;
    if (bitmaps.has(source)) {
      const cached = bitmaps.get(source)!;
      bitmaps.delete(source);
      bitmaps.set(source, cached);
      return cached;
    }
    let result: Bitmap | null = null;
    try {
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      result = { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
    } catch {
      // Cross-origin pixels may be unreadable. Keep the photo, use the glyph outline.
      canvas.width = 1;
      if (!attemptedCors.has(source) && new URL(source, location.href).origin !== location.origin) {
        attemptedCors.set(source, "pending");
        const readable = new Image();
        readable.crossOrigin = "anonymous";
        readable.referrerPolicy = "no-referrer";
        readable.fetchPriority = "low";
        pendingImages.add(readable);
        readable.onload = () => {
          pendingImages.delete(readable);
          if (stopped) return;
          bitmaps.delete(source);
          attemptedCors.set(source, bitmap(readable) ? "ready" : "failed");
          schedule();
        };
        readable.onerror = () => { pendingImages.delete(readable); attemptedCors.set(source, "failed"); };
        readable.src = source;
      }
    }
    if (bitmaps.size >= 12) {
      const oldest = bitmaps.keys().next().value!;
      bitmaps.delete(oldest);
      if (attemptedCors.get(oldest) === "ready") attemptedCors.delete(oldest);
    }
    bitmaps.set(source, result);
    return result;
  };

  const textRects = (element: HTMLElement) => {
    if (element.hasAttribute("data-adaptive-logo") || element.hasAttribute("data-adaptive-text")) return [element.getBoundingClientRect()];
    const range = document.createRange();
    const rects: DOMRect[] = [];
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
      range.selectNodeContents(node);
      rects.push(...Array.from(range.getClientRects()));
    }
    return rects;
  };

  const clear = (element: HTMLElement) => {
    if (element.dataset.adaptiveContrast !== "off") element.removeAttribute("data-adaptive-contrast");
    element.removeAttribute("data-adaptive-source");
    element.removeAttribute("data-adaptive-ratio");
    for (const property of ["--adaptive-color", "--adaptive-outline", "--adaptive-shadow", "--adaptive-logo-filter"]) element.style.removeProperty(property);
    writtenStyles.set(element, element.getAttribute("style"));
  };

  const freezeGlyphTransitions = (element: HTMLElement) => {
    const style = getComputedStyle(element);
    if (!style.transitionProperty || style.transitionProperty === "none" || !style.transitionDuration.split(",").some((value) => parseFloat(value) > 0)) return () => {};
    const properties = style.transitionProperty.split(",").map((value) => value.trim());
    const durations = style.transitionDuration.split(",").map((value) => value.trim());
    const delays = style.transitionDelay.split(",").map((value) => value.trim());
    const names = ["transition-property", "transition-duration", "transition-delay"];
    const originals = names.map((name) => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    // Later entries override only glyph transitions. Background, transform,
    // opacity and every other authored transition retain their original timing.
    element.style.setProperty("transition-property", [...properties, "color", "-webkit-text-fill-color", "text-shadow"].join(","), "important");
    element.style.setProperty("transition-duration", [...properties.map((_, index) => durations[index % durations.length]), "0s", "0s", "0s"].join(","), "important");
    element.style.setProperty("transition-delay", [...properties.map((_, index) => delays[index % delays.length]), "0s", "0s", "0s"].join(","), "important");
    return () => {
      for (const [name, value, priority] of originals) {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      }
    };
  };

  const update = () => {
    frame = 0;
    timer = 0;
    if (stopped || document.hidden) return;
    lastUpdate = performance.now();
    if (dirty) {
      const candidates = new Set(root.querySelectorAll<HTMLElement>("[data-adaptive-text],[data-adaptive-logo]"));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() && node.parentElement instanceof HTMLElement) candidates.add(node.parentElement);
      }
      targets = Array.from(candidates).filter((element) => {
        if (element.closest(EXCLUDED) || element.closest('[disabled],[aria-disabled="true"]')) return false;
        const parentScope = element.parentElement?.closest("[data-adaptive-text],[data-adaptive-logo]");
        return !parentScope && (element.matches("[data-adaptive-text],[data-adaptive-logo]")
          || Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()));
      });
      images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
      dirty = false;
    }
    // Read the target skin color, not an interpolated transition color. The
    // foreground is restored and applied within the same frame, without a flash.
    const frozen = new Map<HTMLElement, () => void>();
    for (const element of active) frozen.set(element, freezeGlyphTransitions(element));
    for (const element of active) clear(element);
    active.clear();
    const styles = new Map<Element, CSSStyleDeclaration>();
    const pseudoStyles = new Map<Element, CSSStyleDeclaration[]>();
    const styleOf = (element: Element) => {
      if (!styles.has(element)) styles.set(element, getComputedStyle(element));
      return styles.get(element)!;
    };
    const pseudoPaintsAt = (element: Element, x: number, y: number) => {
      if (!pseudoStyles.has(element)) pseudoStyles.set(element, [getComputedStyle(element, "::before"), getComputedStyle(element, "::after")]);
      return pseudoStyles.get(element)!.some((style) => {
        if (["none", "normal"].includes(style.content) || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
        if (style.backgroundImage === "none" && !(parseCssColor(style.backgroundColor)?.a)) return false;
        const rect = element.getBoundingClientRect();
        const width = parseFloat(style.width);
        const height = parseFloat(style.height);
        const left = Number.isFinite(parseFloat(style.left)) ? rect.left + parseFloat(style.left)
          : Number.isFinite(parseFloat(style.right)) && Number.isFinite(width) ? rect.right - parseFloat(style.right) - width : rect.left;
        const top = Number.isFinite(parseFloat(style.top)) ? rect.top + parseFloat(style.top)
          : Number.isFinite(parseFloat(style.bottom)) && Number.isFinite(height) ? rect.bottom - parseFloat(style.bottom) - height : rect.top;
        return x >= left && x <= left + (Number.isFinite(width) ? width : rect.width)
          && y >= top && y <= top + (Number.isFinite(height) ? height : rect.height);
      });
    };
    const imagePixel = (image: HTMLImageElement, x: number, y: number): RgbColor | null => {
      const pixels = bitmap(image);
      const rect = image.getBoundingClientRect();
      const style = styleOf(image);
      if (!pixels || style.filter !== "none") return null;
      const point = getImageSourcePoint({ width: rect.width, height: rect.height, naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight, fit: style.objectFit, position: style.objectPosition }, x - rect.left, y - rect.top);
      if (!point) return null;
      const column = Math.min(pixels.width - 1, Math.floor(point.x / image.naturalWidth * pixels.width));
      const row = Math.min(pixels.height - 1, Math.floor(point.y / image.naturalHeight * pixels.height));
      const offset = (row * pixels.width + column) * 4;
      return { r: pixels.data[offset], g: pixels.data[offset + 1], b: pixels.data[offset + 2], a: pixels.data[offset + 3] / 255 };
    };
    const nonHitImages = images.filter((image) => styleOf(image).pointerEvents === "none").map((image) => ({ image, rect: image.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth);
    const backgroundAt = (target: HTMLElement, x: number, y: number): { color: RgbColor | null; image: boolean } => {
      let front = TRANSPARENT;
      let imageSeen = false;
      const layers = document.elementsFromPoint(x, y);
      // Decorative photos can opt out of pointer hit testing. Insert the photo
      // above its containing background, below any opaque control over it.
      for (const { image, rect } of nonHitImages) {
        if (target.contains(image) || layers.includes(image) || x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) continue;
        let parent = image.parentElement;
        while (parent && !layers.includes(parent)) parent = parent.parentElement;
        if (parent) layers.splice(layers.indexOf(parent), 0, image);
      }
      // Pseudo-elements and group opacity are not pixels exposed by hit testing.
      // Mark them unknown before an opaque image could hide that uncertainty.
      if (layers.some((layer) => Number(styleOf(layer).opacity) < 1 || pseudoPaintsAt(layer, x, y))) return { color: null, image: false };
      for (const layer of layers) {
        const style = styleOf(layer);
        if (style.visibility === "hidden" || Number(style.opacity) === 0) continue;
        if (layer instanceof HTMLImageElement && !target.contains(layer)) {
          imageSeen = true;
          const pixel = imagePixel(layer, x, y);
          if (!pixel) return { color: null, image: true };
          front = compositeColors(front, pixel);
        }
        // Nontrivial filters, gradients, videos and translucent group opacity cannot
        // be reconstructed from a CSS color. Do not report invented pixel evidence.
        if (style.backgroundImage !== "none" || Number(style.opacity) < 1
          || layer instanceof HTMLVideoElement || layer instanceof HTMLCanvasElement) return { color: null, image: imageSeen };
        const background = parseCssColor(style.backgroundColor);
        if (!background) return { color: null, image: imageSeen };
        front = compositeColors(front, background);
        if (front.a >= 0.999) return { color: { ...front, a: 1 }, image: imageSeen };
      }
      return { color: null, image: imageSeen };
    };
    const results: { element: HTMLElement; color: string; outline: boolean; ratio: number | null; image: boolean }[] = [];
    for (const element of targets) {
      if (!element.isConnected || element.closest(EXCLUDED) || element.closest('[disabled],[aria-disabled="true"]')) continue;
      const rects = textRects(element).filter((rect) => rect.width > 1 && rect.height > 1 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight);
      if (!rects.length) continue;
      const style = styleOf(element);
      if (style.visibility !== "visible" || Number(style.opacity) === 0) continue;
      const samples: (RgbColor | null)[] = [];
      let image = false;
      for (const rect of rects.slice(0, 8)) {
        const columns = Math.min(12, Math.max(3, Math.ceil(rect.width / 10)));
        for (const fraction of [0.25, 0.5, 0.75]) for (let column = 0; column < columns; column++) {
          const x = rect.left + rect.width * (column + 0.5) / columns;
          const y = rect.top + rect.height * fraction;
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
          const sample = backgroundAt(element, x, y);
          samples.push(sample.color);
          image ||= sample.image;
        }
      }
      const decision = chooseAdaptiveTextColor(samples, style.color, previous.get(element));
      results.push({ element, color: decision.color, outline: decision.outline, ratio: decision.minimumRatio, image });
    }
    for (const { element, color, outline, ratio, image } of results) {
      if (!frozen.has(element)) frozen.set(element, freezeGlyphTransitions(element));
      const light = getRelativeLuminance(parseCssColor(color)!) > 0.5;
      const edge = light ? "#000000" : "#ffffff";
      element.style.setProperty("--adaptive-color", color);
      element.style.setProperty("--adaptive-outline", outline ? edge : "transparent");
      // A 1px outer halo preserves the glyph fill and leaves the photo untouched.
      element.style.setProperty("--adaptive-shadow", outline
        ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].map(([x, y]) => `${x}px ${y}px 0 ${edge}`).join(",") : "none");
      element.style.setProperty("--adaptive-logo-filter", `brightness(0)${light ? " invert(1)" : ""}${outline ? ` drop-shadow(1px 0 0 ${edge}) drop-shadow(-1px 0 0 ${edge}) drop-shadow(0 1px 0 ${edge}) drop-shadow(0 -1px 0 ${edge})` : ""}`);
      element.dataset.adaptiveContrast = outline ? "outline" : "color";
      element.dataset.adaptiveSource = ratio === null ? "unavailable" : image ? "image" : "surface";
      if (ratio !== null) element.dataset.adaptiveRatio = ratio.toFixed(3);
      previous.set(element, color);
      writtenStyles.set(element, element.getAttribute("style"));
      active.add(element);
    }
    // Resolve the final glyph color with its transition disabled before restoring
    // authored transitions. Otherwise a browser can interpolate the old color.
    for (const element of active) void getComputedStyle(element).color;
    for (const [element, restore] of frozen) {
      restore();
      writtenStyles.set(element, element.getAttribute("style"));
    }
  };
  const schedule = () => {
    if (stopped || frame || timer) return;
    const delay = Math.max(0, 100 - (performance.now() - lastUpdate));
    if (delay) timer = window.setTimeout(() => { timer = 0; frame = requestAnimationFrame(update); }, delay);
    else frame = requestAnimationFrame(update);
  };
  const observer = new MutationObserver((mutations) => {
    if (mutations.every((mutation) => mutation.type === "attributes" && mutation.attributeName === "style"
      && writtenStyles.get(mutation.target as HTMLElement) === (mutation.target as HTMLElement).getAttribute("style"))) return;
    dirty ||= mutations.some((mutation) => mutation.type !== "attributes" || ["class", "hidden", "disabled", "aria-hidden", "aria-disabled"].includes(mutation.attributeName!));
    schedule();
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ["class", "style", "src", "srcset", "sizes", "hidden", "disabled", "aria-hidden", "aria-disabled",
      "data-state", "data-theme", "data-public-theme", "data-surface", "aria-pressed", "aria-selected", "checked", "open"] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-public-theme"] });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
  resize?.observe(root);
  root.addEventListener("load", schedule, true);
  root.addEventListener("error", schedule, true);
  root.addEventListener("pointerover", schedule, { passive: true });
  root.addEventListener("pointerout", schedule, { passive: true });
  root.addEventListener("focusin", schedule);
  root.addEventListener("focusout", schedule);
  root.addEventListener("transitionend", schedule);
  root.addEventListener("animationend", schedule);
  root.addEventListener("change", schedule);
  window.addEventListener("scroll", schedule, { passive: true, capture: true });
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule);
  document.fonts?.ready.then(schedule);
  document.fonts?.addEventListener("loadingdone", schedule);
  update();
  return () => {
    stopped = true;
    observer.disconnect();
    resize?.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    root.removeEventListener("load", schedule, true);
    root.removeEventListener("error", schedule, true);
    root.removeEventListener("pointerover", schedule);
    root.removeEventListener("pointerout", schedule);
    root.removeEventListener("focusin", schedule);
    root.removeEventListener("focusout", schedule);
    root.removeEventListener("transitionend", schedule);
    root.removeEventListener("animationend", schedule);
    root.removeEventListener("change", schedule);
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", schedule);
    document.fonts?.removeEventListener("loadingdone", schedule);
    for (const element of active) clear(element);
    bitmaps.clear();
    attemptedCors.clear();
    for (const image of pendingImages) { image.onload = null; image.onerror = null; }
    pendingImages.clear();
  };
};
