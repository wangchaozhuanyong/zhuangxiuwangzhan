import type { Language } from "../i18n/routes";
import {
  getFurnitureProductCategory,
  localizeFurnitureProduct,
  mapFurnitureCatalogSeed,
  type FurnitureMaterialRow,
  type FurnitureProduct,
} from "./furnitureCatalogPresentation";

export type HomeFurnitureCard = {
  slug: string;
  name: string;
  image: string;
  categoryKey: string;
};

export type HomeFurnitureSeed = Record<Language, HomeFurnitureCard[]>;

const preferredProductSlugs = [
  "lc-40108-1-seater-pu-lounge-chair-cream",
  "danu-6-seater-sintered-stone-dining-set-cream",
  "a05-smart-charging-bedside-table-white",
  "std-2501-compact-study-desk",
];

/** Select from the already-published catalog, never restore hidden static rows. */
export function selectHomeFurniture(products: FurnitureProduct[], language: Language): HomeFurnitureCard[] {
  const availableProducts = products
    .map((product) => localizeFurnitureProduct(product, language))
    .filter((product) => Boolean(product.images[0] || product.sourceImages[0]));
  const preferredProducts = preferredProductSlugs.flatMap((slug) => {
    const product = availableProducts.find((item) => item.slug === slug);
    return product ? [product] : [];
  });
  const seen = new Set<string>();
  return [...preferredProducts, ...availableProducts]
    .filter((product) => {
      if (seen.has(product.slug)) return false;
      seen.add(product.slug);
      return true;
    })
    .slice(0, 4)
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      image: product.images[0] || product.sourceImages[0] || "",
      categoryKey: getFurnitureProductCategory(product)?.key || "",
    }));
}

/** Edge-only projection. Browsers consume its compact result, not this module. */
export function mapHomeFurnitureSeed(
  materials: FurnitureMaterialRow[],
  setting: { items_zh?: unknown } | null,
): HomeFurnitureSeed {
  return {
    en: selectHomeFurniture(mapFurnitureCatalogSeed(materials, setting, "en"), "en"),
    zh: selectHomeFurniture(mapFurnitureCatalogSeed(materials, setting, "zh"), "zh"),
  };
}
