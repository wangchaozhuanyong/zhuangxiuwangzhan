import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { buildGoogleMapEmbedSrc, buildGoogleMapOpenUrl } from "@/lib/mapUrls";
import { cn } from "@/lib/utils";

type GoogleMapEmbedProps = {
  title: string;
  addressLabel?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  height?: number;
  className?: string;
};

const copy = {
  en: {
    loading: "Loading map...",
    openMaps: "Open in Google Maps",
    preview: "Office location",
  },
  zh: {
    loading: "地图加载中...",
    openMaps: "在 Google 地图中打开",
    preview: "办公室地址",
  },
};

const GoogleMapEmbed = ({ title, addressLabel, latitude, longitude, height = 380, className }: GoogleMapEmbedProps) => {
  const { language } = useLanguage();
  const t = copy[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const embedSrc = buildGoogleMapEmbedSrc(addressLabel, undefined, latitude, longitude);
  const openUrl = buildGoogleMapOpenUrl(addressLabel, latitude, longitude);

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
      { rootMargin: "220px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-card-lg border border-border bg-card shadow-luxury", className)}
      style={{ height }}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card px-6 text-center"
          aria-busy={shouldLoad}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
            {shouldLoad ? (
              <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden />
            ) : (
              <MapPin className="h-6 w-6 text-gold" aria-hidden />
            )}
          </div>
          <p className="text-sm font-semibold text-foreground">{shouldLoad ? t.loading : t.preview}</p>
          {addressLabel ? <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{addressLabel}</p> : null}
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
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
          loading="lazy"
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
