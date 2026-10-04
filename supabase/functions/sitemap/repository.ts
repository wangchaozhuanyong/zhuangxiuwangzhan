import type { PathRow, SitemapClient, SitemapContentSlugs, SlugRow } from "./types.ts";

// Read until an empty page: a server-side cap can be lower than our requested limit.
const fetchPublishedRows = async <T extends SlugRow | PathRow>(
  client: SitemapClient,
  table: string,
  field: "slug" | "path",
): Promise<T[]> => {
  const rows: T[] = [];
  let cursor: string | undefined;
  while (true) {
    let query = client.from(table).select(`id,${field}`).eq("status", "published").order("id", { ascending: true }).limit(500);
    if (table === "cms_pages") query = query.is("deleted_at", null);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw new Error(`Sitemap source read failed: ${table}`);
    if (!Array.isArray(data)) throw new Error(`Sitemap source response is invalid: ${table}`);
    if (!data.length) return rows;
    for (const raw of data as unknown[]) {
      const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : null;
      if (!row || typeof row.id !== "string" || !row.id || (cursor && row.id <= cursor)
        || typeof row[field] !== "string" || !row[field].trim()) {
        throw new Error(`Sitemap source row is invalid: ${table}`);
      }
      cursor = row.id;
      rows.push({ [field]: row[field] } as T);
    }
  }
};

const fetchPublishedSlugs = (client: SitemapClient, table: string) => fetchPublishedRows<SlugRow>(client, table, "slug");
const fetchPublishedPaths = (client: SitemapClient, table: "site_pages" | "cms_pages") => fetchPublishedRows<PathRow>(client, table, "path");

export async function fetchSitemapContentSlugs(client: SitemapClient): Promise<SitemapContentSlugs> {
  const [projects, posts, materials, areas, landingPages, services, sitePages, cmsPages] = await Promise.all([
    fetchPublishedSlugs(client, "projects"),
    fetchPublishedSlugs(client, "blog_posts"),
    fetchPublishedSlugs(client, "materials"),
    fetchPublishedSlugs(client, "service_areas"),
    fetchPublishedSlugs(client, "landing_pages"),
    fetchPublishedSlugs(client, "services"),
    fetchPublishedPaths(client, "site_pages"),
    fetchPublishedPaths(client, "cms_pages"),
  ]);

  return { projects, posts, materials, areas, landingPages, services, sitePages, cmsPages };
}
