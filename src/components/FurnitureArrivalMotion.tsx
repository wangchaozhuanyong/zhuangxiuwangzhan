import { useEffect, useId, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { stripLanguagePrefix } from "@/i18n/routes";
import { getPublicBoot } from "@/lib/publicBoot";
import { PUBLIC_NAVIGATION_EVENT } from "@/lib/publicNavigation";

type Point = { x: number; y: number };
type RouteReady = CustomEvent<{ routeKey: string; degraded: boolean }>;

// Document-scoped: a refresh may replay; SPA navigation and language changes may not.
const openedOnHome = typeof window !== "undefined" && stripLanguagePrefix(window.location.pathname) === "/";
let arrivalClaimed = false;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
const pointAt = (t: number, points: Point[]): Point => {
  const u = 1 - t;
  return {
    x: u ** 3 * points[0].x + 3 * u ** 2 * t * points[1].x + 3 * u * t ** 2 * points[2].x + t ** 3 * points[3].x,
    y: u ** 3 * points[0].y + 3 * u ** 2 * t * points[1].y + 3 * u * t ** 2 * points[2].y + t ** 3 * points[3].y,
  };
};

/** A brief, non-interactive flourish; the public image gate remains the readiness owner. */
export default function FurnitureArrivalMotion({ entryRef }: { entryRef: RefObject<HTMLAnchorElement> }) {
  const { pathname } = useLocation();
  const sceneRef = useRef<SVGSVGElement>(null);
  const eligible = useRef(openedOnHome && !arrivalClaimed);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const entry = entryRef.current;
    const scene = sceneRef.current;
    if (!eligible.current || arrivalClaimed || stripLanguagePrefix(pathname) !== "/" || !entry || !scene) return;

    let finished = false;
    let scheduled = false;
    let ready = false;
    let playing = false;
    let frame = 0;
    let timer = 0;
    let iconStarted = false;
    let arrowStarted = false;
    const animations: Animation[] = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const head = scene.querySelector<SVGGElement>("[data-arrival-head]")!;
    const tails = Array.from(scene.querySelectorAll<SVGPathElement>("[data-arrival-tail]"));
    const gradient = scene.querySelector<SVGLinearGradientElement>("linearGradient")!;
    const border = scene.querySelector<SVGGElement>("[data-arrival-border]")!;
    const outlines = Array.from(border.querySelectorAll("rect"));

    const removeListeners = () => {
      window.removeEventListener("public-route-ready", onReady);
      window.removeEventListener(PUBLIC_NAVIGATION_EVENT, interrupt);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("pointerdown", interrupt, true);
      window.removeEventListener("keydown", interrupt, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", queue);
      window.visualViewport?.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", interrupt);
    };
    const finish = (status = "done") => {
      finished = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      animations.forEach(animation => animation.cancel());
      scene.removeAttribute("data-active");
      entry.dataset.arrival = status;
      removeListeners();
    };
    const interrupt = () => { arrivalClaimed = true; finish("skipped"); };
    // Browser chrome, restoration and loading are not user cancellation.
    const onScroll = () => { if (ready && window.scrollY > 24) interrupt(); };
    const onResize = () => {
      if (!playing && scheduled) { window.clearTimeout(timer); scheduled = false; queue(); }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") queue();
      else if (playing) interrupt();
      else { window.clearTimeout(timer); scheduled = false; }
    };
    const illuminate = (selector: string, duration: number, arrow = false) => {
      const element = entry.querySelector<HTMLElement | SVGElement>(selector);
      if (!element?.animate) return;
      animations.push(element.animate([
        { color: "#D9C19F", filter: "drop-shadow(0 0 0px transparent)", transform: "translate(0, 0) scale(1)" },
        { color: "#FFF3DD", filter: "drop-shadow(0 0 5px #D9C19F)", transform: arrow ? "translate(2px, -2px) scale(1)" : "translateY(-2px) scale(1.06)", offset: .38 },
        { color: "#D9C19F", filter: "drop-shadow(0 0 0px transparent)", transform: "translate(0, 0) scale(1)" },
      ], { duration, easing: "cubic-bezier(.22,1,.36,1)" }));
    };

    const play = () => {
      if (finished) return;
      const hero = document.querySelector<HTMLImageElement>("#main-content [data-immersive-hero] img");
      if (document.visibilityState !== "visible" || window.scrollY > 24 || window.location.hash
        || stripLanguagePrefix(window.location.pathname) !== "/" || document.documentElement.dataset.menuOpen
        || document.documentElement.dataset.publicRouteLoading || !hero?.complete || !hero.naturalWidth) { interrupt(); return; }
      arrivalClaimed = true;
      playing = true;
      scene.setAttribute("data-active", "true");
      const canvas = scene.getBoundingClientRect();
      let box = entry.getBoundingClientRect();
      const { width, height } = canvas;
      const mobile = window.innerWidth < 768;
      const duration = mobile ? 2100 : 2400;
      const reduced = motion.matches;
      let origin = { x: box.x - canvas.x, y: box.y - canvas.y };
      let end = { x: origin.x + 9, y: origin.y };
      const start = mobile
        ? { x: width * .76, y: Math.max(96, origin.y - Math.min(270, height * .32)) }
        : { x: Math.max(width * .52, end.x - Math.min(360, width * .25)), y: Math.max(100, origin.y - Math.min(520, height * .48)) };
      let points = mobile
        ? [start, { x: width - 20, y: start.y + 64 }, { x: end.x - 32, y: end.y - 60 }, end]
        : [start, { x: start.x + 110, y: start.y + 25 }, { x: end.x - 135, y: end.y - 80 }, end];
      const trailFraction = (mobile ? 110 : 210) / (Math.hypot(end.x - start.x, end.y - start.y) * 1.12);
      const alignOutlines = () => outlines.forEach(outline => {
        outline.setAttribute("x", String(origin.x + .5));
        outline.setAttribute("y", String(origin.y + .5));
        outline.setAttribute("width", String(box.width - 1));
        outline.setAttribute("height", String(box.height - 1));
      });
      alignOutlines();
      entry.dataset.arrival = reduced ? "settling" : "flying";
      head.style.opacity = "0";
      tails.forEach(tail => { tail.style.opacity = "0"; });
      border.style.opacity = "0";
      const started = performance.now();

      const draw = (now: number) => {
        if (finished) return;
        // Track the rendered button, including hover transforms, scrollbar
        // changes and mobile browser chrome that need not fire window.resize.
        const nextBox = entry.getBoundingClientRect();
        const nextCanvas = scene.getBoundingClientRect();
        const nextOrigin = { x: nextBox.x - nextCanvas.x, y: nextBox.y - nextCanvas.y };
        if (origin.x !== nextOrigin.x || origin.y !== nextOrigin.y || box.width !== nextBox.width || box.height !== nextBox.height) {
          box = nextBox;
          origin = nextOrigin;
          end = { x: origin.x + 9, y: origin.y };
          points = [points[0], points[1], { x: end.x - (mobile ? 32 : 135), y: end.y - (mobile ? 60 : 80) }, end];
          alignOutlines();
        }
        const elapsed = now - started;
        if (reduced) {
          outlines.forEach(outline => outline.setAttribute("stroke-dashoffset", "0"));
          border.style.opacity = String(Math.sin(clamp(elapsed / 280) * Math.PI) * .85);
          if (elapsed >= 280) { finish(); return; }
          frame = requestAnimationFrame(draw);
          return;
        }
        const time = clamp(elapsed / duration);
        const travel = ease(clamp((time - .08) / .49));
        const dot = pointAt(travel, points);
        const visibility = clamp(time / .08) * (1 - clamp((time - .57) / .11));
        const tailStart = Math.max(0, travel - trailFraction * (1 - clamp((time - .52) / .12)));
        const left: Point[] = [], right: Point[] = [];
        for (let i = 0; i <= 14; i++) {
          const t = tailStart + (travel - tailStart) * i / 14;
          const p = pointAt(t, points);
          const ahead = pointAt(Math.min(1, t + .002), points);
          const behind = pointAt(Math.max(0, t - .002), points);
          const length = Math.hypot(ahead.x - behind.x, ahead.y - behind.y) || 1;
          const radius = (mobile ? 3 : 4) * (i / 14) ** 1.3;
          const nx = -(ahead.y - behind.y) / length * radius;
          const ny = (ahead.x - behind.x) / length * radius;
          left.push({ x: p.x + nx, y: p.y + ny });
          right.push({ x: p.x - nx, y: p.y - ny });
        }
        const tailPath = [...left, ...right.reverse()].map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";
        const tailPoint = pointAt(tailStart, points);
        gradient.setAttribute("x1", String(tailPoint.x)); gradient.setAttribute("y1", String(tailPoint.y));
        gradient.setAttribute("x2", String(dot.x)); gradient.setAttribute("y2", String(dot.y));
        tails.forEach(tail => { tail.setAttribute("d", tailPath); tail.style.opacity = String(visibility); });
        head.setAttribute("transform", `translate(${dot.x} ${dot.y})`);
        head.style.opacity = String(visibility);
        const tracing = ease(clamp((time - .54) / .27));
        outlines.forEach(outline => outline.setAttribute("stroke-dashoffset", String(1 - tracing)));
        border.style.opacity = String(clamp((time - .54) / .06) * (1 - clamp((time - .83) / .17)));
        if (time >= .57) entry.dataset.arrival = "settling";
        if (time >= .62 && !iconStarted) { iconStarted = true; illuminate(".fc-furniture-floating__icon", duration * .38); }
        if (time >= .75 && !arrowStarted) { arrowStarted = true; illuminate(".fc-furniture-floating__arrow", duration * .25, true); }
        if (time >= 1) { finish(); return; }
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };

    function queue() {
      if (!ready || scheduled || finished || arrivalClaimed || document.readyState !== "complete" || document.visibilityState !== "visible") return;
      scheduled = true;
      entry.dataset.arrival = "waiting";
      timer = window.setTimeout(play, 700);
    }
    function onReady(event: Event) {
      const { detail } = event as RouteReady;
      if (stripLanguagePrefix(detail.routeKey.split("?")[0]) !== "/") { interrupt(); return; }
      if (detail.degraded) { interrupt(); return; }
      ready = true;
      queue();
    }
    window.addEventListener("public-route-ready", onReady);
    window.addEventListener(PUBLIC_NAVIGATION_EVENT, interrupt);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("pointerdown", interrupt, { capture: true, passive: true });
    window.addEventListener("keydown", interrupt, { capture: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", queue);
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", interrupt);

    // Covers a cached scene that completed before this sibling effect subscribed.
    const boot = getPublicBoot();
    const heroImage = document.querySelector<HTMLImageElement>("#main-content [data-immersive-hero] img");
    if (boot?.state === "degraded") interrupt();
    else if ((!boot || boot.state === "ready") && !document.documentElement.dataset.publicRouteLoading
      && heroImage?.complete && heroImage.naturalWidth > 0) { ready = true; queue(); }

    return () => { finish("skipped"); };
  }, [pathname, entryRef]);

  if (!eligible.current || stripLanguagePrefix(pathname) !== "/") return null;
  return (
    // No viewBox: SVG units stay CSS pixels, matching getBoundingClientRect.
    // innerWidth includes scrollbars; using it as a viewBox would scale the frame.
    <svg ref={sceneRef} className="fc-furniture-arrival" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`arrival-tail-${id}`} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B28A53" stopOpacity="0" />
          <stop offset=".45" stopColor="#D9C19F" stopOpacity=".55" />
          <stop offset=".85" stopColor="#F3DBB7" />
          <stop offset="1" stopColor="#FFF8E9" />
        </linearGradient>
        <filter id={`arrival-soft-${id}`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
        <filter id={`arrival-edge-${id}`} x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#382616" floodOpacity=".9" /></filter>
      </defs>
      <g data-arrival-border="" fill="none" stroke="#E8CDA8">
        <rect rx="9" pathLength="1" strokeDasharray="1" strokeWidth="4" filter={`url(#arrival-soft-${id})`} opacity=".5" />
        <rect rx="9" pathLength="1" strokeDasharray="1" strokeWidth="2" />
      </g>
      <path data-arrival-tail="" fill={`url(#arrival-tail-${id})`} filter={`url(#arrival-soft-${id})`} />
      <path data-arrival-tail="" fill={`url(#arrival-tail-${id})`} filter={`url(#arrival-edge-${id})`} />
      <g data-arrival-head="">
        <circle r="12" fill="#F2D6A7" opacity=".75" filter={`url(#arrival-soft-${id})`} />
        <path d="M-10 0H10M0-10V10" stroke="#FFF6E4" strokeWidth="1" opacity=".8" />
        <circle r="4" fill="#FFFAEF" filter={`url(#arrival-edge-${id})`} />
      </g>
    </svg>
  );
}
