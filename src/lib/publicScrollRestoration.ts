import { stripLanguagePrefix } from "@/i18n/routes";

export const BOTTOM_NAV_SCROLL_INTENT = "restore-bottom-navigation" as const;
export const LISTING_SCROLL_INTENT = "restore-public-listing" as const;
export const ELEMENT_SCROLL_INTENT = "scroll-to-public-element" as const;

export const getPublicScrollTarget = (state: unknown): string | null => {
  if (!state || typeof state !== "object" || !("scrollIntent" in state) || state.scrollIntent !== ELEMENT_SCROLL_INTENT) return null;
  return "scrollTarget" in state && typeof state.scrollTarget === "string" && state.scrollTarget.length > 0 ? state.scrollTarget : null;
};

export const getListingScrollPosition = (state: unknown): number | null => {
  if (!state || typeof state !== "object" || !("scrollIntent" in state) || state.scrollIntent !== LISTING_SCROLL_INTENT) return null;
  return "scrollTop" in state && typeof state.scrollTop === "number" && Number.isFinite(state.scrollTop) && state.scrollTop >= 0 ? state.scrollTop : null;
};

export type FurnitureListingOrigin = { pathname: string; search: string; top: number };

/** Only accept local catalog locations; a detail opened directly keeps its category fallback. */
export const getFurnitureListingOrigin = (state: unknown): FurnitureListingOrigin | null => {
  if (!state || typeof state !== "object" || !("furnitureOrigin" in state)) return null;
  const value = state.furnitureOrigin;
  if (!value || typeof value !== "object" || !("pathname" in value) || !("search" in value) || !("top" in value)) return null;
  const { pathname, search, top } = value;
  if (typeof pathname !== "string" || !/^\/(?:zh|en)\/furniture(?:\/[a-z0-9-]+){0,2}\/?$/.test(pathname) || !isFurnitureListingPath(pathname)) return null;
  if (typeof search !== "string" || (search !== "" && !search.startsWith("?")) || search.includes("#")) return null;
  if (typeof top !== "number" || !Number.isFinite(top) || top < 0) return null;
  return { pathname, search, top };
};

const BOTTOM_NAV_PATHS = new Set([
  "/",
  "/projects",
  "/materials",
  "/promotions",
  "/contact",
]);

export const isBottomNavPath = (pathname: string) =>
  BOTTOM_NAV_PATHS.has(stripLanguagePrefix(pathname));

export const isFurnitureListingPath = (pathname: string) =>
  /^\/furniture(?:\/(?!product(?:\/|$))[^/]+(?:\/[^/]+)?)?\/?$/.test(stripLanguagePrefix(pathname));

let furnitureNavigationScroll: { pathname: string; top: number } | null = null;

export const rememberFurnitureNavigationScroll = (pathname: string, top: number) => {
  furnitureNavigationScroll = { pathname, top };
};

export const consumeFurnitureNavigationScroll = (pathname: string) => {
  const intent = furnitureNavigationScroll;
  furnitureNavigationScroll = null;
  return intent?.pathname === pathname && isFurnitureListingPath(pathname) ? intent.top : null;
};

export const hasBottomNavScrollIntent = (state: unknown) => {
  if (!state || typeof state !== "object") return false;
  return "scrollIntent" in state
    && state.scrollIntent === BOTTOM_NAV_SCROLL_INTENT;
};
