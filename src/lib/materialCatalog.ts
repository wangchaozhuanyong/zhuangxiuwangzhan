import { materialsData } from "@/data/materials";
import type { MaterialCategory, MaterialItem, MaterialSubcategory } from "@/data/types";

export type MaterialCatalogItem = MaterialItem & {
  alt?: string | null;
  pros?: string[];
  cons?: string[];
};

export type MaterialCatalogSubcategory = MaterialSubcategory & {
  alt?: string | null;
};

export type MaterialCatalogCategory = Omit<MaterialCategory, "items" | "subcategories"> & {
  alt?: string | null;
  items: MaterialCatalogItem[];
  subcategories: MaterialCatalogSubcategory[];
};

const fallbackMaterials = materialsData as MaterialCatalogCategory[];

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

  return Array.from(merged.values());
};
