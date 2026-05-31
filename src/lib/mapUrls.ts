import { siteConfig } from "@/config/site";

const officeAddress = siteConfig.address;

export const hasValidMapCoordinates = (latitude?: string | number | null, longitude?: string | number | null) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const buildGoogleMapQuery = (
  query: string = officeAddress,
  latitude?: string | number | null,
  longitude?: string | number | null,
) => {
  if (hasValidMapCoordinates(latitude, longitude)) return `${Number(latitude)},${Number(longitude)}`;
  return query || officeAddress;
};

export const buildGoogleMapEmbedSrc = (
  query: string = officeAddress,
  zoom: number = siteConfig.mapZoom,
  latitude?: string | number | null,
  longitude?: string | number | null,
) => `https://www.google.com/maps?q=${encodeURIComponent(buildGoogleMapQuery(query, latitude, longitude))}&z=${zoom}&output=embed`;

export const buildGoogleMapOpenUrl = (
  query: string = officeAddress,
  latitude?: string | number | null,
  longitude?: string | number | null,
) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildGoogleMapQuery(query, latitude, longitude))}`;
