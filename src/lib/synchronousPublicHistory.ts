import type { createBrowserRouter } from "react-router-dom";
import { isAdminPath } from "@/lib/publicChrome";

type BrowserDataRouter = ReturnType<typeof createBrowserRouter>;

/** Renderer view only: completed public POPs must commit with their URL.
 * The original router, blockers and unrelated subscribers stay unchanged. */
export function withSynchronousPublicHistory(router: BrowserDataRouter): BrowserDataRouter {
  const subscribe: BrowserDataRouter["subscribe"] = (subscriber) => {
    let previousLocation = router.state.location;
    return router.subscribe((state, options) => {
      const next = state.location;
      const changed = next.key !== previousLocation.key || next.pathname !== previousLocation.pathname
        || next.search !== previousLocation.search || next.hash !== previousLocation.hash;
      const publicPop = state.initialized && state.navigation.state === "idle" && state.historyAction === "POP"
        && changed && !isAdminPath(previousLocation.pathname) && !isAdminPath(next.pathname);
      // A synchronous render can cause a nested notification. Save this owner
      // first so the outer callback cannot restore an older location afterward.
      previousLocation = next;
      subscriber(state, publicPop ? { ...options, flushSync: true } : options);
    });
  };
  return new Proxy(router, {
    get(target, key) {
      return key === "subscribe" ? subscribe : Reflect.get(target, key, target);
    },
  });
}
