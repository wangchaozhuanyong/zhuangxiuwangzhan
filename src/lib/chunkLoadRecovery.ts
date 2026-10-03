import { chunkLoadRecoveryText } from "@/i18n/chunkLoadRecoveryText";
import { getLanguageFromPath } from "@/i18n/routes";
import { getAdminLang } from "@/lib/adminPreferences";

const CHUNK_LOG_KEY = "flashcast:chunk-load-recovery-log";
const CHUNK_REFRESH_PARAM = "__flashcast_refresh";

type ChunkRecoveryState = {
  message: string;
  path: string;
  url: string;
  timestamp: number;
};

export type ChunkRecoveryLog = ChunkRecoveryState & {
  eventType: "frontend_deploy_cache_mismatch";
};

const CHUNK_LOAD_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to load module script/i,
  /Expected a JavaScript(?:-or-Wasm)? module script/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /error loading dynamically imported module/i,
  /\/assets\/[^ "'<>]+\.js/i,
];

export const isChunkLoadError = (value: unknown) => {
  const text = getErrorSearchText(value);
  if (!text) return false;
  const hasChunkSignal = CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(text));
  const looksLikeLazyDefaultFailure = /Cannot read propert(?:y|ies) of (?:undefined|null) \(reading ['"]default['"]\)/i.test(text);

  return hasChunkSignal || (looksLikeLazyDefaultFailure && /\/assets\/[^ "'<>]+\.js/i.test(text));
};

const getErrorSearchText = (value: unknown): string => {
  if (value instanceof Error) {
    const maybeCause = (value as Error & { cause?: unknown }).cause;
    return [value.name, value.message, value.stack, getErrorSearchText(maybeCause)]
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybeError = value as { message?: unknown; reason?: unknown; error?: unknown; stack?: unknown };
    return [maybeError.message, maybeError.stack, maybeError.reason, maybeError.error]
      .map((item) => getErrorSearchText(item))
      .filter(Boolean)
      .join("\n");
  }

  return "";
};

export const getErrorMessage = (value: unknown): string => {
  if (value instanceof Error) return value.message || value.name;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybeError = value as { message?: unknown; reason?: unknown; error?: unknown };
    if (typeof maybeError.message === "string") return maybeError.message;
    if (maybeError.reason) return getErrorMessage(maybeError.reason);
    if (maybeError.error) return getErrorMessage(maybeError.error);
  }

  try {
    return JSON.stringify(value ?? "");
  } catch {
    return String(value ?? "");
  }
};

export const getFriendlySystemMessage = (message: string, eventType?: string) => {
  if (eventType === "frontend_deploy_cache_mismatch" || isChunkLoadError(message)) {
    return chunkLoadRecoveryText[getRecoveryLanguage()].loadMessage;
  }

  return message;
};

const getRecoveryLanguage = () => {
  if (typeof window === "undefined") return "zh";
  return getLanguageFromPath(window.location.pathname) || getAdminLang();
};

export const getSystemEventCategory = (message: string, eventType?: string) => {
  const text = chunkLoadRecoveryText[getRecoveryLanguage()];

  if (eventType === "frontend_deploy_cache_mismatch" || isChunkLoadError(message)) {
    return {
      key: "frontend_deploy_cache_mismatch",
      label: text.deployCacheMismatch,
    };
  }

  if (eventType === "react_render_error") {
    return {
      key: "react_render_error",
      label: text.reactRenderError,
    };
  }

  return {
    key: eventType || "system_event",
    label: text.systemEvent,
  };
};

export const consumePendingChunkRecoveryLog = (): ChunkRecoveryLog | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(CHUNK_LOG_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(CHUNK_LOG_KEY);
    return JSON.parse(raw) as ChunkRecoveryLog;
  } catch {
    return null;
  }
};

const clearRefreshParam = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(CHUNK_REFRESH_PARAM)) return;

  url.searchParams.delete(CHUNK_REFRESH_PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
};

export const installChunkLoadRecovery = () => {
  // Keep old refresh URLs compatible, without taking over native navigation.
  // Failed route modules are handled by AppErrorBoundary's explicit retry button.
  clearRefreshParam();
  try {
    window.sessionStorage.removeItem("flashcast:chunk-load-recovery");
  } catch {
    // Storage may be unavailable; navigation and the error page still work.
  }
};
