const RESPONSIVE_PROJECT_IMAGE_PREFIX = "/images/_responsive/projects";
const PROJECT_IMAGE_PATTERN = /^\/images\/projects\/(.+\.webp)([?#].*)?$/i;

export const LOCAL_RESPONSIVE_IMAGE_WIDTHS = [360, 560, 720, 900, 1200] as const;
const FALLBACK_LOCAL_RESPONSIVE_IMAGE_WIDTH = 1200;

const chooseGeneratedWidth = (width: number) =>
  LOCAL_RESPONSIVE_IMAGE_WIDTHS.find((candidate) => candidate >= width) ??
  LOCAL_RESPONSIVE_IMAGE_WIDTHS[LOCAL_RESPONSIVE_IMAGE_WIDTHS.length - 1] ??
  FALLBACK_LOCAL_RESPONSIVE_IMAGE_WIDTH;

export function isLocalResponsiveImageCandidate(src: string) {
  if (!src || src.startsWith(RESPONSIVE_PROJECT_IMAGE_PREFIX)) return false;
  return PROJECT_IMAGE_PATTERN.test(src);
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
  const match = src.match(PROJECT_IMAGE_PATTERN);
  if (!match) return src;

  const relativePath = match[1];
  if (!relativePath) return src;
  const suffix = match[2] ?? "";
  const generatedWidth = chooseGeneratedWidth(Math.round(width));
  return `${RESPONSIVE_PROJECT_IMAGE_PREFIX}/w${generatedWidth}/${relativePath}${suffix}`;
}

export function buildLocalResponsiveSrcSet(src: string, widths: number[]) {
  if (!isLocalResponsiveImageCandidate(src)) return undefined;

  const normalizedWidths = normalizeLocalResponsiveImageWidths(widths);
  if (!normalizedWidths.length) return undefined;

  return normalizedWidths.map((width) => `${toLocalResponsiveImageSrc(src, width)} ${width}w`).join(", ");
}
