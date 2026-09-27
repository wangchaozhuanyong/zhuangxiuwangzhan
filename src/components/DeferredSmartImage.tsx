import * as React from "react";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";

type DeferredSmartImageProps = React.ComponentProps<typeof SmartImage> & {
  rootMargin?: string;
  placeholderClassName?: string;
};

export function DeferredSmartImage({
  rootMargin = "900px 0px",
  placeholderClassName,
  className,
  onLoad,
  onError,
  ...imageProps
}: DeferredSmartImageProps) {
  const [imageState, setImageState] = React.useState<"loading" | "loaded" | "error">("loading");
  const [nearViewport, setNearViewport] = React.useState(false);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const element = wrapperRef.current;
    if (!element || nearViewport) return;
    if (typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [nearViewport, rootMargin]);

  return (
    <span
      ref={wrapperRef}
      className={cn("smart-image-placeholder block h-full w-full", placeholderClassName)}
      data-image-state={imageState}
      aria-busy={imageState === "loading" ? true : undefined}
    >
      <SmartImage
        {...imageProps}
        loading={nearViewport || imageProps.loading === "eager" ? "eager" : "lazy"}
        revealOnLoad={imageProps.revealOnLoad ?? false}
        showFailureFallback
        className={className}
        onLoad={(event) => {
          setImageState("loaded");
          onLoad?.(event);
        }}
        onError={(event) => {
          setImageState("error");
          onError?.(event);
        }}
      />
    </span>
  );
}

export default DeferredSmartImage;
