// Bounded corrections for the legacy assets reviewed in September 2026.
// New CMS uploads are kept; a matching slug alone never replaces an editor's image.
export const wardrobeCover = "/images/services/content-20260930/wardrobe.webp";

const legacyWardrobeCovers = new Set([
  "/images/services/kitchen-renovation.webp",
  "/images/services/v20260930/kitchen-renovation.webp",
]);

export function localMediaPath(source) {
  if (!source) return "";
  if (source.startsWith("/images/")) return source.split(/[?#]/)[0];
  try {
    const url = new URL(source);
    if (["flashcast.com.my", "www.flashcast.com.my"].includes(url.hostname)) return url.pathname;
    if (url.hostname.endsWith(".supabase.co")) {
      const match = url.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/site-images\/(.+)$/);
      if (match) return `/images/${match[1]}`;
    }
  } catch { /* Unknown sources remain untouched. */ }
  return source;
}

export const reviewedImageReplacements = new Map([
  ["/images/services/kitchen-renovation.webp", "/images/services/content-20260930/kitchen.webp"],
  ["/images/services/v20260930/kitchen-renovation.webp", "/images/services/content-20260930/kitchen.webp"],
  ["/images/services/shoplot-renovation.webp", "/images/services/content-20260930/retail.webp"],
  ["/images/services/artistic-coating.webp", "/images/services/content-20260930/coating.webp"],
  ["/images/materials/category-kitchen-cabinets.webp", "/images/materials/content-20261001/melamine-cabinet.webp"],
  ["/images/materials/kitchen-melamine-cabinets.webp", "/images/materials/content-20261001/melamine-cabinet.webp"],
  ["/images/materials/category-flooring.webp", "/images/materials/content-20261001/natural-oak-floor.webp"],
  ["/images/materials/spc-vinyl-natural-oak.webp", "/images/materials/content-20261001/natural-oak-floor.webp"],
]);
for (const room of ["kitchen", "living", "bathroom"]) {
  for (const state of ["before", "after"]) {
    const target = `/images/before-after/old-terrace-concept-v2/${room}-${state}.webp`;
    reviewedImageReplacements.set(`/images/before-after/${state}-${room}.webp`, target);
    reviewedImageReplacements.set(`/images/before-after/v20260824/${state}-${room}.webp`, target);
  }
}
export function resolveReviewedImageSource(source) {
  return reviewedImageReplacements.get(localMediaPath(source)) || source;
}

export function resolveReviewedBlogCover(slug, source) {
  return slug === "custom-wardrobe-price-malaysia" && legacyWardrobeCovers.has(localMediaPath(source))
    ? wardrobeCover : source;
}

const materialConceptImages = {
  floor: "/images/materials/content-20260930/grey-stone-floor.webp",
  counter: "/images/materials/content-20260930/grey-stone-counter.webp",
  cabinetry: "/images/materials/content-20261001/melamine-cabinet.webp",
  oakFloor: "/images/materials/content-20261001/natural-oak-floor.webp",
};

// The shared legacy bitmap is woodgrain. Use an approved palette study specific
// to the material context; preserve future CMS uploads and their real photography.
export function resolveReviewedMaterialImage(source, context = "") {
  if (localMediaPath(source) !== "/images/materials/laminate-grey-stone.webp") return resolveReviewedImageSource(source);
  if (["laminate-grey-stone", "laminate", "flooring"].includes(context)) return materialConceptImages.floor;
  if (["sintered-stone-grey", "sintered-stone", "countertops-stone-surfaces"].includes(context)) return materialConceptImages.counter;
  return "";
}

export function isReviewedMaterialConceptImage(source) {
  return Object.values(materialConceptImages).includes(localMediaPath(source));
}

export function reviewedComparisonRoom(before, after) {
  for (const room of ["kitchen", "living", "bathroom"]) {
    const paths = (state) => [
      `/images/before-after/${state}-${room}.webp`,
      `/images/before-after/v20260824/${state}-${room}.webp`,
    ];
    if (paths("before").includes(localMediaPath(before)) && paths("after").includes(localMediaPath(after))) return room;
  }
  return undefined;
}
