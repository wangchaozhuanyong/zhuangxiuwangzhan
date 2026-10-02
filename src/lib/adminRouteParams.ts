export const isNewAdminRouteRecord = (id?: string | null) => !id || id === "new";

const hasUnsafeUrlCharacters = (value: string) => value.includes("\\")
  || Array.from(value).some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127);

/** Login may only return to a local admin child route, even if history state is untrusted. */
export const getAdminReturnPath = (value: unknown): string => {
  const fallback = "/admin/dashboard";
  if (typeof value !== "string" || !value.startsWith("/admin/") || hasUnsafeUrlCharacters(value)) return fallback;
  try {
    const url = new URL(value, "https://admin.invalid");
    const decodedPath = decodeURIComponent(url.pathname);
    if (url.origin !== "https://admin.invalid" || !url.pathname.startsWith("/admin/") || url.pathname === "/admin/"
      || hasUnsafeUrlCharacters(decodedPath) || decodedPath.includes("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};
