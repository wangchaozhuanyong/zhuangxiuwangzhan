import catalogJson from "@/data/furnitureCatalog.json";
import catalogZhJson from "@/data/furnitureCatalogZh.json";
import catalogEnJson from "@/data/furnitureCatalogEn.json";
import { fetchPublishedMaterialBySlugAndCategory, fetchPublishedMaterialRowsByCategory } from "@/backend/modules/cms/repository/publicContentRepository";
import type { Language } from "@/i18n/routes";
import type { Database } from "@/lib/database.types";
import { FURNITURE_MATERIAL_CATEGORY } from "@/lib/furnitureCatalogConfig";
import { formatMaterialPrice } from "@/lib/materialPrice";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type FurnitureMaterialRow = MaterialRow & { material_images?: { image_url: string; sort_order: number }[] };

export type FurnitureSubcategory = {
  key: string;
  name: string;
  url: string;
  productUrls: string[];
};

export type FurnitureCategory = {
  key: string;
  name: string;
  url: string;
  productUrls: string[];
  subcategories: FurnitureSubcategory[];
};

export type FurnitureProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  sku: string;
  sourceUrl: string;
  sourceImages: string[];
  images: string[];
  sourceCategories: { name: string; url: string }[];
  price: string | null;
  seoTitle?: string;
  seoDescription?: string;
  managedCategoryKey?: string;
  managedSubcategoryKey?: string;
};

export type FurnitureCatalog = {
  source: string;
  capturedAt: string;
  pricesCapturedAt?: string;
  taxonomy: FurnitureCategory[];
  products: FurnitureProduct[];
};

export const furnitureCatalog = catalogJson as FurnitureCatalog;
const localizedProducts = catalogZhJson as Record<string, Pick<FurnitureProduct, "name" | "shortDescription" | "description">>;
const localizedEnglishProducts = catalogEnJson as Record<string, Pick<FurnitureProduct, "name" | "shortDescription" | "description">>;
export { furnitureShopUrl } from "@/lib/furnitureCatalogConfig";

export const localizeFurnitureProduct = (product: FurnitureProduct, language: Language): FurnitureProduct =>
  language === "zh"
    ? { ...product, ...localizedProducts[product.slug] }
    : { ...product, ...localizedEnglishProducts[product.slug] };

const productsByUrl = new Map(furnitureCatalog.products.map((product) => [product.sourceUrl, product]));
const productsBySlug = new Map(furnitureCatalog.products.map((product) => [decodeURIComponent(product.slug), product]));

export const getFurnitureCategory = (key?: string) =>
  furnitureCatalog.taxonomy.find((category) => category.key === key);

export const getFurnitureSubcategory = (category: FurnitureCategory, key?: string) =>
  category.subcategories.find((subcategory) => subcategory.key === key);

export const getFurnitureProducts = (urls: string[]) =>
  urls.map((url) => productsByUrl.get(url)).filter((product): product is FurnitureProduct => Boolean(product));

export const getFurnitureProduct = (slug?: string) => {
  if (!slug) return undefined;
  try {
    return productsBySlug.get(decodeURIComponent(slug));
  } catch {
    return undefined;
  }
};

const mapManagedFurnitureProduct = (row: FurnitureMaterialRow, language: Language): FurnitureProduct => {
  const gallery = [...(row.material_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const images = Array.from(new Set([row.image_url, ...gallery.map((image) => image.image_url)].filter((url): url is string => Boolean(url))));
  const localized = (field: "title" | "excerpt" | "content") =>
    row[`${field}_${language}`] || row[`${field}_${language === "zh" ? "en" : "zh"}`] || "";

  return {
    slug: row.slug,
    name: localized("title") || row.slug,
    shortDescription: localized("excerpt"),
    description: localized("content"),
    sku: "",
    sourceUrl: `admin-material:${row.id}`,
    sourceImages: [],
    images,
    sourceCategories: [],
    price: formatMaterialPrice({
      mode: row.price_mode,
      min: row.price_min,
      max: row.price_max,
      currency: row.price_currency,
      unit: row.price_unit,
      legacyText: row.reference_price,
    }, language) || null,
    seoTitle: row[`seo_title_${language}`] || "",
    seoDescription: row[`seo_description_${language}`] || "",
    managedCategoryKey: row.subcategory || "",
    managedSubcategoryKey: row.material_type || "",
  };
};

export async function getPublishedManagedFurnitureProducts(language: Language, signal?: AbortSignal): Promise<FurnitureProduct[]> {
  const rows = await fetchPublishedMaterialRowsByCategory(FURNITURE_MATERIAL_CATEGORY, signal);
  return (rows || [])
    .filter((row) => !productsBySlug.has(row.slug))
    .map((row) => mapManagedFurnitureProduct(row, language));
}

export async function getPublishedManagedFurnitureProductBySlug(slug: string, language: Language, signal?: AbortSignal): Promise<FurnitureProduct | null> {
  if (productsBySlug.has(slug)) return null;
  const row = await fetchPublishedMaterialBySlugAndCategory(slug, FURNITURE_MATERIAL_CATEGORY, signal);
  return row ? mapManagedFurnitureProduct(row, language) : null;
}

export const getManagedFurnitureProductsForCategory = (products: FurnitureProduct[], categoryKey: string, subcategoryKey?: string) =>
  products.filter((product) =>
    (categoryKey === "new" || product.managedCategoryKey === categoryKey)
    && (!subcategoryKey || product.managedSubcategoryKey === subcategoryKey),
  );

export const furnitureProductPath = (product: FurnitureProduct) =>
  `/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}`;

export const getFurnitureProductCategory = (product: FurnitureProduct) =>
  furnitureCatalog.taxonomy.find((category) => category.key === product.managedCategoryKey)
  || furnitureCatalog.taxonomy.find((category) => category.key !== "new" && category.key !== "preorder" && category.productUrls.includes(product.sourceUrl))
  || furnitureCatalog.taxonomy.find((category) => category.subcategories.some((subcategory) => subcategory.productUrls.includes(product.sourceUrl)))
  || furnitureCatalog.taxonomy.find((category) => category.key === "preorder" && category.productUrls.includes(product.sourceUrl))
  || furnitureCatalog.taxonomy[0];
