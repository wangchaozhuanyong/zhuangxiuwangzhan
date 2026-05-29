import { siteConfig } from "@/config/site";

const officeAddress = siteConfig.address;

export const buildGoogleMapEmbedSrc = (query: string = officeAddress, zoom: number = siteConfig.mapZoom) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;

export const buildGoogleMapOpenUrl = (query: string = officeAddress) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
