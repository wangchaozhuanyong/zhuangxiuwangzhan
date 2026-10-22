import generatedImages from "@/data/furnitureListingImages.json";

const images: Record<string, { width: number; variants: Record<string, number> }> = generatedImages;
const sizes = "(max-width: 540px) 148px, (max-width: 760px) 50vw, (max-width: 1050px) 33vw, 25vw";

/** Only known, generated covers use variants; CMS replacements keep their original source. */
export function furnitureListingPictureSources(src: string) {
  const image = images[src];
  if (!image) return undefined;
  const candidates = new Map<number, string>();
  for (const [width, actualWidth] of Object.entries(image.variants)) {
    if (actualWidth >= image.width) continue;
    candidates.set(actualWidth, src.replace("/assets/", `/listing/w${width}/`));
  }
  candidates.set(image.width, src);
  return [{ srcSet: [...candidates].sort(([a], [b]) => a - b).map(([width, url]) => `${url} ${width}w`).join(", "), sizes }];
}
