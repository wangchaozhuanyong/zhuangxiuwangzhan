import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { buildGoogleMapEmbedSrc, buildGoogleMapOpenUrl } from "@/lib/mapUrls";
import { cn } from "@/lib/utils";

type GoogleMapEmbedProps = {
  title: string;
  /** 加载前展示的地址说明 */
  addressLabel?: string;
  height?: number;
  className?: string;
};

const copy = {
  en: {
    loading: "Loading map…",
    openMaps: "Open in Google Maps",
    preview: "Office location map",
  },
  zh: {
    loading: "地图加载中…",
    openMaps: "在 Google 地图中打开",
    preview: "办公室位置地图",
  },
};

/**
 * 进入视口后再加载 Google Maps iframe，并显示加载占位，避免长时间空白。
 */
const GoogleMapEmbed = ({ title, addressLabel, height = 350, className }: GoogleMapEmbedProps) => {
  const { language } = useLanguage();
  const t = copy[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const embedSrc = buildGoogleMapEmbedSrc();
  const openUrl = buildGoogleMapOpenUrl();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-card-lg border border-border bg-muted", className)}
      style={{ height }}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-muted px-6 text-center"
          aria-busy={shouldLoad}
        >
          {shouldLoad ? (
            <Loader2 className="h-9 w-9 animate-spin text-accent" aria-hidden />
          ) : (
            <MapPin className="h-9 w-9 text-accent" aria-hidden />
          )}
          <p className="text-sm font-medium text-foreground">{shouldLoad ? t.loading : t.preview}</p>
          {addressLabel ? <p className="max-w-sm text-xs text-muted-foreground">{addressLabel}</p> : null}
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            {t.openMaps}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {shouldLoad ? (
        <iframe
          src={embedSrc}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
          onLoad={() => setIsLoaded(true)}
          className={cn("h-full w-full transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0")}
        />
      ) : null}
    </div>
  );
};

export default GoogleMapEmbed;
