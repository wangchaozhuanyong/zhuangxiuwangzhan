import { createMemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { withSynchronousPublicHistory } from "./synchronousPublicHistory";

type DataRouter = ReturnType<typeof createMemoryRouter>;
type Subscriber = Parameters<DataRouter["subscribe"]>[0];
type State = Parameters<Subscriber>[0];
type Options = Parameters<Subscriber>[1];
const options: Options = { deletedFetchers: [], newErrors: null, flushSync: false };

describe("completed public history rendering", () => {
  it("synchronizes actual public back/forward only for the renderer subscription", async () => {
    const router = createMemoryRouter([{ path: "*" }], { initialEntries: ["/zh/services", "/zh/projects"], initialIndex: 1 });
    const originalSubscribe = router.subscribe;
    const view = withSynchronousPublicHistory(router);
    const renderer = vi.fn();
    const otherSubscriber = vi.fn();
    const stopRenderer = view.subscribe(renderer);
    const stopOther = router.subscribe(otherSubscriber);
    try {
      expect(view.state).toBe(router.state);
      expect(view.navigate).toBe(router.navigate);
      expect(router.subscribe).toBe(originalSubscribe);
      await router.navigate(-1);
      expect(renderer.mock.lastCall![0].location.pathname).toBe("/zh/services");
      expect(renderer.mock.lastCall![1].flushSync).toBe(true);
      expect(otherSubscriber.mock.lastCall![1].flushSync).toBe(false);
      await router.navigate(1);
      expect(renderer.mock.lastCall![0].location.pathname).toBe("/zh/projects");
      expect(renderer.mock.lastCall![1].flushSync).toBe(true);
      await router.navigate("/zh/materials");
      expect(renderer.mock.lastCall![1].flushSync).toBe(false);
      await router.navigate("/zh/materials?keep=1", { flushSync: true });
      expect(renderer.mock.lastCall![1].flushSync).toBe(true);
      expect(otherSubscriber.mock.lastCall![1].flushSync).toBe(true);
      stopRenderer();
      const count = renderer.mock.calls.length;
      await router.navigate(-1);
      expect(renderer).toHaveBeenCalledTimes(count);
    } finally { stopRenderer(); stopOther(); router.dispose(); }
  });

  it.each([
    ["/admin/projects", "/admin/settings"],
    ["/zh/projects", "/admin/settings"],
    ["/admin/projects", "/zh/services"],
  ])("preserves history scheduling across %s → %s", async (target, current) => {
    const router = createMemoryRouter([{ path: "*" }], { initialEntries: [target, current], initialIndex: 1 });
    const renderer = vi.fn();
    const stop = withSynchronousPublicHistory(router).subscribe(renderer);
    try {
      await router.navigate(-1);
      expect(renderer.mock.lastCall![0].location.pathname).toBe(target);
      expect(renderer.mock.lastCall![1].flushSync).toBe(false);
    } finally { stop(); router.dispose(); }
  });

  it("passes initial, blocked and unfinished notifications through without changing options", () => {
    const router = createMemoryRouter([{ path: "*" }], { initialEntries: ["/zh/projects"] });
    let notify!: Subscriber;
    const stop = vi.fn();
    vi.spyOn(router, "subscribe").mockImplementation((subscriber) => { notify = subscriber; return stop; });
    const renderer = vi.fn();
    const unsubscribe = withSynchronousPublicHistory(router).subscribe(renderer);
    try {
      notify(router.state, options);
      expect(renderer.mock.lastCall![1]).toBe(options);
      notify({ ...router.state, blockers: new Map([["editor", { state: "blocked", location: router.state.location, proceed: vi.fn(), reset: vi.fn() }]]) }, options);
      expect(renderer.mock.lastCall![1]).toBe(options);
      notify({ ...router.state, initialized: false, location: { ...router.state.location, pathname: "/zh/materials", key: "initializing" } }, options);
      expect(renderer.mock.lastCall![1]).toBe(options);
      notify({ ...router.state, navigation: { ...router.state.navigation, state: "loading", location: router.state.location }, location: { ...router.state.location, key: "loading" } }, options);
      expect(renderer.mock.lastCall![1]).toBe(options);
      unsubscribe();
      expect(stop).toHaveBeenCalledOnce();
    } finally { vi.restoreAllMocks(); router.dispose(); }
  });

  it("keeps the newest location owner when synchronous rendering causes a nested notification", () => {
    const router = createMemoryRouter([{ path: "*" }], { initialEntries: ["/zh/projects"] });
    let notify!: Subscriber;
    vi.spyOn(router, "subscribe").mockImplementation((subscriber) => { notify = subscriber; return () => {}; });
    const materials = { ...router.state, location: { ...router.state.location, pathname: "/zh/materials", key: "materials" } };
    const services = { ...router.state, location: { ...router.state.location, pathname: "/zh/services", key: "services" } };
    const notifications: Options[] = [];
    const renderer = vi.fn((state: State, metadata: Options) => {
      notifications.push(metadata);
      if (state.location.key === "materials") notify(services, options);
    });
    const stop = withSynchronousPublicHistory(router).subscribe(renderer);
    try {
      notify(materials, options);
      expect(renderer).toHaveBeenCalledTimes(2);
      expect(notifications[0].flushSync).toBe(true);
      expect(notifications[1].flushSync).toBe(true);
      notify(services, options);
      // This is a data/blocker update at the already-committed location.
      expect(notifications[2]).toBe(options);
    } finally { stop(); vi.restoreAllMocks(); router.dispose(); }
  });
});
