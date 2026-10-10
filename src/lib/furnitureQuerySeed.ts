import type { QueryKey } from "@tanstack/react-query";
import { readPublicContentQueryKey } from "./publicContentQueryKeys";
import { readPreloadedPublicData } from "./publicPreload";
import { registerPublicQuerySeedResolver } from "./publicQuerySeedCache";
import { mapFurnitureCatalogSeed, type FurnitureMaterialRow } from "./furnitureCatalogPresentation";

/** Furniture routes load this mapper before their first synchronous seed claim.
 * Ordinary routes and the compact home cards never import the full catalog. */
export function getFurnitureQuerySeed(key: QueryKey): unknown {
  const parameters = readPublicContentQueryKey(key);
  if (parameters?.resource !== "furniture_catalog") return undefined;
  const bundle = readPreloadedPublicData()?.furnitureCatalog;
  if (!bundle) return undefined;
  // A listing projection cannot establish a complete detail, or vice versa.
  if (parameters.slug !== undefined && bundle.detailSlug !== parameters.slug) return undefined;
  if (parameters.slug === undefined && bundle.detailSlug) return undefined;
  const language = parameters.language === "zh" ? "zh" : "en";
  const products = mapFurnitureCatalogSeed(bundle.materials as FurnitureMaterialRow[], bundle.setting, language);
  return parameters.slug !== undefined
    ? products.find((product) => product.slug === parameters.slug) || null
    : products;
}

registerPublicQuerySeedResolver(getFurnitureQuerySeed, "furniture_catalog");
