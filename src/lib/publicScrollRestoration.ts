import { stripLanguagePrefix } from "@/i18n/routes";

export const BOTTOM_NAV_SCROLL_INTENT = "restore-bottom-navigation" as const;

const BOTTOM_NAV_PATHS = new Set([
  "/",
  "/projects",
  "/products",
  "/promotions",
  "/contact",
]);

export const isBottomNavPath = (pathname: string) =>
  BOTTOM_NAV_PATHS.has(stripLanguagePrefix(pathname));

export const hasBottomNavScrollIntent = (state: unknown) => {
  if (!state || typeof state !== "object") return false;
  return "scrollIntent" in state
    && state.scrollIntent === BOTTOM_NAV_SCROLL_INTENT;
};
