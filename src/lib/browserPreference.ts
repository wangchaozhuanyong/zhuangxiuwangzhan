const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readCookie = (name: string) => {
  if (typeof document === "undefined" || !document.cookie) return null;

  for (const cookie of document.cookie.split(";")) {
    const trimmed = cookie.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const cookieName = safeDecode(trimmed.slice(0, separatorIndex));
    if (cookieName === name) {
      return safeDecode(trimmed.slice(separatorIndex + 1));
    }
  }

  return null;
};

const writeCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;

  try {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
  } catch {
    // Some compatibility modes block cookie writes. Local in-memory state still keeps the current page usable.
  }
};

const readLocalStorage = (key: string) => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLocalStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Older Chromium shells and privacy modes can throw here. The cookie fallback covers reloads when available.
  }
};

export const readBrowserPreference = (key: string, cookieName = key) =>
  readCookie(cookieName) ?? readLocalStorage(key);

export const writeBrowserPreference = (key: string, value: string, cookieName = key) => {
  writeLocalStorage(key, value);
  writeCookie(cookieName, value);
};
