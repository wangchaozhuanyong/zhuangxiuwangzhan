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
  timeoutMs?: number;
  /** Retained for existing callers; decoded images now appear without a fade. */
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
    const [url, ...descriptor] = candidate.trim().split(/\s+/);
    return [withRetry(url, retry), ...descriptor].join(" ");
  }).join(", ");

export function SmartImage({
  src, alt, className, loading, decoding, fetchPriority, width, height, sizes,
  candidateWidths, sourceWidth, quality, resize, targetAspectRatio,
  pictureSources, pictureClassName, critical = false, showFailureFallback = false, timeoutMs, revealOnLoad = false,
  onLoad, onError, ...rest
}: SmartImageProps) {
  const isSupabase = isSupabasePublicObjectUrl(src);
  const normalizedSrc = isSupabase ? src : toLocalStaticImageSrc(src);
  const normalizedLocalSrc = !isSupabase && isLocalImageSrc(normalizedSrc) ? preferWebpSrc(normalizedSrc) : normalizedSrc;
  const localSrc = !isSupabase ? toVersionedLocalResponsiveImageSrc(normalizedLocalSrc) : normalizedLocalSrc;
  const resolvedSizes = sizes ?? "100vw";
  const widths = candidateWidths ?? (width ? [width, Math.min(width * 2, 2400)] : [480, 768, 1024, 1440]);
  const fallbackWidth = candidateWidths?.[0] ?? width ?? widths[0] ?? 480;
  const localResponsiveWidths = !isSupabase && candidateWidths && isLocalResponsiveImageCandidate(localSrc)
    ? normalizeLocalResponsiveImageWidths(widths) : [];
  const generatedLocalSrcSet = localResponsiveWidths.length
    ? buildLocalResponsiveSrcSet(localSrc, localResponsiveWidths) : undefined;
  const largestGeneratedWidth = localResponsiveWidths[localResponsiveWidths.length - 1] ?? 0;
  const localResponsiveSrcSet = sourceWidth && sourceWidth > largestGeneratedWidth
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
  const framed = critical || showFailureFallback;
  const selectedSrc = imgRef.current?.currentSrc;
  const imageState = state.sourceKey === sourceKey &&
    (!state.currentSrc || !selectedSrc || state.currentSrc === selectedSrc)
    ? state.status : "loading";

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
          setPrevious(null);
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
    if (!timeoutMs || imageState !== "loading") return;
    const timer = window.setTimeout(() => {
      setState((current) => current.sourceKey === sourceKey && current.status === "loading"
        ? { sourceKey, status: "error" } : current);
    }, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [imageState, sourceKey, timeoutMs]);

  React.useEffect(() => {
    if (!critical) return;
    const handleTimeout = () => {
      setState((current) => current.sourceKey === sourceKey && current.status === "loading"
        ? { sourceKey, status: "error" } : current);
    };
    window.addEventListener("public-image-timeout", handleTimeout);
    return () => window.removeEventListener("public-image-timeout", handleTimeout);
  }, [critical, sourceKey]);

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
        setPrevious(null);
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
    <span className="smart-image-frame">
      {previous ? <img src={previous} alt="" aria-hidden="true" className="smart-image-previous" /> : null}
      {selectedImage}
      {imageState === "error" ? (
        <span className="smart-image-failure" role="alert">
          <span lang="zh-CN">图片加载失败</span><span lang="en">Image unavailable</span>
          <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setRetry(Date.now()); }}><span lang="zh-CN">重试</span><span lang="en">Retry</span></button>
        </span>
      ) : null}
    </span>
  );
}

export default SmartImage;
