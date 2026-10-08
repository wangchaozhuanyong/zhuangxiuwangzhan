const siteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
const TURNSTILE_SCRIPT_ID = "cf-turnstile-api";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_LOAD_TIMEOUT_MS = 8_000;
const TOKEN_TIMEOUT_MS = 10_000;
const shouldSkipTurnstile = import.meta.env.DEV;

let scriptPromise: Promise<void> | null = null;

const loadTurnstileScript = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("Turnstile is not available"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    let timeoutId = 0;
    let settled = false;
    let script: HTMLScriptElement | null = existing;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };

    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const fail = (message: string) => settle(() => {
      if (!window.turnstile) script?.remove();
      reject(new Error(message));
    });

    const onLoad = () => window.turnstile ? settle(resolve) : fail("Turnstile is not available");
    const onError = () =>
      fail("Turnstile could not be loaded");

    timeoutId = window.setTimeout(() => {
      fail("Turnstile load timed out");
    }, SCRIPT_LOAD_TIMEOUT_MS);

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
};

export const preloadTurnstile = () => {
  if (shouldSkipTurnstile || !siteKey) return Promise.resolve();
  return loadTurnstileScript();
};

export const getTurnstileToken = async (action: "contact" | "quote") => {
  if (shouldSkipTurnstile || !siteKey) return undefined;
  await loadTurnstileScript();

  const turnstile = window.turnstile;
  if (!turnstile) throw new Error("Turnstile is not available");

  return new Promise<string>((resolve, reject) => {
    const container = document.createElement("div");
    // Let the SDK size its invisible widget while keeping it out of page flow.
    // Hiding or moving the parent offscreen disrupts iframe initialization.
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      pointerEvents: "none",
    });
    container.setAttribute("aria-hidden", "true");
    document.body.appendChild(container);

    let widgetId: string | undefined;
    let settled = false;
    let cleanupScheduled = false;
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (cleanupScheduled) return;
      cleanupScheduled = true;
      // Let the SDK finish its callback/message handler before removing its iframe.
      // A synchronous render callback also needs time for the widget ID to return.
      window.setTimeout(() => {
        try {
          if (widgetId !== undefined) turnstile.remove(widgetId);
        } catch {
          // Cleanup must retain the original verification result if the SDK has
          // already discarded its widget; our container still needs removing.
        } finally {
          container.remove();
        }
      }, 0);
    };
    const finish = (result: string | Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (typeof result === "string") resolve(result);
      else reject(result);
    };
    const timeoutId = window.setTimeout(() => finish(new Error("Turnstile verification timed out")), TOKEN_TIMEOUT_MS);

    try {
      widgetId = turnstile.render(container, {
        sitekey: siteKey,
        size: "invisible",
        execution: "execute",
        action,
        callback: (token: string) => finish(token),
        "error-callback": () => finish(new Error("Turnstile verification failed")),
        "expired-callback": () => finish(new Error("Turnstile verification expired")),
        "timeout-callback": () => finish(new Error("Turnstile verification timed out")),
      });

      if (!settled) turnstile.execute(widgetId);
    } catch (error) {
      finish(error instanceof Error ? error : new Error("Turnstile verification failed"));
    }
  });
};
