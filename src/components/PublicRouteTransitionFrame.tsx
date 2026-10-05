import { hasProtectedChanges } from "@/lib/navigationProtection";
import { Component, createRef, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { PUBLIC_MOTION, prefersReducedMotion } from "@/lib/publicMotion";
import { PUBLIC_NAVIGATION_EVENT, type PublicNavigation } from "@/lib/publicNavigation";
import { isFurnitureListingPath } from "@/lib/publicScrollRestoration";

type Props = {
  routeKey: string;
  pending: boolean;
  regionOnly: boolean;
  initial?: boolean;
  onBeforeCommit?: () => void;
  children: ReactNode;
};

/** Animate the live scene before navigation, then reveal the prepared destination.
 * No cloned page, duplicate media, or old content underneath the destination. */
export class PublicRouteTransitionFrame extends Component<Props> {
  private content = createRef<HTMLDivElement>();
  private animation: Animation | null = null;
  private leave: Animation | null = null;
  private presented: string | null = null;
  previousRoute: string | null = null;
  whenPresented() { return this.animation?.finished.catch(() => {}) ?? Promise.resolve(); }

  private navigate = (event: Event) => {
    const request = event as CustomEvent<PublicNavigation>;
    request.preventDefault();
    this.leave?.cancel();
    this.leave = null;
    const next = new URL(request.detail.destination, window.location.href);
    const current = new URL(this.props.routeKey, window.location.href);
    const localUpdate = current.pathname === next.pathname ||
      isFurnitureListingPath(current.pathname) && isFurnitureListingPath(next.pathname);
    const scene = this.content.current;
    if (hasProtectedChanges() || !scene || localUpdate || this.props.pending || this.animation || prefersReducedMotion() || typeof scene.animate !== "function") {
      request.detail.commit();
      return;
    }
    const exit = scene.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: PUBLIC_MOTION.exit, easing: "ease-in", fill: "forwards",
    });
    this.leave = exit;
    void exit.finished.then(() => {
      if (this.leave !== exit) return;
      scene.dataset.leaving = "true";
      // Publish the feedback DOM before Router changes the URL asynchronously.
      flushSync(() => this.props.onBeforeCommit?.());
      request.detail.commit();
    }, () => { /* A newer click or browser navigation superseded this exit. */ });
  };

  componentDidMount() {
    if (!this.props.pending) this.presented = this.props.routeKey;
    window.addEventListener(PUBLIC_NAVIGATION_EVENT, this.navigate);
  }

  componentDidUpdate(previous: Props) {
    const changed = previous.routeKey !== this.props.routeKey;
    if (changed || !previous.pending && this.props.pending) {
      this.content.current?.removeAttribute("data-leaving");
      this.leave?.cancel();
      this.leave = null;
      this.animation?.cancel();
      this.animation = null;
      this.previousRoute = this.presented;
    }
    if (this.props.pending || !changed && !previous.pending) return;
    const target = this.props.regionOnly
      ? this.content.current?.querySelector<HTMLElement>("[data-public-results]")
      : this.content.current;
    if (!target || this.props.initial || prefersReducedMotion() || typeof target.animate !== "function") {
      this.presented = this.props.routeKey;
      return;
    }
    const route = this.props.routeKey;
    // Prepared content is already readable when the waiting feedback is removed.
    const animation = target.animate([{ opacity: .86 }, { opacity: 1 }], {
      duration: this.props.regionOnly ? PUBLIC_MOTION.image : PUBLIC_MOTION.enter,
      easing: "cubic-bezier(0.2, 0.65, 0.3, 1)",
    });
    this.animation = animation;
    void animation.finished.then(() => {
      if (this.animation !== animation) return;
      this.presented = route;
      this.animation = null;
    }, () => { /* Superseded by another route or retry. */ });
  }

  componentWillUnmount() {
    window.removeEventListener(PUBLIC_NAVIGATION_EVENT, this.navigate);
    this.leave?.cancel();
    this.animation?.cancel();
    this.leave = null;
    this.animation = null;
  }

  render() {
    return <div ref={this.content} className="public-route-scene"
      data-pending={this.props.pending || undefined} data-region-only={this.props.regionOnly || undefined}>
      {this.props.children}
    </div>;
  }
}
