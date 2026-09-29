import { stripLanguagePrefix } from "@/i18n/routes";

export const BOTTOM_NAV_SCROLL_INTENT = "restore-bottom-navigation" as const;

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
