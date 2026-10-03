import * as React from "react";
import { PUBLIC_MOTION, prefersReducedMotion } from "@/lib/publicMotion";
import { isLocalImageSrc, preferWebpSrc, toLocalStaticImageSrc } from "@/lib/imageUrl";
import {
  buildLocalResponsiveSrcSet,
  isLocalResponsiveImageCandidate,
  normalizeLocalResponsiveImageWidths,
  resolveLocalCoverSizes,
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

type SmartImagePictureSource = Pick<React.SourceHTMLAttributes<HTMLSourceElement>, "media" | "sizes" | "srcSet" | "type">;

type SmartImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes"> & {
  src: string;
  width?: number;
  height?: number;
  sizes?: string;
  candidateWidths?: number[];
  sourceWidth?: number;
  quality?: number;
  resize?: "contain" | "cover" | "fill";
  targetAspectRatio?: SupabaseTargetAspectRatio;
  pictureSources?: SmartImagePictureSource[];
  pictureClassName?: string;
  /** Keeps the previous decoded bitmap visible while a replacement is loading. */
  critical?: boolean;
  showFailureFallback?: boolean;
  /** Keeps a stable image frame and gently hands off decoded replacements. */
  revealOnLoad?: boolean;
};

type NativeFetchPriority = "high" | "low" | "auto";
type ImageState = { sourceKey: string; status: "loading" | "loaded" | "error"; currentSrc?: string };

const withRetry = (url: string, retry: number) => {
  if (!retry) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}image_retry=${retry}`;
};

const retrySrcSet = (srcSet: string | undefined, retry: number) =>
  srcSet?.split(",").map((candidate) => {
    const [url = "", ...descriptor] = candidate.trim().split(/\s+/);
    if (!url) return "";
    return [withRetry(url, retry), ...descriptor].join(" ");
  }).join(", ");

export function SmartImage({
  src, alt, className, loading, decoding, fetchPriority, width, height, sizes,
  candidateWidths, sourceWidth, quality, resize, targetAspectRatio,
  pictureSources, pictureClassName, critical = false, showFailureFallback = false, revealOnLoad = false,
  onLoad, onError, ...rest
}: SmartImageProps) {
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

  const [retry, setRetry] = React.useState(0);
  const finalSrc = withRetry(resolvedSrc, retry);
  const finalSrcSet = retrySrcSet(srcSet, retry);
  const finalPictureSources = pictureSources?.map((source) => ({
    ...source, srcSet: retrySrcSet(source.srcSet, retry),
  }));
  const sourceKey = [finalSrc, finalSrcSet, finalPictureSources?.map((source) => `${source.media || "default"}:${source.srcSet || ""}`).join("|")].filter(Boolean).join("::");
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [state, setState] = React.useState<ImageState>({ sourceKey, status: "loading" });
  const [previous, setPrevious] = React.useState<string | null>(null);
  const requestId = React.useRef(0);
  const framed = critical || showFailureFallback || revealOnLoad;
  const selectedSrc = imgRef.current?.currentSrc;
  const imageState = state.sourceKey === sourceKey &&
    (!state.currentSrc || !selectedSrc || state.currentSrc === selectedSrc)
    ? state.status : "loading";
  const [slowSource, setSlowSource] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!framed || imageState !== "loading") return;
    const timer = window.setTimeout(() => setSlowSource(sourceKey), PUBLIC_MOTION.timeout);
    return () => window.clearTimeout(timer);
  }, [framed, imageState, sourceKey]);
  const slowImage = imageState === "loading" && slowSource === sourceKey;

  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const request = ++requestId.current;
    if (framed && state.status === "loaded" && state.currentSrc && state.sourceKey !== sourceKey) {
      setPrevious(state.currentSrc);
    }
    if (state.sourceKey !== sourceKey) setState({ sourceKey, status: "loading" });

    if (img.complete && img.naturalWidth > 0) {
      void Promise.resolve(typeof img.decode === "function" ? img.decode() : undefined)
        .then(() => {
          if (request !== requestId.current || !img.isConnected) return;
          setState({ sourceKey, status: "loaded", currentSrc: img.currentSrc || img.src });

        })
        .catch(() => {
          if (request === requestId.current) setState({ sourceKey, status: "error" });
        });
    }
    return () => { if (requestId.current === request) requestId.current = request + 1; };
    // The selected source changes when the browser swaps a picture candidate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  React.useEffect(() => {
    if (!previous || imageState !== "loaded") return;
    const timer = window.setTimeout(() => setPrevious(null), prefersReducedMotion() ? 0 : PUBLIC_MOTION.image);
    return () => window.clearTimeout(timer);
  }, [previous, imageState, sourceKey]);

  React.useEffect(() => {
    const image = imgRef.current;
    const retryTransfer = () => setRetry(Date.now());
    image?.addEventListener("public-image-retry", retryTransfer);
    return () => image?.removeEventListener("public-image-retry", retryTransfer);
  }, [sourceKey]);

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    const img = event.currentTarget;
    const selected = img.currentSrc || img.src;
    const request = ++requestId.current;
    if (framed && state.status === "loaded" && state.currentSrc && state.currentSrc !== selected) {
      setPrevious(state.currentSrc);
    }
    setState({ sourceKey, status: "loading" });
    void Promise.resolve(typeof img.decode === "function" ? img.decode() : undefined)
      .then(() => {
        if (request !== requestId.current || !img.isConnected || (img.currentSrc || img.src) !== selected) return;
        setState({ sourceKey, status: "loaded", currentSrc: selected });

        onLoad?.(event);
      })
      .catch(() => {
        if (request !== requestId.current) return;
        setState({ sourceKey, status: "error" });
        onError?.(event);
      });
  };

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    requestId.current++;
    setState({ sourceKey, status: "error" });
    onError?.(event);
  };

  const image = (
    <img
      ref={imgRef}
      src={finalSrc}
      srcSet={finalSrcSet}
      sizes={finalSrcSet ? resolvedSizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={loading ?? "lazy"}
      decoding={decoding ?? "async"}
      {...({ fetchpriority: (fetchPriority ?? (loading === "eager" ? "high" : "auto")) as NativeFetchPriority } as { fetchpriority: NativeFetchPriority })}
      data-image-state={imageState}
      data-decoded-src={imageState === "loaded" ? state.currentSrc : undefined}
      data-critical-image={critical ? "true" : undefined}
      className={cn("smart-image", revealOnLoad && "smart-image--reveal", critical && "smart-image--critical", className)}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );

  const selectedImage = finalPictureSources?.length ? (
    <picture className={cn("smart-image-picture block h-full w-full", pictureClassName)}>
      {finalPictureSources.map((source, index) => <source key={`${source.media || "default"}-${index}`} {...source} />)}
      {image}
    </picture>
  ) : image;

  if (!framed) return selectedImage;

  return (
    <span className="smart-image-frame" data-image-ready={imageState === "loaded" || undefined}>
      {previous ? <img src={previous} alt="" aria-hidden="true" className={cn("smart-image-previous", className)} style={rest.style} /> : null}
      {selectedImage}
      {imageState === "error" || slowImage ? (
        <span className={cn("smart-image-failure", slowImage && "smart-image-slow")} role={slowImage ? "status" : "alert"}>
          <span lang="zh-CN">{slowImage ? "图片加载较慢" : "图片加载失败"}</span><span lang="en">{slowImage ? "Image loading slowly" : "Image unavailable"}</span>
          <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setRetry(Date.now()); }}><span lang="zh-CN">重试</span><span lang="en">Retry</span></button>
        </span>
      ) : null}
    </span>
  );
}

export default SmartImage;
