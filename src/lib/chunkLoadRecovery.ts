const CHUNK_RELOAD_KEY = "flashcast:chunk-load-recovery";
const CHUNK_LOG_KEY = "flashcast:chunk-load-recovery-log";
const CHUNK_REFRESH_PARAM = "__flashcast_refresh";
const RETRY_WINDOW_MS = 60 * 60 * 1000;
const CHUNK_LOAD_MESSAGE = "前端版本文件加载失败：浏览器或 CDN 还保留着旧的 SPA 入口 HTML，旧 HTML 引用了已经被新部署替换的 hashed JS chunk。系统会自动刷新一次并重新拉取最新入口。";

type ChunkRecoveryWindow = Window & {
  __flashcastChunkLoadRecoveryInstalled?: boolean;
};

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

export const getErrorMessage = (value: unknown) => {
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
    return CHUNK_LOAD_MESSAGE;
  }

  return message;
};

export const getSystemEventCategory = (message: string, eventType?: string) => {
  if (eventType === "frontend_deploy_cache_mismatch" || isChunkLoadError(message)) {
    return {
      key: "frontend_deploy_cache_mismatch",
      label: "前端生产部署缓存不一致",
    };
  }

  if (eventType === "react_render_error") {
    return {
      key: "react_render_error",
      label: "页面渲染错误",
    };
  }

  return {
    key: eventType || "system_event",
    label: "系统事件",
  };
};

const readRecoveryState = (): ChunkRecoveryState | null => {
  try {
    const raw = window.sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ChunkRecoveryState;
  } catch {
    return null;
  }
};

const writeRecoveryState = (state: ChunkRecoveryState) => {
  try {
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(state));
  } catch {
    // A reload is still safe even if sessionStorage is unavailable.
  }
};

const writePendingRecoveryLog = (state: ChunkRecoveryState) => {
  try {
    window.sessionStorage.setItem(
      CHUNK_LOG_KEY,
      JSON.stringify({
        ...state,
        eventType: "frontend_deploy_cache_mismatch",
      } satisfies ChunkRecoveryLog),
    );
  } catch {
    // Logging is best-effort; recovery must still continue.
  }
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

export const recoverFromChunkLoadError = (value: unknown) => {
  if (typeof window === "undefined" || !isChunkLoadError(value)) return false;

  const message = getErrorMessage(value);
  const path = window.location.pathname;
  const url = window.location.href;
  const now = Date.now();
  const previous = readRecoveryState();
  const alreadyRetried = previous && previous.path === path && now - previous.timestamp < RETRY_WINDOW_MS;

  if (alreadyRetried) return false;

  const state = { message, path, url, timestamp: now };
  writeRecoveryState(state);
  writePendingRecoveryLog(state);

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set(CHUNK_REFRESH_PARAM, String(now));
  window.location.replace(nextUrl.toString());
  return true;
};

export const installChunkLoadRecovery = () => {
  if (typeof window === "undefined") return;
  const recoveryWindow = window as ChunkRecoveryWindow;
  if (recoveryWindow.__flashcastChunkLoadRecoveryInstalled) return;
  recoveryWindow.__flashcastChunkLoadRecoveryInstalled = true;
  clearRefreshParam();

  window.addEventListener("unhandledrejection", (event) => {
    if (recoverFromChunkLoadError(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener("vite:preloadError", (event) => {
    const preloadEvent = event as Event & { payload?: unknown };
    if (recoverFromChunkLoadError(preloadEvent.payload || preloadEvent)) {
      event.preventDefault();
    }
  });

  window.addEventListener(
    "error",
    (event) => {
      recoverFromChunkLoadError(event.error || event.message);
    },
    true,
  );
};
