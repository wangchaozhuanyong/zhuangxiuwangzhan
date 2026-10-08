import catalogJson from "../data/furnitureCatalog.json";
import catalogZhJson from "../data/furnitureCatalogZh.json";
import catalogEnJson from "../data/furnitureCatalogEn.json";
import { applyFurnitureCatalogOverrides, readFurnitureCatalogOverrides } from "./furnitureCatalogOverrides";
import type { Language } from "../i18n/routes";
import type { Database } from "./database.types";
import { formatMaterialPrice } from "./materialPrice";
import { resolveFurnitureDisplay } from "./furnitureDisplaySafety.mjs";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
export type FurnitureMaterialRow = MaterialRow & { material_images?: { image_url: string; sort_order: number }[] };

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
  skuLabel?: string;
  availabilityNote?: string;
  seoTitle?: string;
  seoDescription?: string;
  managedCategoryKey?: string;
  managedSubcategoryKey?: string;
  localized?: boolean;
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
export { furnitureShopUrl } from "./furnitureCatalogConfig";

export const localizeFurnitureProduct = (product: FurnitureProduct, language: Language): FurnitureProduct =>
  product.localized ? product : resolveFurnitureDisplay(language === "zh"
    ? { ...product, ...localizedProducts[product.slug] }
    : { ...product, ...localizedEnglishProducts[product.slug] }, language);

const productsByUrl = new Map(furnitureCatalog.products.map((product) => [product.sourceUrl, product]));
const productsBySlug = new Map(furnitureCatalog.products.map((product) => [decodeURIComponent(product.slug), product]));

/** Preserve the exact baseline-slug lookup used by managed catalog readers. */
export const hasBaselineFurnitureSlug = (slug: string) => productsBySlug.has(slug);

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

export const mapManagedFurnitureProduct = (row: FurnitureMaterialRow, language: Language): FurnitureProduct => {
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
    localized: true,
  };
};

export const getManagedFurnitureProductsForCategory = (products: FurnitureProduct[], categoryKey: string, subcategoryKey?: string) =>
  products.filter((product) =>
    (categoryKey === "new" || product.managedCategoryKey === categoryKey)
    && (!subcategoryKey || product.managedSubcategoryKey === subcategoryKey),
  );

export const mapFurnitureCatalogSeed = (rows: FurnitureMaterialRow[], setting: { items_zh?: unknown } | null, language: Language) => [
  ...rows.filter((row) => !productsBySlug.has(row.slug)).map((row) => mapManagedFurnitureProduct(row, language)),
  ...applyFurnitureCatalogOverrides(furnitureCatalog.products.map((product) => localizeFurnitureProduct(product, language)), readFurnitureCatalogOverrides(setting?.items_zh), language),
];

export const getFurnitureCatalogProductsForCategory = (products: FurnitureProduct[], categoryKey: string, subcategoryKey?: string) => {
  const category = getFurnitureCategory(categoryKey);
  if (!category) return [];
  const urls = new Set(subcategoryKey ? getFurnitureSubcategory(category, subcategoryKey)?.productUrls || [] : category.productUrls);
  return products.filter((product) => product.managedCategoryKey
    ? getManagedFurnitureProductsForCategory([product], categoryKey, subcategoryKey).length > 0
    : urls.has(product.sourceUrl));
};

export const FURNITURE_LISTING_PAGE_SIZE = 18;

export const normalizeFurnitureListingPage = (value: string | null | undefined, totalPages?: number) => {
  const requested = Number(value || 1);
  const page = Number.isSafeInteger(requested) ? Math.max(1, requested) : 1;
  return totalPages === undefined ? page : Math.min(Math.max(1, totalPages), page);
};

export const furnitureListingPagePath = (path: string, page: number) =>
  `${path}${page > 1 ? `?page=${page}` : ""}`;

export const getFurnitureListingRoute = (pathname: string) => {
  const match = pathname.replace(/\/+$/, "").match(/^\/(en|zh)\/furniture(?:\/([^/]+)(?:\/([^/]+))?)?$/);
  if (!match || match[2] === "product") return null;
  const categoryKey = match[2] || "new";
  const category = getFurnitureCategory(categoryKey);
  if (!category || (match[3] && !getFurnitureSubcategory(category, match[3]))) return null;
  return { language: match[1] as Language, categoryKey, subcategoryKey: match[3] };
};

// Shared by the React listing and its Edge HTML projection, after published overrides.
export const getFurnitureListingPage = (
  catalogProducts: FurnitureProduct[],
  categoryKey: string | undefined,
  subcategoryKey: string | undefined,
  requestedPage: string | null,
) => {
  const category = getFurnitureCategory(categoryKey || "new");
  const subcategory = category && subcategoryKey ? getFurnitureSubcategory(category, subcategoryKey) : undefined;
  const validSelection = Boolean(category && (!subcategoryKey || subcategory));
  const products = validSelection ? getFurnitureCatalogProductsForCategory(catalogProducts, category!.key, subcategory?.key) : [];
  const totalPages = Math.max(1, Math.ceil(products.length / FURNITURE_LISTING_PAGE_SIZE));
  const page = normalizeFurnitureListingPage(requestedPage, totalPages);
  const currentPath = subcategory ? `/furniture/${category!.key}/${subcategory.key}`
    : category && category.key !== "new" ? `/furniture/${category.key}` : "/furniture";
  return {
    category, subcategory, validSelection, products, totalPages, page, currentPath,
    visibleProducts: products.slice((page - 1) * FURNITURE_LISTING_PAGE_SIZE, page * FURNITURE_LISTING_PAGE_SIZE),
    canonicalPath: furnitureListingPagePath(currentPath, page),
  };
};

export const furnitureProductPath = (product: FurnitureProduct) =>
  `/furniture/product/${encodeURIComponent(decodeURIComponent(product.slug))}`;

export const getFurnitureProductCategory = (product: FurnitureProduct) =>
  furnitureCatalog.taxonomy.find((category) => category.key === product.managedCategoryKey)
  || furnitureCatalog.taxonomy.find((category) => category.key !== "new" && category.key !== "preorder" && category.productUrls.includes(product.sourceUrl))
  || furnitureCatalog.taxonomy.find((category) => category.subcategories.some((subcategory) => subcategory.productUrls.includes(product.sourceUrl)))
  || furnitureCatalog.taxonomy.find((category) => category.key === "preorder" && category.productUrls.includes(product.sourceUrl))
  || furnitureCatalog.taxonomy[0];
