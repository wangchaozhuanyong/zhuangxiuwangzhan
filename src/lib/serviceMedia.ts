import { resolveReviewedImageSource } from "@/lib/reviewedContentMedia.mjs";

export const isServiceConceptImage = (imageAlt: string): boolean =>
  /\bconcept\b|概念|效果图|示意/i.test(imageAlt);

// Only checked-in assets with a recorded AI source use this label.
export const isAiServiceConceptImage = (imageUrl: string): boolean =>
  /\/images\/services\/(?:(?:ai-concepts|content-20260930)\/[^?#]+|digital-lock)\.webp(?:[?#]|$)/i.test(resolveReviewedImageSource(imageUrl));
