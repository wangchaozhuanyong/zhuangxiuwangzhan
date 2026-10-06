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
  onBeforeCommit?: (captured?: boolean) => void;
  covered?: boolean;
  onSnapshotSkip?: () => void;
  children: ReactNode;
};

type Snapshot = {
  route: string;
  capturing: boolean;
  release: () => void;
  timer: number;
  transition?: ViewTransition;
};

/** The gate owns readiness; native snapshots bridge full-page paints.
 * Only local results animate in the DOM. No duplicate route or cloned page. */
export class PublicRouteTransitionFrame extends Component<Props> {
  private content = createRef<HTMLDivElement>();
  private animation: Animation | null = null;
  private navigationRevision = 0;
  private snapshot: Snapshot | null = null;
  private presented: string | null = null;
  previousRoute: string | null = null;
  whenPresented() { return (this.snapshot?.transition?.finished ?? this.animation?.finished)?.catch(() => {}) ?? Promise.resolve(); }
  isCapturing(route: string) { return this.snapshot?.capturing && this.snapshot.route === route; }
  private releaseSnapshot = () => {
    if (!this.snapshot) return;
    this.snapshot.capturing = false;
    window.clearTimeout(this.snapshot.timer);
    this.snapshot.release();
  };
  private cancelSnapshot = () => {
    const snapshot = this.snapshot;
    this.releaseSnapshot();
    this.snapshot = null;
    snapshot?.transition?.skipTransition();
    delete document.documentElement.dataset.publicViewTransition;
  };
  private cancelQueuedNavigation = () => { this.navigationRevision++; };
  private historyChanged = () => {
    this.cancelQueuedNavigation();
    this.cancelSnapshot();
    this.props.onSnapshotSkip?.();
  };

  private navigate = (event: Event) => {
    const request = event as CustomEvent<PublicNavigation>;
    request.preventDefault();
    this.cancelSnapshot();
    const revision = ++this.navigationRevision;
    const next = new URL(request.detail.destination, window.location.href);
    const current = new URL(this.props.routeKey, window.location.href);
    const localUpdate = current.pathname === next.pathname ||
      isFurnitureListingPath(current.pathname) && isFurnitureListingPath(next.pathname);
    if (hasProtectedChanges() || localUpdate) {
      request.detail.commit();
      return;
    }
    const commit = () => {
      this.content.current?.setAttribute("data-leaving", "true");
      flushSync(() => this.props.onBeforeCommit?.(Boolean(this.snapshot?.capturing)));
      request.detail.commit();
    };
    // Coalesce same-turn requests without fading the live page or adding a delay.
    queueMicrotask(() => {
      if (this.navigationRevision !== revision) return;
      if (this.props.pending || prefersReducedMotion() || typeof document.startViewTransition !== "function") {
        commit();
        return;
      }
      // The browser keeps a bitmap of the live page while React prepares the
      // destination. No duplicated route, media element or interactive DOM.
      let release = () => {};
      const captured = new Promise<void>((resolve) => { release = resolve; });
      const snapshot: Snapshot = { route: next.pathname + next.search, capturing: true, release, timer: 0 };
      this.snapshot = snapshot;
      document.documentElement.dataset.publicViewTransition = "true";
      const recover = () => {
        if (this.snapshot !== snapshot) return;
        flushSync(() => this.props.onSnapshotSkip?.());
        this.cancelSnapshot();
      };
      try {
        const transition = document.startViewTransition(() => {
          if (this.navigationRevision !== revision) return;
          // Bound the snapshot wait; a slow destination hands off to the brand.
          snapshot.timer = window.setTimeout(recover, PUBLIC_MOTION.feedbackDelay + PUBLIC_MOTION.control);
          commit();
          return captured;
        });
        snapshot.transition = transition;
        void transition.ready.catch(recover);
        void transition.finished.catch(() => {}).then(() => {
          if (this.snapshot === snapshot) this.cancelSnapshot();
        });
      } catch {
        recover();
        commit();
      }
    });
  };

  componentDidMount() {
    if (!this.props.pending) this.presented = this.props.routeKey;
    window.addEventListener(PUBLIC_NAVIGATION_EVENT, this.navigate);
    window.addEventListener("popstate", this.historyChanged);
  }

  componentDidUpdate(previous: Props) {
    const changed = previous.routeKey !== this.props.routeKey;
    if (changed || !previous.pending && this.props.pending) {
      this.content.current?.removeAttribute("data-leaving");
      this.cancelQueuedNavigation();
      this.animation?.cancel();
      this.animation = null;
      this.previousRoute = this.presented;
    }
    if (this.snapshot && changed && this.snapshot.route !== this.props.routeKey) this.cancelSnapshot();
    if (this.snapshot?.route === this.props.routeKey && (!this.props.pending || this.props.covered)) this.releaseSnapshot();
    if (this.props.pending || !changed && !previous.pending) return;
    const target = this.props.regionOnly
      ? this.content.current?.querySelector<HTMLElement>("[data-public-results]")
      : null;
    if (!target || this.props.initial || prefersReducedMotion() || typeof target.animate !== "function") {
      this.presented = this.props.routeKey;
      return;
    }
    const route = this.props.routeKey;
    const animation = target.animate([{ opacity: .86 }, { opacity: 1 }], {
      duration: PUBLIC_MOTION.image,
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
    window.removeEventListener("popstate", this.historyChanged);
    this.cancelQueuedNavigation();
    this.cancelSnapshot();
    this.animation?.cancel();
    this.animation = null;
  }

  render() {
    return <div ref={this.content} className="public-route-scene"
      data-pending={this.props.pending || undefined} data-region-only={this.props.regionOnly || undefined}>
      {this.props.children}
    </div>;
  }
}
