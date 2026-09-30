import { reviewedImageReplacements } from "@/lib/reviewedContentMedia.mjs";
import { localResponsiveImageMetadata } from "@/data/localResponsiveImageMetadata";

const RESPONSIVE_IMAGE_PREFIX = "/images/_responsive";
const LOCAL_RESPONSIVE_IMAGE_PATTERN = /^\/images\/(projects|services|materials|heroes|before-after)\/(.+\.webp)([?#].*)?$/i;
const VERSIONED_LOCAL_RESPONSIVE_IMAGES = new Map([
  ...reviewedImageReplacements,
  ["/images/services/bathroom-renovation.webp", "/images/services/v20260930/bathroom-renovation.webp"],
  ["/images/materials/acrylic-high-gloss-white.webp", "/images/materials/v20260928/acrylic-high-gloss-white.webp"],
  ["/images/materials/kitchen-acrylic-cabinets.webp", "/images/materials/v20260928/kitchen-acrylic-cabinets.webp"],
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

export function getLocalResponsiveImageDimensions(src: string) {
  return localResponsiveImageMetadata[toVersionedLocalResponsiveImageSrc(src).split(/[?#]/)[0]];
}

/** Local variants retain their source ratio, so cover may need more pixels than the frame width. */
export function resolveLocalCoverSizes(src: string, sizes: string, target?: { width: number; height: number }) {
  const source = getLocalResponsiveImageDimensions(src);
  if (!source || !target || target.width <= 0 || target.height <= 0) return sizes;
  const scale = (source.width / source.height) / (target.width / target.height);
  if (!Number.isFinite(scale) || scale <= 1) return sizes;

  // Split at top-level commas only: max(), min() and clamp() can contain commas too.
  const entries: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < sizes.length; index++) {
    if (sizes[index] === "(") depth++;
    if (sizes[index] === ")") depth--;
    if (sizes[index] === "," && depth === 0) {
      entries.push(sizes.slice(start, index).trim());
      start = index + 1;
    }
  }
  entries.push(sizes.slice(start).trim());

  return entries.map((entry) => {
    let valueStart = 0;
    let parentheses = 0;
    for (let index = 0; index < entry.length; index++) {
      if (entry[index] === "(") parentheses++;
      if (entry[index] === ")") parentheses--;
      if (/\s/.test(entry[index]) && parentheses === 0) valueStart = index + 1;
    }
    const value = entry.slice(valueStart);
    if (!value || value === "auto") return entry;
    return `${entry.slice(0, valueStart)}calc((${value}) * ${Number(scale.toFixed(5))})`;
  }).join(", ");
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
  const dimensions = getLocalResponsiveImageDimensions(versionedSrc);
  if (dimensions && !dimensions.variants[generatedWidth]) return versionedSrc;
  return `${RESPONSIVE_IMAGE_PREFIX}/${folder}/w${generatedWidth}/${relativePath}${suffix}`;
}

export function buildLocalResponsiveSrcSet(src: string, widths: number[], sourceWidth?: number) {
  if (!isLocalResponsiveImageCandidate(src)) return undefined;

  const normalizedWidths = normalizeLocalResponsiveImageWidths(widths);
  if (!normalizedWidths.length) return undefined;

  const dimensions = getLocalResponsiveImageDimensions(src);
  const originalWidth = dimensions?.width ?? sourceWidth;
  const originalSrc = toVersionedLocalResponsiveImageSrc(src);
  const candidates = new Map<number, string>();
  for (const width of normalizedWidths) {
    const actualWidth = dimensions ? dimensions.variants[width] : width;
    if (!actualWidth) continue;
    if (originalWidth && actualWidth >= originalWidth) {
      candidates.set(originalWidth, originalSrc);
    } else {
      candidates.set(actualWidth, toLocalResponsiveImageSrc(src, width));
    }
  }
  // Native originals retain details beyond the largest generated variant.
  if (originalWidth) candidates.set(originalWidth, originalSrc);
  return [...candidates].sort(([a], [b]) => a - b).map(([width, url]) => `${url} ${width}w`).join(", ") || undefined;
}
