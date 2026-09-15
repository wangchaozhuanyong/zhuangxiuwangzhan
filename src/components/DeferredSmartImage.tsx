import * as React from "react";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";

type DeferredSmartImageProps = React.ComponentProps<typeof SmartImage> & {
  rootMargin?: string;
  placeholderClassName?: string;
};

export function DeferredSmartImage({
  placeholderClassName,
  className,
  onLoad,
  onError,
  ...imageProps
}: DeferredSmartImageProps) {
  const [imageState, setImageState] = React.useState<"loading" | "loaded" | "error">("loading");

  return (
    <span
      className={cn("smart-image-placeholder block h-full w-full", placeholderClassName)}
      data-image-state={imageState}
      aria-busy={imageState === "loading" ? true : undefined}
    >
      <SmartImage
        {...imageProps}
        loading={imageProps.loading ?? "lazy"}
        revealOnLoad={imageProps.revealOnLoad ?? false}
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
