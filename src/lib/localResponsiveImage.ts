const RESPONSIVE_IMAGE_PREFIX = "/images/_responsive";
const LOCAL_RESPONSIVE_IMAGE_PATTERN = /^\/images\/(projects|services|materials|heroes|before-after)\/(.+\.webp)([?#].*)?$/i;

export const LOCAL_RESPONSIVE_IMAGE_WIDTHS = [360, 560, 720, 900, 1200] as const;
const FALLBACK_LOCAL_RESPONSIVE_IMAGE_WIDTH = 1200;

const chooseGeneratedWidth = (width: number) =>
  LOCAL_RESPONSIVE_IMAGE_WIDTHS.find((candidate) => candidate >= width) ??
  LOCAL_RESPONSIVE_IMAGE_WIDTHS[LOCAL_RESPONSIVE_IMAGE_WIDTHS.length - 1] ??
  FALLBACK_LOCAL_RESPONSIVE_IMAGE_WIDTH;

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
  const match = src.match(LOCAL_RESPONSIVE_IMAGE_PATTERN);
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
