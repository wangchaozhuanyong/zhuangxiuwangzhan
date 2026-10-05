import { reloadDocumentSafely } from "@/lib/navigationProtection";
import { publicContentStatusText } from "../i18n/publicContentStatusText";
import { getDefaultLanguage, getLanguageFromPath, stripLanguagePrefix } from "../i18n/routes";
import { PUBLIC_MOTION, prefersReducedMotion } from "./publicMotion";
import { startPublicLoadingProgress } from "./publicLoadingProgress";

export type PublicBootState = "waiting" | "timeout" | "handoff" | "ready" | "degraded";
type Recovery = { retry: () => void; continue: () => void; timeout: () => void };
export type PublicBoot = {
  readonly state: PublicBootState;
  readonly deadline: number;
  readonly stylesReady: boolean;
  claim: (recovery: Recovery) => () => void;
  retry: () => void;
  complete: (degraded?: boolean) => Promise<void>;
  hold: () => void;
  dismiss: () => void;
};

declare global { interface Window { __flashcastPublicBoot?: PublicBoot } }

/** Public/admin classification has one owner, including before React's first paint. */
export const PUBLIC_THEME = "warm-stone" as const;

export function syncPublicTheme(isAdmin: boolean) {
  const html = document.documentElement;
  if (isAdmin) {
    delete html.dataset.publicTheme;
    delete html.dataset.theme;
    html.style.removeProperty("color-scheme");
  } else {
    html.dataset.publicTheme = PUBLIC_THEME;
    html.dataset.theme = PUBLIC_THEME;
    html.style.colorScheme = "light";
  }
}

export const getPublicBoot = () => typeof window === "undefined" ? undefined : window.__flashcastPublicBoot;

/** Bundled separately into the head. React adopts this controller and this DOM;
 * it never creates a second brand screen or starts a second initial deadline. */
export function initializePublicBoot(): PublicBoot | undefined {
  if (typeof window === "undefined" || window.__flashcastPublicBoot) return getPublicBoot();
  const isAdmin = /^\/admin(?:\/|$)/.test(location.pathname);
  const homeEntry = !isAdmin && stripLanguagePrefix(location.pathname) === "/";
  syncPublicTheme(isAdmin);
  // Establish reload scroll ownership before the browser can restore an old
  // position, rather than waiting for React's ScrollToTop effect.
  if (!isAdmin && "scrollRestoration" in history) history.scrollRestoration = "manual";
  // HTML parsing can paint the head before reaching the body. Move the HTML
  // template's original node into view synchronously; later move it into body.
  const template = document.getElementById("flashcast-public-boot-template");
  if (!isAdmin && template instanceof HTMLTemplateElement && !document.getElementById("flashcast-public-boot")) {
    const element = template.content.firstElementChild;
    if (element) (document.body || document.documentElement).appendChild(element);
  }
  template?.remove();
  const language = getLanguageFromPath() || getDefaultLanguage();
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  const copy = publicContentStatusText[language];
  let state: PublicBootState = isAdmin ? "ready" : "waiting";
  let deadline = performance.now() + PUBLIC_MOTION.timeout;
  let timer = 0;
  let recovery: Recovery | undefined;
  let completion: Promise<void> | undefined;
  let animation: Animation | undefined;
  let progress: ReturnType<typeof startPublicLoadingProgress> | undefined;
  let revision = 0;
  const failedStyles = new WeakSet<HTMLLinkElement>();
  const stylesReady = () => Array.from(document.querySelectorAll<HTMLLinkElement>("link[data-public-style]"))
    .every((link) => !!link.sheet && !failedStyles.has(link));
  const applyStyles = () => {
    for (const link of document.querySelectorAll<HTMLLinkElement>("link[data-public-style],link[data-public-fonts]")) {
      if (link.sheet || isAdmin && link.hasAttribute("data-public-style")) link.media = "all";
    }
  };

  const screen = () => document.getElementById("flashcast-public-boot");
  const render = () => {
    applyStyles();
    const element = screen();
    if (element && document.body && element.parentElement !== document.body) document.body.prepend(element);
    if (state === "ready" || state === "degraded") {
      progress?.cancel();
      progress = undefined;
      element?.remove();
      delete document.documentElement.dataset.publicBoot;
      delete document.documentElement.dataset.publicBootHome;
      if (document.documentElement.dataset.publicRouteLoading === "true") delete document.documentElement.dataset.publicRouteLoading;
      document.getElementById("root")?.removeAttribute("inert");
      return;
    }
    document.documentElement.dataset.publicBoot = state;
    if (homeEntry) document.documentElement.dataset.publicBootHome = "true";
    document.documentElement.dataset.publicRouteLoading = "true";
    document.getElementById("root")?.setAttribute("inert", "");
    if (!element) return;
    element.dataset.bootState = state;
    const track = element.querySelector<HTMLElement>(".scheme-a-page-loader__brand > i");
    if (track && !progress) progress = startPublicLoadingProgress(track);
    if (state === "timeout") progress?.pause();
    else if (state === "waiting") progress?.resume();
    element.setAttribute("aria-busy", String(state !== "timeout"));
    for (const node of element.querySelectorAll<HTMLElement>("[data-boot-copy]")) {
      const key = node.dataset.bootCopy as keyof typeof copy;
      if (node.textContent !== copy[key]) node.textContent = copy[key];
    }
    const actions = element.querySelector<HTMLElement>("[data-boot-recovery]");
    if (actions) actions.hidden = state !== "timeout";
    const proceed = element.querySelector<HTMLButtonElement>('[data-boot-action="continue"]');
    if (proceed) proceed.hidden = !recovery;
  };
  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (state !== "waiting") return;
      state = "timeout";
      render();
      recovery?.timeout();
    }, Math.max(0, deadline - performance.now()));
  };
  const finish = (degraded: boolean) => {
    observer.disconnect();
    state = degraded ? "degraded" : "ready";
    render();
  };
  const boot: PublicBoot = {
    get state() { return state; },
    get deadline() { return deadline; },
    get stylesReady() { return stylesReady(); },
    claim(next) {
      recovery = next;
      render();
      if (state === "timeout") next.timeout();
      return () => { if (recovery === next) { recovery = undefined; render(); } };
    },
    retry() {
      if (!stylesReady()) { void reloadDocumentSafely(); return; }
      if (state !== "timeout") return;
      state = "waiting";
      deadline = performance.now() + PUBLIC_MOTION.timeout;
      render();
      arm();
    },
    complete(degraded = false) {
      if (completion) return completion;
      window.clearTimeout(timer);
      if (state === "ready" || state === "degraded") return Promise.resolve();
      state = "handoff";
      render();
      // Prepare only the destination's explicit photo glyphs, underneath the
      // same opaque screen, before any part of the destination becomes visible.
      window.dispatchEvent(new Event("public-scene-prepare"));
      const element = screen();
      if (!element || prefersReducedMotion() || typeof element.animate !== "function") {
        finish(degraded);
        return completion = Promise.resolve();
      }
      const owner = revision;
      const fade = () => {
        if (owner !== revision) return Promise.resolve();
        animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: homeEntry ? 420 : PUBLIC_MOTION.handoff,
          easing: homeEntry ? "ease-in-out" : PUBLIC_MOTION.easing,
          // Keep the last transparent frame until removal, including busy mobile frames.
          fill: "forwards",
        });
        return animation.finished.catch(() => {}).then(() => { if (owner === revision) finish(degraded); });
      };
      completion = progress ? progress.complete().then(fade) : fade();
      return completion;
    },
    hold() {
      if (state !== "handoff") return;
      revision++;
      animation?.cancel();
      progress?.cancel();
      progress = undefined;
      completion = undefined;
      state = "waiting";
      render();
      arm();
    },
    dismiss() {
      revision++;
      window.clearTimeout(timer);
      animation?.cancel();
      finish(false);
    },
  };
  window.__flashcastPublicBoot = boot;
  const asset = (event: Event) => {
    const link = event.target;
    if (!(link instanceof HTMLLinkElement)) return;
    if (event.type === "error" && link.hasAttribute("data-public-style")) failedStyles.add(link);
    if (event.type === "load" && link.matches("[data-public-style],[data-public-fonts]")) link.media = "all";
    window.dispatchEvent(new Event("public-assets-change"));
  };
  document.addEventListener("load", asset, true);
  document.addEventListener("error", asset, true);
  render();
  // Parser insertions are observed before paint; the already-rendered brand
  // gets its copy and the application becomes inert without waiting for React.
  const observer = new MutationObserver(() => {
    render();
    if (document.getElementById("root")) observer.disconnect();
  });
  if (!document.getElementById("root")) observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", (event) => {
    const action = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-boot-action]")?.dataset.bootAction : undefined;
    if (action === "retry") { if (recovery) recovery.retry(); else void reloadDocumentSafely(); }
    if (action === "continue") recovery?.continue();
  });
  if (!isAdmin) arm();
  return boot;
}
