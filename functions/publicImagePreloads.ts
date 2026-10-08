import {
  buildLocalResponsiveSrcSet,
  isLocalResponsiveImageCandidate,
  normalizeLocalResponsiveImageWidths,
  resolveLocalCoverSizes,
  toLocalResponsiveImageSrc,
} from "../src/lib/localResponsiveImage";
import { getFurnitureListingRoute } from "../src/lib/furnitureCatalogPresentation";
import { isRecord, readString, readRecordArray } from "./publicDataValues";

type ProjectSummaryRow = Record<string, unknown>;
type ProjectDetailRow = Record<string, unknown>;
type HomeContentBundleRow = Record<string, unknown>;

export type ImagePreload = {
  href: string;
  srcSet?: string;
  sizes?: string;
  media?: string;
  fetchPriority?: "high" | "low";
};

const PROJECT_CARD_IMAGE_WIDTHS = [360, 560, 720, 900];
const HOME_FEATURED_PROJECT_WIDTHS = [560, 720, 960, 1200, 1600];
const HOME_SUPPORTING_PROJECT_MOBILE_WIDTHS = [360, 560, 720, 960];
const HOME_SUPPORTING_PROJECT_DESKTOP_WIDTHS = [360, 560, 720, 900, 1200, 1600];
const PROJECT_DETAIL_HERO_WIDTHS = [560, 720, 960, 1200, 1600];
const PROJECT_DETAIL_RELATED_WIDTHS = [360, 560, 720, 960, 1200];
const HOME_HERO_IMAGE_WIDTHS = [480, 720, 960, 1280, 1600];
const DEFAULT_HOME_HERO_IMAGE = "/images/heroes/hero-luxury-living.webp";
const HOME_HERO_IMAGE_SIZES = "(max-width: 767px) 100vw, (max-width: 1199px) 58vw, 60vw";
const HOME_ATELIER_HERO_PRELOADS: ImagePreload[] = [
  {
    href: "/images/_responsive/heroes/w360/v6/home-daylight-mobile.webp",
    srcSet: [
      "/images/_responsive/heroes/w360/v6/home-daylight-mobile.webp 360w",
      "/images/_responsive/heroes/w560/v6/home-daylight-mobile.webp 560w",
      "/images/_responsive/heroes/w720/v6/home-daylight-mobile.webp 720w",
      "/images/heroes/v6/home-daylight-mobile.webp 887w",
    ].join(", "),
    sizes: "100vw",
    media: "(max-width: 1023px)",
  },
  {
    href: "/images/_responsive/heroes/w720/v6/home-daylight-desktop.webp",
    srcSet: [
      "/images/_responsive/heroes/w720/v6/home-daylight-desktop.webp 720w",
      "/images/_responsive/heroes/w900/v6/home-daylight-desktop.webp 900w",
      "/images/_responsive/heroes/w1200/v6/home-daylight-desktop.webp 1200w",
      "/images/_responsive/heroes/w1600/v6/home-daylight-desktop.webp 1600w",
      "/images/heroes/v6/home-daylight-desktop.webp 1672w",
    ].join(", "),
    sizes: "100vw",
    media: "(min-width: 1024px)",
  },
];
const SUPABASE_PUBLIC_OBJECT_SEGMENT = "/storage/v1/object/public/";
const SUPABASE_PUBLIC_RENDER_SEGMENT = "/storage/v1/render/image/public/";
const STATIC_SITE_HOSTS = new Set(["flashcast.com.my", "www.flashcast.com.my"]);

const isSupabasePublicObjectUrl = (value: string) =>
  /^https?:\/\//i.test(value) && value.includes(SUPABASE_PUBLIC_OBJECT_SEGMENT);

const toSupabaseRenderImageUrl = (
  value: string,
  width: number,
  height: number,
  quality = 70,
  resize?: "cover",
) => {
  const renderBase = value.replace(SUPABASE_PUBLIC_OBJECT_SEGMENT, SUPABASE_PUBLIC_RENDER_SEGMENT);
  const separator = renderBase.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    quality: String(quality),
    width: String(width),
    height: String(height),
  });
  if (resize) params.set("resize", resize);
  params.set("format", "webp");

  return `${renderBase}${separator}${params.toString()}`;
};

const normalizePreloadImageUrl = (value: string) => {
  if (!value) return value;
  let normalized = value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (STATIC_SITE_HOSTS.has(parsed.hostname.toLowerCase()) && /^\/(?:images|videos)\//i.test(parsed.pathname)) {
        normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return value;
    }
  }

  return normalized.startsWith("/")
    ? normalized.replace(/\.(?:jpe?g|png)(\?[^#]*)?($|#)/i, ".webp$1$2")
    : normalized;
};

const buildImagePreload = (
  imageUrl: string,
  widths: number[],
  options: { height: number; sizes: string },
): ImagePreload => {
  if (isSupabasePublicObjectUrl(imageUrl)) {
    return {
      href: toSupabaseRenderImageUrl(imageUrl, widths[0] ?? 480, options.height),
      srcSet: widths
        .map((width) => `${toSupabaseRenderImageUrl(imageUrl, width, options.height)} ${width}w`)
        .join(", "),
      sizes: options.sizes,
    };
  }

  const normalizedUrl = normalizePreloadImageUrl(imageUrl);
  if (isLocalResponsiveImageCandidate(normalizedUrl)) {
    const responsiveWidths = normalizeLocalResponsiveImageWidths(widths);
    return {
      href: toLocalResponsiveImageSrc(normalizedUrl, responsiveWidths[0] ?? widths[0] ?? 480),
      srcSet: buildLocalResponsiveSrcSet(normalizedUrl, responsiveWidths),
      sizes: options.sizes,
    };
  }

  return { href: normalizedUrl };
};

const getHomeHeroImageUrl = (bundle: HomeContentBundleRow | null, key: string) => {
  const slideImage = readString(readRecordArray(bundle?.hero_slides)[0], "image_url");
  if (slideImage) return slideImage;

  const language = key.startsWith("/zh") ? "zh" : "en";
  const cmsPage = readRecordArray(bundle?.cms_pages)[0];
  const cmsSections = readRecordArray(cmsPage?.cms_sections).sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );
  const cmsHero = cmsSections.find(
    (section) => section.section_key === "hero" || section.section_type === "hero",
  );
  const localizedContent = cmsHero && isRecord(cmsHero[`content_${language}`])
    ? (cmsHero[`content_${language}`] as Record<string, unknown>)
    : null;
  const cmsImage = readString(localizedContent, "image_url") || readString(
    isRecord(cmsHero?.settings) ? cmsHero.settings : null,
    "image_url",
  );
  if (cmsImage) return cmsImage;

  return readString(readRecordArray(bundle?.site_pages)[0], "image_url") || DEFAULT_HOME_HERO_IMAGE;
};

const getProjectImageRank = (record: Record<string, unknown>) => {
  const imageType = readString(record, "image_type");
  if (imageType === "cover") return 0;
  if (imageType === "gallery") return 1;
  if (imageType === "before" || imageType === "after") return 2;
  return 3;
};

const getProjectThumbnailUrl = (project: Record<string, unknown>) => {
  const images = readRecordArray(project.project_images).sort((a, b) => {
    const rank = getProjectImageRank(a) - getProjectImageRank(b);
    if (rank !== 0) return rank;
    return Number(a.sort_order || 0) - Number(b.sort_order || 0);
  });

  return readString(images[0], "image_url") || readString(project, "image_url");
};

const buildProjectImagePreloads = (
  projects: unknown,
  maxImages: number,
  options: { height: number; sizes: string },
) => {
  const seen = new Set<string>();
  const preloads: ImagePreload[] = [];

  for (const project of readRecordArray(projects)) {
    if (preloads.length >= maxImages) break;
    const imageUrl = getProjectThumbnailUrl(project);
    if (!imageUrl || !isSupabasePublicObjectUrl(imageUrl) || seen.has(imageUrl)) continue;
    seen.add(imageUrl);

    const srcSet = PROJECT_CARD_IMAGE_WIDTHS.map(
      (width) => `${toSupabaseRenderImageUrl(imageUrl, width, options.height)} ${width}w`,
    ).join(", ");

    preloads.push({
      href: toSupabaseRenderImageUrl(imageUrl, PROJECT_CARD_IMAGE_WIDTHS[0], options.height),
      srcSet,
      sizes: options.sizes,
    });
  }

  return preloads;
};

const buildSupabaseImagePreload = (
  imageUrl: string,
  widths: number[],
  options: {
    height: number;
    quality: number;
    sizes: string;
    media?: string;
    resize?: "cover";
    aspectRatio?: { width: number; height: number };
    fetchPriority?: "high" | "low";
  },
): ImagePreload => {
  const candidate = (width: number) => toSupabaseRenderImageUrl(
    imageUrl,
    width,
    options.aspectRatio ? Math.round(width * options.aspectRatio.height / options.aspectRatio.width) : options.height,
    options.quality,
    options.resize,
  );

  return {
    href: candidate(widths[0] ?? 560),
    srcSet: widths.map((width) => `${candidate(width)} ${width}w`).join(", "),
    sizes: options.sizes,
    media: options.media,
    fetchPriority: options.fetchPriority,
  };
};

const getHomeProjectImagePreloads = (bundle: HomeContentBundleRow | null): ImagePreload[] => {
  const seen = new Set<string>();
  const projects = readRecordArray(bundle?.projects)
    .filter((project) => {
      const identity = getProjectThumbnailUrl(project) || readString(project, "slug");
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .slice(0, 4)
    .map(getProjectThumbnailUrl);
  const preloads: ImagePreload[] = [];
  let remoteImageCount = 0;

  for (const [index, imageUrl] of projects.entries()) {
    if (remoteImageCount >= 2) break;
    if (!isSupabasePublicObjectUrl(imageUrl)) continue;
    remoteImageCount++;

    if (index === 0) {
      preloads.push(buildSupabaseImagePreload(imageUrl, HOME_FEATURED_PROJECT_WIDTHS, {
        height: 1050,
        quality: 86,
        sizes: "(min-width: 1536px) 1440px, (min-width: 1024px) calc(100vw - 96px), 100vw",
        fetchPriority: "low",
      }));
    } else {
      preloads.push(buildSupabaseImagePreload(imageUrl, HOME_SUPPORTING_PROJECT_MOBILE_WIDTHS, {
        height: 450,
        quality: 84,
        sizes: "(max-width: 397px) 78vw, 310px",
        media: "(max-width: 47.9375rem)",
        resize: "cover",
        aspectRatio: { width: 4, height: 5 },
        fetchPriority: "low",
      }));
      preloads.push(buildSupabaseImagePreload(imageUrl, HOME_SUPPORTING_PROJECT_DESKTOP_WIDTHS, {
        height: 600,
        quality: 84,
        sizes: projects.length === 3
          ? "(max-width: 767px) 78vw, (min-width: 1536px) 708px, calc((100vw - 120px) / 2)"
          : "(max-width: 767px) 78vw, (min-width: 1536px) 464px, calc((100vw - 144px) / 3)",
        media: "(min-width: 48rem)",
        resize: "cover",
        aspectRatio: { width: 16, height: 10 },
        fetchPriority: "low",
      }));
    }
  }

  return preloads;
};

const getProjectDetailImagePreloads = (
  detail: ProjectDetailRow | null,
  projectSummaries: ProjectSummaryRow[] | null,
): ImagePreload[] => {
  if (!detail) return [];
  const preloads: ImagePreload[] = [];
  const seen = new Set<string>();
  const heroImage = getProjectThumbnailUrl(detail);

  if (isSupabasePublicObjectUrl(heroImage)) {
    seen.add(heroImage);
    preloads.push(buildSupabaseImagePreload(heroImage, PROJECT_DETAIL_HERO_WIDTHS, {
      height: 1100,
      quality: 86,
      sizes: "(min-width: 1536px) 789px, (min-width: 1024px) calc((100vw - 128px) * 0.56), 100vw",
    }));
  }

  const related = readRecordArray(projectSummaries)
    .filter((project) => readString(project, "slug") !== readString(detail, "slug"))
    .slice(0, 3);
  for (const [index, project] of related.entries()) {
    if (preloads.length >= 3) break;
    const imageUrl = getProjectThumbnailUrl(project);
    if (!isSupabasePublicObjectUrl(imageUrl) || seen.has(imageUrl)) continue;
    seen.add(imageUrl);
    preloads.push(buildSupabaseImagePreload(imageUrl, PROJECT_DETAIL_RELATED_WIDTHS, {
      height: index === 0 ? 750 : 540,
      quality: 82,
      sizes: "(max-width: 374px) calc(100vw - 24px), (max-width: 639px) calc(100vw - 32px), (max-width: 1023px) 46vw, (min-width: 1536px) 464px, calc((100vw - 144px) / 3)",
      fetchPriority: "low",
    }));
  }

  return preloads;
};

export const getDynamicImagePreloads = (
  key: string,
  projectSummaries: ProjectSummaryRow[] | null,
  homeContentBundle: HomeContentBundleRow | null,
  projectDetail: ProjectDetailRow | null,
  route: { isHomePage: boolean; projectDetailSlug: string | null; topLevelPublicPageKey: string | null },
) => {
  if (getFurnitureListingRoute(key)) {
    // The current listing hero is discovered only after its route chunk loads.
    // Match SchemeARouteHero's candidates and cover sizes to reuse one request.
    const hero = "/images/heroes/v20261007/furniture-showcase-wide.webp";
    return [{
      ...buildImagePreload(hero, [560, 720, 960, 1200, 1600], {
        height: 720,
        sizes: resolveLocalCoverSizes(hero, "(min-width: 1536px) 1440px, (min-width: 1024px) 94vw, 100vw", { width: 3, height: 1 }),
      }),
      fetchPriority: "high" as const,
    }];
  }

  if (route.isHomePage) {
    const heroImageUrl = getHomeHeroImageUrl(homeContentBundle, key);
    if (normalizePreloadImageUrl(heroImageUrl).split(/[?#]/, 1)[0].endsWith("/hero-luxury-living.webp")) {
      return [...HOME_ATELIER_HERO_PRELOADS, ...getHomeProjectImagePreloads(homeContentBundle)];
    }

    return [
      buildImagePreload(heroImageUrl, HOME_HERO_IMAGE_WIDTHS, {
        height: 1100,
        sizes: HOME_HERO_IMAGE_SIZES,
      }),
      ...getHomeProjectImagePreloads(homeContentBundle),
    ];
  }

  if (route.projectDetailSlug) {
    return getProjectDetailImagePreloads(projectDetail, projectSummaries);
  }

  if (route.topLevelPublicPageKey === "projects") {
    return buildProjectImagePreloads(projectSummaries, 12, {
      height: 500,
      sizes: "(max-width: 768px) 92vw, 45vw",
    });
  }

  return [];
};
