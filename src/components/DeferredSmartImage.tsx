import * as React from "react";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";

type DeferredSmartImageProps = React.ComponentProps<typeof SmartImage> & {
  rootMargin?: string;
  placeholderClassName?: string;
};

const canUseIntersectionObserver = () =>
  typeof window !== "undefined" && typeof window.IntersectionObserver === "function";

export function DeferredSmartImage({
  rootMargin = "600px",
  placeholderClassName,
  className,
  ...imageProps
}: DeferredSmartImageProps) {
  const placeholderRef = React.useRef<HTMLSpanElement | null>(null);
  const [shouldRender, setShouldRender] = React.useState(false);
  const [imageState, setImageState] = React.useState<"idle" | "loading" | "loaded" | "error">("idle");
  const imageSource = imageProps.src;

  React.useEffect(() => {
    setShouldRender(false);
    setImageState("idle");
  }, [imageSource]);

  React.useEffect(() => {
    if (shouldRender) return;
    const node = placeholderRef.current;
    if (!node) return;

    if (!canUseIntersectionObserver()) {
      setShouldRender(true);
      setImageState("loading");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          setImageState("loading");
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <span
      ref={placeholderRef}
      className={cn("smart-image-placeholder block h-full w-full", placeholderClassName)}
      data-image-state={imageState}
      aria-busy={imageState === "loading" ? true : undefined}
    >
      {shouldRender ? (
        <SmartImage
          {...imageProps}
          revealOnLoad={imageProps.revealOnLoad ?? true}
          className={className}
          onLoad={(event) => {
            setImageState("loaded");
            imageProps.onLoad?.(event);
          }}
          onError={(event) => {
            setImageState("error");
            imageProps.onError?.(event);
          }}
        />
      ) : null}
    </span>
  );
}

export default DeferredSmartImage;
