import catalogJson from "@/data/furnitureCatalog.json";
import catalogZhJson from "@/data/furnitureCatalogZh.json";
import catalogEnJson from "@/data/furnitureCatalogEn.json";
import type { Language } from "@/i18n/routes";

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
export const furnitureShopUrl = "https://shop.flashcast.com.my/";

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

export const furnitureProductPath = (product: FurnitureProduct) =>
  `/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}`;

export const getFurnitureProductCategory = (product: FurnitureProduct) =>
  furnitureCatalog.taxonomy.find((category) => category.key !== "new" && category.key !== "preorder" && category.productUrls.includes(product.sourceUrl))
  || furnitureCatalog.taxonomy.find((category) => category.subcategories.some((subcategory) => subcategory.productUrls.includes(product.sourceUrl)))
  || furnitureCatalog.taxonomy.find((category) => category.key === "preorder" && category.productUrls.includes(product.sourceUrl))
  || furnitureCatalog.taxonomy[0];
