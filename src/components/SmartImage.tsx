import * as React from "react";
import { isLocalImageSrc, preferWebpSrc, toLocalStaticImageSrc } from "@/lib/imageUrl";
import {
  buildLocalResponsiveSrcSet,
  isLocalResponsiveImageCandidate,
  normalizeLocalResponsiveImageWidths,
  toLocalResponsiveImageSrc,
} from "@/lib/localResponsiveImage";
import { buildSupabaseSrcSet, isSupabasePublicObjectUrl, toSupabaseRenderImageUrl } from "@/lib/supabaseImage";
import { cn } from "@/lib/utils";

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> & {
  src: string;
  width?: number;
  height?: number;
  /**
   * CSS sizes descriptor, e.g. "(max-width: 640px) 50vw, 25vw"
   */
  sizes?: string;
  /**
   * Candidate widths (w descriptors) used for srcset generation (Supabase only).
   * If omitted, falls back to [width, width*2] when width is provided.
   */
  candidateWidths?: number[];
  quality?: number;
  resize?: "contain" | "cover" | "fill";
};

type NativeFetchPriority = "high" | "low" | "auto";

const DEFAULT_SIZES = "100vw";

export function SmartImage({
  src,
  alt,
  className,
  loading,
  decoding,
  fetchPriority,
  width,
  height,
  sizes,
  candidateWidths,
  quality,
  resize,
  ...rest
}: SmartImageProps) {
  const isSupabase = isSupabasePublicObjectUrl(src);
  const normalizedSrc = isSupabase ? src : toLocalStaticImageSrc(src);
  const localSrc = !isSupabase && isLocalImageSrc(normalizedSrc) ? preferWebpSrc(normalizedSrc) : normalizedSrc;

  const resolvedSizes = sizes ?? DEFAULT_SIZES;
  const widths: number[] =
    candidateWidths ??
    (width
      ? [width, Math.min(width * 2, 2400)]
      : [480, 768, 1024, 1440]);
  const fallbackWidth = width ?? widths[0] ?? 480;

  const localResponsiveWidths =
    !isSupabase && candidateWidths && isLocalResponsiveImageCandidate(localSrc)
      ? normalizeLocalResponsiveImageWidths(widths)
      : [];
  const localResponsiveSrcSet = localResponsiveWidths.length
    ? buildLocalResponsiveSrcSet(localSrc, localResponsiveWidths)
    : undefined;
  const srcSet = isSupabase ? buildSupabaseSrcSet(src, widths, { height, quality, resize }) : localResponsiveSrcSet;
  const resolvedSrc = isSupabase
    ? toSupabaseRenderImageUrl(src, { width: fallbackWidth, height, quality, resize })
    : localResponsiveWidths.length
      ? toLocalResponsiveImageSrc(localSrc, localResponsiveWidths[0] ?? fallbackWidth)
    : localSrc;
  const resolvedFetchPriority: NativeFetchPriority = fetchPriority ?? (loading === "eager" ? "high" : "auto");
  const fetchPriorityAttr = { fetchpriority: resolvedFetchPriority } as { fetchpriority: NativeFetchPriority };

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      {...fetchPriorityAttr}
      className={cn(className)}
      {...rest}
    />
  );
}

export default SmartImage;

