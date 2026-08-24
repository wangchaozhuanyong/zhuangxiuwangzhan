import * as React from "react";
import { isLocalImageSrc, preferWebpSrc, toLocalStaticImageSrc } from "@/lib/imageUrl";
import {
  buildLocalResponsiveSrcSet,
  isLocalResponsiveImageCandidate,
  normalizeLocalResponsiveImageWidths,
  toLocalResponsiveImageSrc,
  toVersionedLocalResponsiveImageSrc,
} from "@/lib/localResponsiveImage";
import {
  buildSupabaseSrcSet,
  isSupabasePublicObjectUrl,
  resolveSupabaseHeightForWidth,
  toSupabaseRenderImageUrl,
  type SupabaseTargetAspectRatio,
} from "@/lib/supabaseImage";
import { cn } from "@/lib/utils";

type SmartImagePictureSource = Pick<
  React.SourceHTMLAttributes<HTMLSourceElement>,
  "media" | "sizes" | "srcSet" | "type"
>;

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> & {
  src: string;
  width?: number;
  height?: number;
  /**
   * CSS sizes descriptor, e.g. "(max-width: 640px) 50vw, 25vw"
   */
  sizes?: string;
  /**
   * Candidate widths (w descriptors) used for srcset generation (Supabase and supported local images).
   * If omitted, falls back to [width, width*2] when width is provided.
   */
  candidateWidths?: number[];
  /** Exact pixel width of the original local WebP, used as the final high-DPR srcset candidate. */
  sourceWidth?: number;
  quality?: number;
  resize?: "contain" | "cover" | "fill";
  /** Crop each Supabase srcset candidate to this width/height ratio. */
  targetAspectRatio?: SupabaseTargetAspectRatio;
  /** Optional art-directed picture sources, ordered from most specific to least specific. */
  pictureSources?: SmartImagePictureSource[];
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
  sourceWidth,
  quality,
  resize,
  targetAspectRatio,
  pictureSources,
  ...rest
}: SmartImageProps) {
  const isSupabase = isSupabasePublicObjectUrl(src);
  const normalizedSrc = isSupabase ? src : toLocalStaticImageSrc(src);
  const normalizedLocalSrc = !isSupabase && isLocalImageSrc(normalizedSrc) ? preferWebpSrc(normalizedSrc) : normalizedSrc;
  const localSrc = !isSupabase ? toVersionedLocalResponsiveImageSrc(normalizedLocalSrc) : normalizedLocalSrc;

  const resolvedSizes = sizes ?? DEFAULT_SIZES;
  const widths: number[] =
    candidateWidths ??
    (width
      ? [width, Math.min(width * 2, 2400)]
      : [480, 768, 1024, 1440]);
  const fallbackWidth = candidateWidths?.[0] ?? width ?? widths[0] ?? 480;

  const localResponsiveWidths =
    !isSupabase && candidateWidths && isLocalResponsiveImageCandidate(localSrc)
      ? normalizeLocalResponsiveImageWidths(widths)
      : [];
  const generatedLocalSrcSet = localResponsiveWidths.length
    ? buildLocalResponsiveSrcSet(localSrc, localResponsiveWidths)
    : undefined;
  const largestGeneratedWidth = localResponsiveWidths[localResponsiveWidths.length - 1] ?? 0;
  const localResponsiveSrcSet =
    sourceWidth && sourceWidth > largestGeneratedWidth
      ? [generatedLocalSrcSet, `${localSrc} ${sourceWidth}w`].filter(Boolean).join(", ")
      : generatedLocalSrcSet;
  const srcSet = isSupabase
    ? buildSupabaseSrcSet(src, widths, { height, quality, resize, targetAspectRatio })
    : localResponsiveSrcSet;
  const fallbackHeight = resolveSupabaseHeightForWidth(fallbackWidth, targetAspectRatio, height);
  const resolvedSrc = isSupabase
    ? toSupabaseRenderImageUrl(src, { width: fallbackWidth, height: fallbackHeight, quality, resize })
    : localResponsiveWidths.length
      ? toLocalResponsiveImageSrc(localSrc, localResponsiveWidths[0] ?? fallbackWidth)
    : localSrc;

  const resolvedFetchPriority: NativeFetchPriority = fetchPriority ?? (loading === "eager" ? "high" : "auto");
  const fetchPriorityAttr = { fetchpriority: resolvedFetchPriority } as { fetchpriority: NativeFetchPriority };

  const image = (
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

  if (!pictureSources?.length) return image;

  return (
    <picture className="block h-full w-full">
      {pictureSources.map((source, index) => (
        <source key={`${source.media || "default"}-${index}`} {...source} />
      ))}
      {image}
    </picture>
  );
}

export default SmartImage;
