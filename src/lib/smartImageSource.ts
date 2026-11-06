import { isLocalImageSrc, preferWebpSrc, toLocalStaticImageSrc } from "./imageUrl";
import {
  buildLocalResponsiveSrcSet,
  isLocalResponsiveImageCandidate,
  normalizeLocalResponsiveImageWidths,
  resolveLocalCoverSizes,
  toLocalResponsiveImageSrc,
  toVersionedLocalResponsiveImageSrc,
} from "./localResponsiveImage";
import {
  buildSupabaseSrcSet,
  isSupabasePublicObjectUrl,
  resolveSupabaseHeightForWidth,
  toSupabaseRenderImageUrl,
  type SupabaseTargetAspectRatio,
} from "./supabaseImage";

export type SmartImageSourceOptions = {
  src: string;
  width?: number;
  height?: number;
  sizes?: string;
  candidateWidths?: number[];
  sourceWidth?: number;
  quality?: number;
  resize?: "contain" | "cover" | "fill";
  targetAspectRatio?: SupabaseTargetAspectRatio;
};

/** Keep actual image elements and speculative responsive preloads on one URL contract. */
export function resolveSmartImageSource({ src, width, height, sizes, candidateWidths, sourceWidth, quality, resize, targetAspectRatio }: SmartImageSourceOptions) {
  const isSupabase = isSupabasePublicObjectUrl(src);
  const normalizedSrc = isSupabase ? src : toLocalStaticImageSrc(src);
  const normalizedLocalSrc = !isSupabase && isLocalImageSrc(normalizedSrc) ? preferWebpSrc(normalizedSrc) : normalizedSrc;
  const localSrc = !isSupabase ? toVersionedLocalResponsiveImageSrc(normalizedLocalSrc) : normalizedLocalSrc;
  const resolvedSizes = isSupabase
    ? sizes ?? "100vw"
    : resolveLocalCoverSizes(localSrc, sizes ?? "100vw", targetAspectRatio);
  const widths = candidateWidths ?? (width ? [width, Math.min(width * 2, 2400)] : [480, 768, 1024, 1440]);
  const fallbackWidth = candidateWidths?.[0] ?? width ?? widths[0] ?? 480;
  const localResponsiveWidths = !isSupabase && candidateWidths && isLocalResponsiveImageCandidate(localSrc)
    ? normalizeLocalResponsiveImageWidths(widths) : [];
  const localResponsiveSrcSet = localResponsiveWidths.length
    ? buildLocalResponsiveSrcSet(localSrc, localResponsiveWidths, sourceWidth) : undefined;
  const srcSet = isSupabase
    ? buildSupabaseSrcSet(src, widths, { height, quality, resize, targetAspectRatio })
    : localResponsiveSrcSet;
  const fallbackHeight = resolveSupabaseHeightForWidth(fallbackWidth, targetAspectRatio, height);
  const resolvedSrc = isSupabase
    ? toSupabaseRenderImageUrl(src, { width: fallbackWidth, height: fallbackHeight, quality, resize })
    : localResponsiveWidths.length
      ? toLocalResponsiveImageSrc(localSrc, localResponsiveWidths[0] ?? fallbackWidth)
      : localSrc;
  return { resolvedSrc, srcSet, resolvedSizes };
}
