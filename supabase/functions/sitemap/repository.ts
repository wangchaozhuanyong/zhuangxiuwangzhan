import type { SitemapClient, SitemapContentSlugs, SlugRow } from "./types.ts";

const fetchPublishedSlugs = async (client: SitemapClient, table: string): Promise<SlugRow[]> => {
  const { data } = await client.from(table).select("slug").eq("status", "published");
  return (data || []) as SlugRow[];
};

export async function fetchSitemapContentSlugs(client: SitemapClient): Promise<SitemapContentSlugs> {
  const [projects, posts, materials, areas, landingPages, services] = await Promise.all([
    fetchPublishedSlugs(client, "projects"),
    fetchPublishedSlugs(client, "blog_posts"),
    fetchPublishedSlugs(client, "materials"),
    fetchPublishedSlugs(client, "service_areas"),
    fetchPublishedSlugs(client, "landing_pages"),
    fetchPublishedSlugs(client, "services"),
  ]);

  return { projects, posts, materials, areas, landingPages, services };
}
