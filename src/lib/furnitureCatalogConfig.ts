/** Existing materials records with this category belong to the furniture showcase. */
export const FURNITURE_MATERIAL_CATEGORY = "furniture";
export const furnitureShopUrl = "https://shop.flashcast.com.my/";

export const furnitureShopUrlForLanguage = (language: "en" | "zh" | "ms") =>
  new URL(`${language === "ms" ? "en" : language}/`, furnitureShopUrl).href;

/** Check the resolved pathname, never page search text or a partial segment. */
export const isFurniturePublicPath = (pathname: string) =>
  /^\/(?:zh|en|ms)\/furniture(?:\/|$)/.test(pathname);
