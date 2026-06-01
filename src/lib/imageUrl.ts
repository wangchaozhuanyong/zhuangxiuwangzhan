import { isSupabasePublicObjectUrl, toSupabaseRenderImageUrl } from "@/lib/supabaseImage";

const STATIC_SITE_HOSTS = new Set(["flashcast.com.my", "www.flashcast.com.my"]);
const STATIC_IMAGE_PATH_PATTERN = /^\/(?:images|videos)\//i;
const ROOT_STATIC_IMAGE_PATTERN = /^\/(?:logo-flashcast|og-image)\.(?:webp|png|jpe?g)$/i;

export function toLocalStaticImageSrc(src: string): string {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (src.startsWith("/") && !src.startsWith("//")) return src;

  try {
    const url = new URL(src);
    const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
    const isKnownSiteHost = STATIC_SITE_HOSTS.has(url.hostname) || url.hostname === currentHost;
    const isKnownStaticPath = STATIC_IMAGE_PATH_PATTERN.test(url.pathname) || ROOT_STATIC_IMAGE_PATTERN.test(url.pathname);

    if (isKnownSiteHost && isKnownStaticPath) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return src;
  }

  return src;
}

/** Prefer .webp for local/static image URLs when the path uses jpg/jpeg/png. */
export function preferWebpSrc(src: string): string {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (/\.webp(\?|#|$)/i.test(src)) return src;
  if (ROOT_STATIC_IMAGE_PATTERN.test(src)) return src;
  return src.replace(/\.(jpe?g|png)(\?[^#]*)?($|#)/i, ".webp$2$3");
}

export function isLocalImageSrc(src: string): boolean {
  if (!src) return false;
  const normalized = toLocalStaticImageSrc(src);
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return true;
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;
  return false;
}

/** Optimize inline CMS image URLs: local paths → WebP, Supabase → render endpoint with WebP. */
export function optimizeContentImageSrc(src: string): string {
  if (!src?.trim()) return src;
  if (isSupabasePublicObjectUrl(src)) {
    return toSupabaseRenderImageUrl(src, { width: 1200, quality: 80, resize: "contain", format: "webp" });
  }
  const normalized = toLocalStaticImageSrc(src);
  if (isLocalImageSrc(normalized)) return preferWebpSrc(normalized);
  return normalized;
}
