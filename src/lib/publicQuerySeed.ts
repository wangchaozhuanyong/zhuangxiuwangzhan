import type { QueryKey } from "@tanstack/react-query";
import { readPublicContentQueryKey } from "@/lib/publicContentQueries";
import { registerPublicQuerySeedResolver } from "@/lib/publicQuerySeedCache";
import { readPreloadedPublicData } from "@/lib/publicPreload";
import { mapPublishedBlogPostRows, mapPublishedMaterialRows, mapPublishedProjectDetail, mapPublishedProjectSummary, mapPublishedService, mapPublishedServiceAreaSummary, needsProjectSummaryContentFallback } from "@/lib/contentApi";
import { mapPublishedCtaBlockRow, mapRemoteHomeContentBundle, mapSitePageRows } from "@/lib/homeContentApi";
import { fallbackSiteSettings } from "@/lib/siteSettingsApi";
import { createRemoteContent } from "@/lib/publicContentStatus";
import { FURNITURE_MATERIAL_CATEGORY } from "@/lib/furnitureCatalogConfig";
import type { UnknownRecord } from "@/lib/recordUtils";
import { mapFurnitureCatalogSeed, type FurnitureMaterialRow } from "@/lib/furnitureCatalog";

/** HTML is an initial cache seed only. Network readers never consult it. */
export function getPublicQuerySeed(key: QueryKey): unknown {
  if (key[0] !== "published" && key[0] !== "site-settings") return undefined;
  const payload = readPreloadedPublicData();
  if (!payload) return undefined;
  if (key[0] === "site-settings") return payload.siteSettings ? { ...fallbackSiteSettings, ...payload.siteSettings } : undefined;
  const parameters = readPublicContentQueryKey(key);
  if (!parameters) return undefined;
  const language = parameters.language === "zh" ? "zh" : "en";
  const limit = (rows: UnknownRecord[], value: unknown) => typeof value === "number" && value > 0 ? rows.slice(0, value) : rows;
  switch (parameters.resource) {
    case "home_furniture": return payload.homeFurniture?.[language];
    case "home_journal": return payload.homeJournalPosts ? mapPublishedBlogPostRows(payload.homeJournalPosts, language) : undefined;
    case "home_service_areas": return payload.homeServiceAreas?.map((row) => mapPublishedServiceAreaSummary(row, language));
    case "furniture_catalog": {
      const bundle = payload.furnitureCatalog;
      if (!bundle) return undefined;
      const products = mapFurnitureCatalogSeed(bundle.materials as FurnitureMaterialRow[], bundle.setting, language);
      if (parameters.slug !== undefined) return bundle.detailSlug === parameters.slug ? products.find((product) => product.slug === parameters.slug) || null : undefined;
      return bundle.detailSlug ? undefined : products;
    }
    case "services": return payload.services?.map((row) => mapPublishedService(row, language));
    case "service_summaries": return payload.services ? limit(payload.services, parameters.limit).map((row) => mapPublishedService(row, language)) : undefined;
    case "service": {
      const row = payload.services?.find((item) => item.slug === parameters.slug);
      return row && (row[`content_${language}`] || row.content_en || row.content_zh) && ("suitable_for_en" in row || "faqs_en" in row) ? mapPublishedService(row, language) : undefined;
    }
    case "project_summaries": {
      const rows = payload.projectSummaries ? limit(payload.projectSummaries, parameters.limit) : undefined;
      return rows && !rows.some((row) => needsProjectSummaryContentFallback(row, language)) ? rows.map((row) => mapPublishedProjectSummary(row, language)) : undefined;
    }
    case "project": { const row = payload.projectDetails?.[String(parameters.slug)]; return row ? mapPublishedProjectDetail(row, language) : undefined; }
    case "materials": return payload.materials ? mapPublishedMaterialRows(payload.materials.filter((row) => String(row.category || "").toLowerCase() !== FURNITURE_MATERIAL_CATEGORY), language) : undefined;
    case "material": {
      const row = payload.materials?.find((item) => item.slug === parameters.slug);
      // Summary body fallback alone does not prove that detail fields were projected.
      if (!row || !("material_images" in row || "suitable_spaces_en" in row || "seo_title_en" in row)) return undefined;
      const categories = mapPublishedMaterialRows(payload.materials!.filter((item) => String(item.category || "").toLowerCase() !== FURNITURE_MATERIAL_CATEGORY), language);
      const category = categories.find((item) => item.items.some((material) => material.slug === parameters.slug));
      return category ? { material: category.items.find((item) => item.slug === parameters.slug), category } : undefined;
    }
    case "product_highlights": {
      const rows = payload.productHighlights;
      if (!rows) return undefined;
      const items = mapPublishedMaterialRows(rows.filter((row) => String(row.category || "").toLowerCase() !== FURNITURE_MATERIAL_CATEGORY), language).flatMap((category) => category.items);
      return items.length >= Number(parameters.limit) ? items.slice(0, Number(parameters.limit)) : undefined;
    }
    case "blog": return payload.blogPosts ? mapPublishedBlogPostRows(payload.blogPosts, language) : undefined;
    case "blog_post": return payload.blogPosts ? mapPublishedBlogPostRows(payload.blogPosts, language).find((post) => post.slug === parameters.slug && Boolean(post.content?.trim())) : undefined;
    case "service_areas": return payload.serviceAreas?.map((row) => mapPublishedServiceAreaSummary(row, language));
    case "home_bundle": return payload.homeContentBundle ? createRemoteContent(mapRemoteHomeContentBundle(payload.homeContentBundle, language)) : undefined;
    case "site_page": { const bundle = payload.sitePages?.[String(parameters.pageKey)]; return bundle ? mapSitePageRows(bundle, language) : undefined; }
    case "cta": { const row = payload.ctaBlocks?.[String(parameters.blockKey)]; return row ? mapPublishedCtaBlockRow(row, language) : undefined; }
    default: return undefined;
  }
}

// Registered only when a public content route/prefetch module is imported.
// The common shell can hydrate settings without downloading all content readers.
registerPublicQuerySeedResolver(getPublicQuerySeed);
