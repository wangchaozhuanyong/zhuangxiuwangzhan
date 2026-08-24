const RESPONSIVE_IMAGE_PREFIX = "/images/_responsive";
const LOCAL_RESPONSIVE_IMAGE_PATTERN = /^\/images\/(projects|services|materials|heroes|before-after)\/(.+\.webp)([?#].*)?$/i;
const VERSIONED_LOCAL_RESPONSIVE_IMAGES = new Map([
  ["/images/before-after/after-bathroom.webp", "/images/before-after/v20260824/after-bathroom.webp"],
  ["/images/before-after/after-kitchen.webp", "/images/before-after/v20260824/after-kitchen.webp"],
  ["/images/before-after/after-living.webp", "/images/before-after/v20260824/after-living.webp"],
  ["/images/before-after/before-bathroom.webp", "/images/before-after/v20260824/before-bathroom.webp"],
  ["/images/before-after/before-kitchen.webp", "/images/before-after/v20260824/before-kitchen.webp"],
  ["/images/before-after/before-living.webp", "/images/before-after/v20260824/before-living.webp"],
  [
    "/images/projects/generated-portfolio/mont-kiara-luxury-condo-renovation.webp",
    "/images/projects/v20260824/generated-portfolio/mont-kiara-luxury-condo-renovation.webp",
  ],
  ["/images/services/old-house-renovation.webp", "/images/services/v20260824/old-house-renovation.webp"],
]);

export const LOCAL_RESPONSIVE_IMAGE_WIDTHS = [360, 560, 720, 900, 1200, 1600] as const;
const FALLBACK_LOCAL_RESPONSIVE_IMAGE_WIDTH = 1200;

const chooseGeneratedWidth = (width: number) =>
  LOCAL_RESPONSIVE_IMAGE_WIDTHS.find((candidate) => candidate >= width) ??
  LOCAL_RESPONSIVE_IMAGE_WIDTHS[LOCAL_RESPONSIVE_IMAGE_WIDTHS.length - 1] ??
  FALLBACK_LOCAL_RESPONSIVE_IMAGE_WIDTH;

export function toVersionedLocalResponsiveImageSrc(src: string) {
  const suffixIndex = src.search(/[?#]/);
  const path = suffixIndex >= 0 ? src.slice(0, suffixIndex) : src;
  const suffix = suffixIndex >= 0 ? src.slice(suffixIndex) : "";
  const versionedPath = VERSIONED_LOCAL_RESPONSIVE_IMAGES.get(path);
  return versionedPath ? `${versionedPath}${suffix}` : src;
}

export function isLocalResponsiveImageCandidate(src: string) {
  if (!src || src.startsWith(RESPONSIVE_IMAGE_PREFIX)) return false;
  return LOCAL_RESPONSIVE_IMAGE_PATTERN.test(src);
}

export function normalizeLocalResponsiveImageWidths(widths: number[]) {
  return Array.from(
    new Set(
      widths
        .filter((width) => Number.isFinite(width) && width > 0)
        .map((width) => chooseGeneratedWidth(Math.round(width))),
    ),
  ).sort((a, b) => a - b);
}

export function toLocalResponsiveImageSrc(src: string, width: number) {
  const versionedSrc = toVersionedLocalResponsiveImageSrc(src);
  const match = versionedSrc.match(LOCAL_RESPONSIVE_IMAGE_PATTERN);
  if (!match) return src;

  const folder = match[1];
  const relativePath = match[2];
  if (!relativePath) return src;
  const suffix = match[3] ?? "";
  const generatedWidth = chooseGeneratedWidth(Math.round(width));
  return `${RESPONSIVE_IMAGE_PREFIX}/${folder}/w${generatedWidth}/${relativePath}${suffix}`;
}

export function buildLocalResponsiveSrcSet(src: string, widths: number[]) {
  if (!isLocalResponsiveImageCandidate(src)) return undefined;

  const normalizedWidths = normalizeLocalResponsiveImageWidths(widths);
  if (!normalizedWidths.length) return undefined;

  return normalizedWidths.map((width) => `${toLocalResponsiveImageSrc(src, width)} ${width}w`).join(", ");
}
