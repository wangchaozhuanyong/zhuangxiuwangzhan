import { runReadQuery } from "./interactionPolicy";
import { fetchPublicVersion, type PublicVersion } from "./publicVersion";

/** Both public hosts check for releases without interrupting a visit or overlapping reads. */
export function subscribePublicVersion(
  onVersion: (latest: PublicVersion) => void | Promise<void>,
  isPaused: () => boolean,
) {
  let request: AbortController | null = null;
  let disposed = false;
  async function check(force = false) {
    if (disposed || request || isPaused() || (!force && document.visibilityState === "hidden")) return;
    request = new AbortController();
    try {
      const latest = await runReadQuery(request.signal, fetchPublicVersion);
      if (!disposed) await onVersion(latest);
    } catch {
      // An unavailable version endpoint must not block rendering or clear the current content.
    } finally {
      request = null;
    }
  }
  const onActive = () => void check();
  void check(true);
  const timer = window.setInterval(onActive, 30_000);
  window.addEventListener("focus", onActive);
  document.addEventListener("visibilitychange", onActive);
  return () => {
    disposed = true;
    request?.abort();
    window.clearInterval(timer);
    window.removeEventListener("focus", onActive);
    document.removeEventListener("visibilitychange", onActive);
  };
}
