const siteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
const TURNSTILE_SCRIPT_ID = "cf-turnstile-api";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const TOKEN_TIMEOUT_MS = 15_000;
const shouldSkipTurnstile = import.meta.env.DEV;

let scriptPromise: Promise<void> | null = null;

const loadTurnstileScript = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("Turnstile is not available"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile could not be loaded")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile could not be loaded")), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
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
