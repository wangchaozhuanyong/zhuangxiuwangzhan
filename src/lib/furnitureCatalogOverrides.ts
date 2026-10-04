import type { FurnitureProduct } from "@/lib/furnitureCatalog";
import type { Language } from "@/i18n/routes";
import { toRecord } from "./recordUtils";

export const FURNITURE_CATALOG_SECTION_KEY = "furniture_catalog";
export type FurnitureCatalogOverride = {
  slug: string; enabled: boolean;
  name_zh: string; name_en: string;
  shortDescription_zh: string; shortDescription_en: string;
  description_zh: string; description_en: string;
  price: string; images: string[];
};

export const readFurnitureCatalogOverrides = (items: unknown): FurnitureCatalogOverride[] =>
  (Array.isArray(items) ? items : []).flatMap((value) => {
    const item = toRecord(value);
    const fields = ["slug", "name_zh", "name_en", "shortDescription_zh", "shortDescription_en", "description_zh", "description_en", "price"] as const;
    if (!fields.every((key) => typeof item[key] === "string") || typeof item.enabled !== "boolean"
      || !Array.isArray(item.images) || !item.images.every((url) => typeof url === "string")) return [];
    return [item as FurnitureCatalogOverride];
  });

export const applyFurnitureCatalogOverrides = (products: FurnitureProduct[], overrides: FurnitureCatalogOverride[], language: Language) => {
  const bySlug = new Map(overrides.map((item) => [item.slug, item]));
  return products.flatMap((product) => {
    const saved = bySlug.get(product.slug);
    if (!saved) return [product];
    if (!saved.enabled) return [];
    return [{ ...product, name: saved[`name_${language}`], shortDescription: saved[`shortDescription_${language}`],
      description: saved[`description_${language}`], price: saved.price || null, images: saved.images,
      localized: true,
    }];
  });
};
