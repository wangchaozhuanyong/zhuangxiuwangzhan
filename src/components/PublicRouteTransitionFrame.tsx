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
  onCancelDeparture?: () => void;
  children: ReactNode;
};

/** Animate the live destination without suspending document hit testing.
 * Readiness belongs to the gate; presentation never delays the next input. */
export class PublicRouteTransitionFrame extends Component<Props> {
  private content = createRef<HTMLDivElement>();
  private animation: Animation | null = null;
  private navigationRevision = 0;
  private presented: string | null = null;
  previousRoute: string | null = null;
  private cancelAnimation = () => {
    this.animation?.cancel();
    this.animation = null;
  };
  private cancelQueuedNavigation = () => { this.navigationRevision++; };
  private historyChanged = () => {
    this.cancelQueuedNavigation();
    this.cancelAnimation();
  };

  private navigate = (event: Event) => {
    const request = event as CustomEvent<PublicNavigation>;
    request.preventDefault();
    this.cancelAnimation();
    const revision = ++this.navigationRevision;
    const next = new URL(request.detail.destination, window.location.href);
    const current = new URL(this.props.routeKey, window.location.href);
    const localUpdate = current.pathname === next.pathname ||
      isFurnitureListingPath(current.pathname) && isFurnitureListingPath(next.pathname);
    if (hasProtectedChanges() || localUpdate) {
      if (next.pathname === current.pathname && next.search === current.search) {
        flushSync(() => this.props.onCancelDeparture?.());
      }
      request.detail.commit();
      return;
    }
    // Coalesce same-turn requests without waiting for an exit or snapshot.
    queueMicrotask(() => {
      if (this.navigationRevision !== revision) return;
      // Retire the old route synchronously so it cannot reveal stale content
      // while React Router commits the next location.
      this.content.current?.setAttribute("data-leaving", "true");
      flushSync(() => this.props.onBeforeCommit?.());
      request.detail.commit();
    });
  };

  componentDidMount() {
    if (!this.props.pending) this.presented = this.props.routeKey;
    window.addEventListener(PUBLIC_NAVIGATION_EVENT, this.navigate);
    window.addEventListener("popstate", this.historyChanged);
    window.addEventListener("pointerdown", this.cancelAnimation, { capture: true, passive: true });
    window.addEventListener("keydown", this.cancelAnimation, true);
  }

  componentDidUpdate(previous: Props) {
    const changed = previous.routeKey !== this.props.routeKey;
    if (changed || !previous.pending && this.props.pending) {
      this.content.current?.removeAttribute("data-leaving");
      this.cancelQueuedNavigation();
      this.cancelAnimation();
      this.previousRoute = this.presented;
    }
    if (this.props.pending || !changed && !previous.pending) return;
    this.presented = this.props.routeKey;
    const target = this.props.regionOnly
      ? this.content.current?.querySelector<HTMLElement>("[data-public-results]")
      : this.content.current;
    if (!target || this.props.initial || prefersReducedMotion() || typeof target.animate !== "function") {
      return;
    }
    const animation = target.animate([{ opacity: .86 }, { opacity: 1 }], {
      duration: PUBLIC_MOTION.image,
      easing: "cubic-bezier(0.2, 0.65, 0.3, 1)",
    });
    this.animation = animation;
    void animation.finished.then(() => {
      if (this.animation !== animation) return;
      this.animation = null;
    }, () => { /* Superseded by another route or retry. */ });
  }

  componentWillUnmount() {
    window.removeEventListener(PUBLIC_NAVIGATION_EVENT, this.navigate);
    window.removeEventListener("popstate", this.historyChanged);
    window.removeEventListener("pointerdown", this.cancelAnimation, true);
    window.removeEventListener("keydown", this.cancelAnimation, true);
    this.cancelQueuedNavigation();
    this.cancelAnimation();
  }

  render() {
    return <div ref={this.content} className="public-route-scene"
      data-pending={this.props.pending || undefined} data-region-only={this.props.regionOnly || undefined}>
      {this.props.children}
    </div>;
  }
}
