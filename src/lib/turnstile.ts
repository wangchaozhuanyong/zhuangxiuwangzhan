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

  scriptPromise = new Promise((resolve, reject) => {
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

    const onLoad = () => settle(resolve);
    const onError = () =>
      settle(() => {
        scriptPromise = null;
        reject(new Error("Turnstile could not be loaded"));
      });

    timeoutId = window.setTimeout(() => {
      settle(() => {
        if (!window.turnstile && script?.parentNode) script.parentNode.removeChild(script);
        scriptPromise = null;
        reject(new Error("Turnstile load timed out"));
      });
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
    container.style.display = "none";
    document.body.appendChild(container);

    let widgetId = "";
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (widgetId) turnstile.remove(widgetId);
      container.remove();
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Turnstile verification timed out"));
    }, TOKEN_TIMEOUT_MS);

    widgetId = turnstile.render(container, {
      sitekey: siteKey,
      size: "invisible",
      action,
      callback: (token: string) => {
        cleanup();
        resolve(token);
      },
      "error-callback": () => {
        cleanup();
        reject(new Error("Turnstile verification failed"));
      },
      "expired-callback": () => {
        cleanup();
        reject(new Error("Turnstile verification expired"));
      },
    });

    turnstile.execute(widgetId);
  });
};
