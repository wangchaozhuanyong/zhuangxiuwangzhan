const CHUNK_RELOAD_KEY = "flashcast:chunk-load-recovery";
const RETRY_WINDOW_MS = 60 * 60 * 1000;

type ChunkRecoveryState = {
  message: string;
  path: string;
  timestamp: number;
};

const CHUNK_LOAD_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk \d+ failed/i,
  /ChunkLoadError/i,
  /error loading dynamically imported module/i,
  /\/assets\/[^ "'<>]+\.js/i,
];

export const isChunkLoadError = (value: unknown) => {
  const text = getErrorMessage(value);
  if (!text) return false;
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(text));
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

export const getFriendlySystemMessage = (message: string, _eventType?: string) => {
  if (isChunkLoadError(message)) {
    return "前端版本文件加载失败，通常是浏览器缓存了旧版本页面导致。系统会尝试自动刷新一次。";
  }

  return message;
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

export const recoverFromChunkLoadError = (value: unknown) => {
  if (typeof window === "undefined" || !isChunkLoadError(value)) return false;

  const message = getErrorMessage(value);
  const path = window.location.pathname;
  const now = Date.now();
  const previous = readRecoveryState();
  const alreadyRetried = previous && previous.path === path && now - previous.timestamp < RETRY_WINDOW_MS;

  if (alreadyRetried) return false;

  writeRecoveryState({ message, path, timestamp: now });
  window.location.reload();
  return true;
};

export const installChunkLoadRecovery = () => {
  if (typeof window === "undefined") return;

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
