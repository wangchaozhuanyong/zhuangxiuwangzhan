import { getLanguageFromPath, stripLanguagePrefix } from "../i18n/routes";
import { pageHeroImages, resolvePageHeroImage } from "./pageHeroImages";
import { furnitureListingHeroImage, getRouteHeroImagePreloads, type RouteHeroImagePreload } from "./routeHeroImage";

type DirectoryHeroPage = "services" | "projects" | "materials";
const MAX_INTENT_IMAGE_LINKS = 12;

export function publicRouteHeroPageKey(pathname: string): DirectoryHeroPage | null {
  if (!getLanguageFromPath(pathname)) return null;
  const path = stripLanguagePrefix(pathname).replace(/\/$/, "");
  return path === "/services" ? "services" : path === "/projects" ? "projects" : path === "/materials" ? "materials" : null;
}

export function publicRouteHeroPreloads(pathname: string, page?: { image_url?: string | null } | null): RouteHeroImagePreload[] {
  if (!getLanguageFromPath(pathname)) return [];
  const segments = stripLanguagePrefix(pathname).split("/").filter(Boolean);
  if (segments[0] === "furniture" && segments.length <= 3 && segments[1] !== "product") {
    return getRouteHeroImagePreloads(furnitureListingHeroImage);
  }
  const pageKey = publicRouteHeroPageKey(pathname);
  if (!pageKey || page === undefined) return [];
  const image = resolvePageHeroImage(page?.image_url, pageHeroImages[pageKey]);
  return getRouteHeroImagePreloads({
    image: image.desktop, imageSourceWidth: image.desktopWidth,
    mobileImage: image.mobile, mobileImageSourceWidth: image.mobileWidth,
    tabletImage: image.tablet, tabletImageSourceWidth: image.tabletWidth,
  });
}

/** Preload transfers only; SmartImage still owns actual decode/readiness. */
export function prefetchPublicRouteHero(pathname: string, page?: { image_url?: string | null } | null) {
  if (typeof document === "undefined") return;
  for (const preload of publicRouteHeroPreloads(pathname, page)) {
    const href = new URL(preload.href, document.baseURI).href;
    const exists = [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')]
      .some(link => link.href === href && (link.getAttribute("imagesrcset") || "") === (preload.srcSet || "")
        && (link.getAttribute("imagesizes") || "") === (preload.sizes || "") && (link.media || "") === (preload.media || ""));
    if (exists) continue;
    const link = document.createElement("link");
    link.rel = "preload";
    link.setAttribute("as", "image");
    link.href = preload.href;
    if (preload.srcSet) link.setAttribute("imagesrcset", preload.srcSet);
    if (preload.sizes) link.setAttribute("imagesizes", preload.sizes);
    if (preload.media) link.media = preload.media;
    link.setAttribute("fetchpriority", "low");
    link.setAttribute("data-public-hero-prefetch", "");
    link.addEventListener("error", () => link.remove(), { once: true });
    document.head.append(link);
  }
  const speculative = [...document.head.querySelectorAll('link[data-public-hero-prefetch]')];
  speculative.slice(0, Math.max(0, speculative.length - MAX_INTENT_IMAGE_LINKS)).forEach(link => link.remove());
}
