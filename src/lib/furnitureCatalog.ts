import { fetchPublishedHomeSectionRow, fetchPublishedMaterialBySlugAndCategory, fetchPublishedMaterialRowsByCategory } from "@/backend/modules/cms/repository/publicContentRepository";
import { applyFurnitureCatalogOverrides, FURNITURE_CATALOG_SECTION_KEY, readFurnitureCatalogOverrides } from "./furnitureCatalogOverrides";
import type { Language } from "../i18n/routes";
import { FURNITURE_MATERIAL_CATEGORY } from "./furnitureCatalogConfig";
import { furnitureCatalog, getFurnitureProduct, hasBaselineFurnitureSlug, localizeFurnitureProduct, mapManagedFurnitureProduct, type FurnitureProduct } from "./furnitureCatalogPresentation";
import { selectHomeFurniture, type HomeFurnitureCard } from "./homeFurniture";

export {
  furnitureCatalog,
  furnitureShopUrl,
  localizeFurnitureProduct,
  getFurnitureCategory,
  getFurnitureSubcategory,
  getFurnitureProducts,
  getFurnitureProduct,
  mapManagedFurnitureProduct,
  getManagedFurnitureProductsForCategory,
  mapFurnitureCatalogSeed,
  getFurnitureCatalogProductsForCategory,
  furnitureProductPath,
  getFurnitureProductCategory,
} from "./furnitureCatalogPresentation";
export type { FurnitureMaterialRow, FurnitureSubcategory, FurnitureCategory, FurnitureProduct, FurnitureCatalog } from "./furnitureCatalogPresentation";

export async function getPublishedManagedFurnitureProducts(language: Language, signal?: AbortSignal): Promise<FurnitureProduct[]> {
  const rows = await fetchPublishedMaterialRowsByCategory(FURNITURE_MATERIAL_CATEGORY, signal);
  return (rows || [])
    .filter((row) => !hasBaselineFurnitureSlug(row.slug))
    .map((row) => mapManagedFurnitureProduct(row, language));
}

export async function getPublishedManagedFurnitureProductBySlug(slug: string, language: Language, signal?: AbortSignal): Promise<FurnitureProduct | null> {
  if (hasBaselineFurnitureSlug(slug)) return null;
  const row = await fetchPublishedMaterialBySlugAndCategory(slug, FURNITURE_MATERIAL_CATEGORY, signal);
  return row ? mapManagedFurnitureProduct(row, language) : null;
}

export async function getPublishedFurnitureCatalog(language: Language, signal?: AbortSignal): Promise<FurnitureProduct[]> {
  const [managed, setting] = await Promise.all([
    getPublishedManagedFurnitureProducts(language, signal),
    fetchPublishedHomeSectionRow(FURNITURE_CATALOG_SECTION_KEY, signal),
  ]);
  return [...managed, ...applyFurnitureCatalogOverrides(
    furnitureCatalog.products.map((product) => localizeFurnitureProduct(product, language)),
    readFurnitureCatalogOverrides(setting?.items_zh), language,
  )];
}

export async function getPublishedFurnitureProductBySlug(slug: string, language: Language, signal?: AbortSignal): Promise<FurnitureProduct | null> {
  const baseline = getFurnitureProduct(slug);
  if (!baseline) return getPublishedManagedFurnitureProductBySlug(slug, language, signal);
  const setting = await fetchPublishedHomeSectionRow(FURNITURE_CATALOG_SECTION_KEY, signal);
  return applyFurnitureCatalogOverrides([localizeFurnitureProduct(baseline, language)], readFurnitureCatalogOverrides(setting?.items_zh), language)[0] || null;
}

export async function getPublishedHomeFurniture(language: Language, signal?: AbortSignal): Promise<HomeFurnitureCard[]> {
  return selectHomeFurniture(await getPublishedFurnitureCatalog(language, signal), language);
}
