// Successful browser decodes belong to the current document only. Keep the
// actual selected URL (including transforms and retry parameters), not a page
// or source-list identity that could stand in for a different bitmap.
const MAX_DECODED_PUBLIC_IMAGES = 512;
const decodedSources = new Map<string, true>();

export function rememberDecodedPublicImage(src: string) {
  if (!src) return;
  decodedSources.delete(src);
  decodedSources.set(src, true);
  if (decodedSources.size > MAX_DECODED_PUBLIC_IMAGES) {
    const oldest = decodedSources.keys().next().value;
    if (oldest !== undefined) decodedSources.delete(oldest);
  }
}

export function forgetDecodedPublicImage(src: string) {
  decodedSources.delete(src);
}

export function getPublicImageSelectedSource(image: HTMLImageElement) {
  // A responsive source without currentSrc has not selected a known candidate.
  // Do not treat its fallback src as proof that the selected bitmap is ready.
  const responsive = Boolean(image.srcset || image.closest("picture")?.querySelector("source[srcset]"));
  if (!image.currentSrc && responsive) return "";
  // While a plain img switches src, currentSrc can still describe its old
  // request. It cannot prove that the new src has selected that old bitmap.
  if (!responsive && image.currentSrc && image.currentSrc !== image.src) return "";
  return image.currentSrc || image.src;
}

export function hasDecodedPublicImage(image: HTMLImageElement) {
  if (!image.complete || image.naturalWidth <= 0) return false;
  const selected = getPublicImageSelectedSource(image);
  if (!selected || !decodedSources.has(selected)) return false;
  rememberDecodedPublicImage(selected);
  return true;
}
