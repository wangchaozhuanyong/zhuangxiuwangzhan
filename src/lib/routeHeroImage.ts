import { buildLocalResponsiveSrcSet, isLocalResponsiveImageCandidate } from "./localResponsiveImage";
import { buildSupabaseSrcSet, isSupabasePublicObjectUrl } from "./supabaseImage";
import { resolveSmartImageSource, type SmartImageSourceOptions } from "./smartImageSource";

export type RouteHeroImageOptions = {
  image?: string;
  imageSourceWidth?: number;
  tabletImage?: string;
  tabletImageSourceWidth?: number;
  mobileImage?: string;
  mobileImageSourceWidth?: number;
  showIntro?: boolean;
};

export type RouteHeroImagePreload = {
  href: string;
  srcSet?: string;
  sizes?: string;
  media?: string;
  fetchPriority?: "high" | "low";
};

const MOBILE_MEDIA = "(max-width: 767px)";
const TABLET_MEDIA = "(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)";
const DESKTOP_MEDIA = "(min-width: 1024px), (min-width: 768px) and (max-width: 1023px) and (orientation: landscape)";

/** Props shared by SchemeARouteHero and both document/intent preloads. */
export function getRouteHeroImageProps({ image, imageSourceWidth, tabletImage, tabletImageSourceWidth, mobileImage, mobileImageSourceWidth, showIntro = true }: RouteHeroImageOptions) {
  const pictureSource = (src: string, widths: number[], sourceWidth: number | undefined, quality: number, media: string) => ({
    media,
    srcSet: isSupabasePublicObjectUrl(src)
      ? buildSupabaseSrcSet(src, widths, { targetAspectRatio: { width: 16, height: 11 }, quality, resize: "cover" }) || src
      : isLocalResponsiveImageCandidate(src) ? buildLocalResponsiveSrcSet(src, widths, sourceWidth) || src : src,
    sizes: "100vw",
  });
  return {
    src: image || mobileImage || "",
    sourceWidth: imageSourceWidth,
    width: showIntro ? 1600 : 2160,
    height: showIntro ? 1100 : 720,
    targetAspectRatio: showIntro ? { width: 16, height: 11 } : { width: 3, height: 1 },
    resize: "cover" as const,
    sizes: showIntro ? "(min-width: 1536px) 836px, (min-width: 1024px) calc((100vw - 96px) * 0.58), 100vw" : "(min-width: 1536px) 1440px, (min-width: 1024px) 94vw, 100vw",
    candidateWidths: [560, 720, 960, 1200, 1600],
    quality: 86,
    pictureSources: [
      ...(mobileImage ? [pictureSource(mobileImage, [560, 720, 900, 1200, 1600], mobileImageSourceWidth, 86, MOBILE_MEDIA)] : []),
      ...(tabletImage ? [pictureSource(tabletImage, [720, 900, 1200, 1600, 2000], tabletImageSourceWidth, 84, TABLET_MEDIA)] : []),
    ],
  } satisfies SmartImageSourceOptions & { pictureSources: { media: string; srcSet: string; sizes: string }[] };
}

export function getRouteHeroImagePreloads(options: RouteHeroImageOptions): RouteHeroImagePreload[] {
  const props = getRouteHeroImageProps(options);
  if (!props.src) return [];
  const fallback = resolveSmartImageSource(props);
  const media = options.mobileImage && options.tabletImage ? DESKTOP_MEDIA
    : options.mobileImage ? "(min-width: 768px)"
      : options.tabletImage ? `${MOBILE_MEDIA}, ${DESKTOP_MEDIA}` : undefined;
  return [
    ...props.pictureSources.flatMap(source => {
      const [href] = source.srcSet.trim().split(/\s+/);
      return href ? [{ href, srcSet: source.srcSet === href ? undefined : source.srcSet, sizes: source.sizes, media: source.media }] : [];
    }),
    { href: fallback.resolvedSrc, srcSet: fallback.srcSet, sizes: fallback.srcSet ? fallback.resolvedSizes : undefined, media },
  ];
}

export const furnitureListingHeroImage = {
  image: "/images/heroes/v20261007/furniture-showcase-wide.webp",
  imageSourceWidth: 2160,
  showIntro: false,
} as const satisfies RouteHeroImageOptions;
