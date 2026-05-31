import * as React from "react";
import SmartImage from "@/components/SmartImage";
import { cn } from "@/lib/utils";

type DeferredSmartImageProps = React.ComponentProps<typeof SmartImage> & {
  rootMargin?: string;
  placeholderClassName?: string;
};

export function DeferredSmartImage({
  rootMargin = "320px",
  placeholderClassName,
  className,
  ...imageProps
}: DeferredSmartImageProps) {
  const placeholderRef = React.useRef<HTMLSpanElement | null>(null);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    if (shouldRender) return;
    const node = placeholderRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <span ref={placeholderRef} className={cn("block h-full w-full", placeholderClassName)}>
      {shouldRender ? <SmartImage {...imageProps} className={className} /> : null}
    </span>
  );
}

export default DeferredSmartImage;
