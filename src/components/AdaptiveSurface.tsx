import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { getReadableTextColor } from "@/lib/colorContrast";

type AdaptiveSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  background: string;
  foreground?: string;
};

const AdaptiveSurface = ({ background, foreground, className, style, ...props }: AdaptiveSurfaceProps) => {
  const adaptiveStyle = {
    "--adaptive-bg": background,
    "--adaptive-fg": foreground || getReadableTextColor(background),
    ...style,
  } as CSSProperties;

  return <div className={cn("adaptive-surface", className)} style={adaptiveStyle} {...props} />;
};

export default AdaptiveSurface;
