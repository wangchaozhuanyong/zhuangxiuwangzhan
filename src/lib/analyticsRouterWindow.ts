import { isAdminPath } from "@/lib/publicChrome";

type DocumentNavigation = (href: string, replace: boolean) => void;

/** Keep a loaded public Google tag out of the admin document, and vice versa.
 * Only BrowserRouter uses this adapter; global history and consent are untouched.
 */
export const createAnalyticsRouterWindow = (
  browserWindow: Window,
  navigateDocument: DocumentNavigation = (href, replace) => {
    if (replace) browserWindow.location.replace(href);
    else browserWindow.location.assign(href);
  },
): Window => {
  const changeHistory = (method: "pushState" | "replaceState") =>
    (data: unknown, unused: string, url?: string | URL | null) => {
      const destination = url == null ? null : new URL(String(url), browserWindow.location.href);
      if (
        destination?.origin === browserWindow.location.origin
        && isAdminPath(destination.pathname) !== isAdminPath(browserWindow.location.pathname)
      ) {
        // Do not first mutate the URL: warmed tag history listeners/queued tasks
        // must still see the departing document's public URL until unload.
        navigateDocument(destination.href, method === "replaceState");
        return;
      }
      // Resolve at call time so public history still uses any tag-installed wrapper.
      browserWindow.history[method](data, unused, url);
    };

  const history = new Proxy(browserWindow.history, {
    get(target, key) {
      if (key === "pushState" || key === "replaceState") return changeHistory(key);
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  return new Proxy(browserWindow, {
    get(target, key) {
      if (key === "history") return history;
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
};
