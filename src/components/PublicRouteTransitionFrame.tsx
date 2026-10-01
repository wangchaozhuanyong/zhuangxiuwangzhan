import { Component, createRef, type ReactNode } from "react";
import { PUBLIC_MOTION, prefersReducedMotion } from "@/lib/publicMotion";

type Props = {
  routeKey: string;
  pending: boolean;
  regionOnly: boolean;
  children: ReactNode;
};
type Snapshot = { surface: HTMLElement; routeKey: string; clip: string } | null;

/** Capture before React changes the DOM. The inert visual copy has no React effects,
 * duplicate IDs, live controls or image candidate requests. Only one copy is retained. */
export class PublicRouteTransitionFrame extends Component<Props> {
  private content = createRef<HTMLDivElement>();
  private retained = createRef<HTMLDivElement>();
  private animation: Animation | null = null;
  previousRoute: string | null = null;

  getSnapshotBeforeUpdate(previous: Props): Snapshot {
    if (!this.content.current) return null;
    const initial = previous.pending && !this.props.pending
      ? this.content.current.querySelector<HTMLElement>('[data-route-loader="initial"]') : null;
    if (previous.routeKey === this.props.routeKey && !initial) return null;
    // Rapid navigation keeps the last complete picture, never a half-loaded route.
    if (previous.pending && this.retained.current?.firstChild) return null;
    const source = initial || this.content.current;
    const region = this.props.regionOnly ? source.querySelector<HTMLElement>("[data-public-results]")?.getBoundingClientRect() : null;
    if (previous.pending && !initial) return null;
    const surface = source.cloneNode(true) as HTMLElement;
    const rect = source.getBoundingClientRect();
    const originals = source.querySelectorAll<HTMLImageElement>("img");
    surface.querySelectorAll<HTMLImageElement>("img").forEach((image, index) => {
      const original = originals[index];
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      image.loading = "lazy";
      if (original?.complete && original.naturalWidth > 0) image.src = original.currentSrc || original.src;
      else image.removeAttribute("src");
    });
    surface.querySelectorAll("script, style, link, source, iframe").forEach((node) => node.remove());
    surface.querySelectorAll("[id], [autofocus], [name]").forEach((node) => {
      node.removeAttribute("id");
      node.removeAttribute("autofocus");
      node.removeAttribute("name");
    });
    surface.setAttribute("inert", "");
    surface.removeAttribute("id");
    surface.removeAttribute("aria-busy");
    surface.style.cssText = `position:absolute;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;margin:0;pointer-events:none;`;
    return { surface, routeKey: previous.routeKey, clip: region ? `inset(${Math.max(0, region.top)}px ${Math.max(0, window.innerWidth - region.right)}px 0 ${Math.max(0, region.left)}px)` : "none" };
  }

  componentDidUpdate(previous: Props, _state: unknown, snapshot: Snapshot) {
    const retained = this.retained.current;
    if (!retained) return;
    if (previous.routeKey !== this.props.routeKey) {
      this.animation?.cancel();
      this.animation = null;
    }
    if (snapshot) {
      this.previousRoute = snapshot.routeKey;
      retained.replaceChildren(snapshot.surface);
      retained.style.clipPath = snapshot.clip;
    }
    if (!this.props.regionOnly) retained.style.clipPath = "none";
    if (this.props.pending || !retained.firstChild) return;
    if (this.animation) return;
    if (prefersReducedMotion() || typeof retained.animate !== "function") {
      retained.replaceChildren();
      return;
    }
    const animation = retained.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: this.props.regionOnly ? PUBLIC_MOTION.image : PUBLIC_MOTION.handoff,
      easing: PUBLIC_MOTION.easing,
    });
    this.animation = animation;
    void animation.finished.then(() => {
      if (this.animation !== animation) return;
      retained.replaceChildren();
      this.animation = null;
    }, () => { /* Superseded by the next navigation or unmount. */ });
  }

  componentWillUnmount() { this.animation?.cancel(); }

  render() {
    return <>
      <div ref={this.content} className="public-route-scene">{this.props.children}</div>
      <div ref={this.retained} className="public-route-retained" data-region-only={this.props.regionOnly || undefined}
        aria-hidden="true" />
    </>;
  }
}
