import { siteConfig } from "@/config/site";

/** 使用坐标嵌入，比地址 geocode 更快、更稳定 */
export const buildGoogleMapEmbedSrc = (
  lat: string | number = siteConfig.mapLatitude,
  lng: string | number = siteConfig.mapLongitude,
  zoom: number = siteConfig.mapZoom,
) => `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

export const buildGoogleMapOpenUrl = (
  lat: string | number = siteConfig.mapLatitude,
  lng: string | number = siteConfig.mapLongitude,
) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
