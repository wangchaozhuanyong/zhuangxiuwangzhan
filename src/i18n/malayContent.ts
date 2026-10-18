import translations from "./malayFallbackText.json";

const stableField = /^(?:id|slug|path|href|url|src|icon|image|imageUrl|image_url|button_url|sourceUrl|sourceImages|images|productUrls|sku|key|type|project_type|categoryKey|managedCategoryKey|managedSubcategoryKey)$/;

/** Translate checked-in fallback copy without changing routes, assets, IDs or other locales. */
export function localizeMalayContent<T>(value: T, field = ""): T {
  if (stableField.test(field) || /(?:_zh|Zh)$/.test(field)) return value;
  if (typeof value === "string") return ((translations as Record<string, string>)[value] || value) as T;
  if (Array.isArray(value)) return value.map((item) => localizeMalayContent(item, field)) as T;
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, localizeMalayContent(child, key)]),
  ) as T;
  return value;
}
