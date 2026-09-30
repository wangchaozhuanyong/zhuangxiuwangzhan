import { resolveReviewedImageSource } from "@/lib/reviewedContentMedia.mjs";

export const isServiceConceptImage = (imageAlt: string): boolean =>
  /\bconcept\b|概念|效果图|示意/i.test(imageAlt);

// Only assets delivered into this source-controlled category are known AI concepts.
export const isAiServiceConceptImage = (imageUrl: string): boolean =>
  /\/images\/services\/(?:ai-concepts|content-20260930)\/[^?#]+\.webp(?:[?#]|$)/i.test(resolveReviewedImageSource(imageUrl));
