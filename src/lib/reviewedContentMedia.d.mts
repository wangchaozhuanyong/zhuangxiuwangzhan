export const wardrobeCover: string;
export function localMediaPath(source: string): string;
export function resolveReviewedBlogCover(slug: string, source: string): string;
export function resolveReviewedMaterialImage(source: string, context?: string): string;
export function isReviewedMaterialConceptImage(source: string): boolean;
export function reviewedComparisonRoom(before: string, after: string): "kitchen" | "living" | "bathroom" | undefined;
export const reviewedImageReplacements: ReadonlyMap<string, string>;
export function resolveReviewedImageSource(source: string): string;
