import { isSupabasePublicObjectUrl, toSupabaseRenderImageUrl } from "@/lib/supabaseImage";

/** Prefer .webp for local/static image URLs when the path uses jpg/jpeg/png. */
export function preferWebpSrc(src: string): string {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (/\.webp(\?|#|$)/i.test(src)) return src;
  return src.replace(/\.(jpe?g|png)(\?[^#]*)?($|#)/i, ".webp$2$3");
}

export function isLocalImageSrc(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;
  try {
    const url = new URL(src, "https://example.com");
    return url.pathname.startsWith("/") && !url.hostname.includes("supabase");
  } catch {
    return false;
  }
}

/** Optimize inline CMS image URLs: local paths → WebP, Supabase → render endpoint with WebP. */
export function optimizeContentImageSrc(src: string): string {
  if (!src?.trim()) return src;
  if (isSupabasePublicObjectUrl(src)) {
    return toSupabaseRenderImageUrl(src, { width: 1200, quality: 80, resize: "contain", format: "webp" });
  }
  if (isLocalImageSrc(src)) return preferWebpSrc(src);
  return src;
}
