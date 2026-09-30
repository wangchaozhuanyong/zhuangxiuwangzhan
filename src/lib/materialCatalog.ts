import { resolveReviewedMaterialImage } from "@/lib/reviewedContentMedia.mjs";
import { materialsData } from "@/data/materials";
import type { MaterialCategory, MaterialItem, MaterialSubcategory } from "@/data/types";

export type MaterialCatalogItem = MaterialItem & {
  alt?: string | null;
  excerpt?: string;
  pros?: string[];
  cons?: string[];
  referencePrice?: string;
  priceScope?: string;
  priceNote?: string;
  seoTitle?: string;
  seoDescription?: string;
  gallery?: MaterialCatalogImage[];
};

export type MaterialCatalogImage = {
  id: string;
  image: string;
  type: "cover" | "scene" | "detail" | "installation" | "specification";
  alt: string;
  sortOrder: number;
};

export type MaterialCatalogSubcategory = MaterialSubcategory & {
  alt?: string | null;
};

export type MaterialCatalogCategory = Omit<MaterialCategory, "items" | "subcategories"> & {
  alt?: string | null;
  items: MaterialCatalogItem[];
  subcategories: MaterialCatalogSubcategory[];
};

export const reviewMaterialImages = (categories: MaterialCatalogCategory[]): MaterialCatalogCategory[] => categories.map((category) => ({
  ...category,
  image: resolveReviewedMaterialImage(category.image, category.slug),
  subcategories: category.subcategories.map((subcategory) => ({ ...subcategory, image: resolveReviewedMaterialImage(subcategory.image, subcategory.slug) })),
  items: category.items.map((item) => ({
    ...item,
    image: resolveReviewedMaterialImage(item.image, item.slug),
    gallery: item.gallery?.map((image) => ({ ...image, image: resolveReviewedMaterialImage(image.image, item.slug) })).filter((image) => image.image),
  })),
}));
const fallbackMaterials = reviewMaterialImages(materialsData as MaterialCatalogCategory[]);

const mergeBySlug = <T extends { slug: string }>(fallbackItems: T[] = [], publishedItems: T[] = []) => {
  const merged = new Map<string, T>();

  for (const item of fallbackItems) merged.set(item.slug, item);
  for (const item of publishedItems) merged.set(item.slug, { ...(merged.get(item.slug) || {}), ...item });

  return Array.from(merged.values());
};

export const mergeMaterialCategoriesWithFallback = (
  publishedCategories: MaterialCatalogCategory[] | null | undefined,
): MaterialCatalogCategory[] => {
  if (!publishedCategories?.length) return fallbackMaterials;

  const merged = new Map<string, MaterialCatalogCategory>();

  for (const category of fallbackMaterials) merged.set(category.slug, category);

  for (const publishedCategory of publishedCategories) {
    const fallbackCategory = merged.get(publishedCategory.slug);
    merged.set(publishedCategory.slug, {
      ...(fallbackCategory || {}),
      ...publishedCategory,
      subcategories: mergeBySlug(fallbackCategory?.subcategories || [], publishedCategory.subcategories || []),
      items: mergeBySlug(fallbackCategory?.items || [], publishedCategory.items || []),
    });
  }

  return reviewMaterialImages(Array.from(merged.values()));
};
