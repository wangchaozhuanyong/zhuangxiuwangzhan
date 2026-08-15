import type { PathRow, SitemapClient, SitemapContentSlugs, SlugRow } from "./types.ts";

const fetchPublishedSlugs = async (client: SitemapClient, table: string): Promise<SlugRow[]> => {
  const { data } = await client.from(table).select("slug").eq("status", "published");
  return (data || []) as SlugRow[];
};

const fetchPublishedPaths = async (client: SitemapClient, table: "site_pages" | "cms_pages"): Promise<PathRow[]> => {
  let query = client.from(table).select("path").eq("status", "published");
  if (table === "cms_pages") query = query.is("deleted_at", null);
  const { data } = await query;
  return (data || []) as PathRow[];
};

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
