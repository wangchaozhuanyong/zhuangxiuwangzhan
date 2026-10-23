import { materialCategories, furnitureCategories, furnitureProducts } from "./catalog-link-targets.ts";
import type { ContentLinkTarget } from "./content-links.mjs";

type LinkQuery = PromiseLike<{ data: Array<Record<string, unknown>> | null; error: { message?: string } | null }> & {
  eq: (field: string, value: string) => LinkQuery;
  is: (field: string, value: null) => LinkQuery;
  limit: (count: number) => LinkQuery;
};
export type ContentLinkClient = { from: (table: string) => { select: (fields: string) => LinkQuery } };

/** Read-only target lookup. Never infer availability from an HTTP 200 SPA fallback. */
export async function publishedContentLinkExists(client: ContentLinkClient, target: ContentLinkTarget): Promise<boolean> {
  if (target.key === "material_category") {
    const [, , , category, subcategory] = target.canonicalPath.split("/");
    const fallback = materialCategories.find(item => item.key === category);
    if (fallback && (!subcategory || fallback.subcategories.includes(subcategory))) return true;
    const { data, error } = await client.from("materials").select("category,subcategory").eq("status", "published").limit(10000);
    if (error) throw new Error("Content link targets could not be checked. Retry before saving.");
    const slug = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return Boolean(data?.some(item => slug(item.category) === category && (!subcategory || slug(item.subcategory || item.category) === subcategory)));
  }
  if (target.key === "furniture_category") {
    const [, , category, subcategory] = target.canonicalPath.split("/");
    return furnitureCategories.some(item => item.key === category && (!subcategory || item.subcategories.includes(subcategory)));
  }
  let query = client.from(target.table).select("id").eq("status", "published").eq(target.key === "furniture_product" ? "slug" : target.key, target.value);
  if (target.table === "cms_pages") query = query.is("deleted_at", null);
  const { data, error } = await query.limit(1);
  if (error) throw new Error("Content link targets could not be checked. Retry before saving.");
  if (!data?.length && target.key === "furniture_product") {
    return furnitureProducts.some(slug => decodeURIComponent(slug) === target.value);
  }
  return Boolean(data?.length);
}
