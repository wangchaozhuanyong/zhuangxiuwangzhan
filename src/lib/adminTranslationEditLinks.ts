const directRoutes: Record<string, string> = { services: "/admin/services", projects: "/admin/projects", materials: "/admin/materials", blog_posts: "/admin/blog" };
export const translationTargetNeedsRecord = (table: string | null) => Boolean(table && ["home_sections", "about_sections", "cta_blocks", "site_pages", "cms_sections", "project_images"].includes(table));

/** Only return routes backed by an existing, permitted editor. */
export function buildTranslationRecordEditHref(table: string | null, id: string | null, record?: Record<string, unknown> | null): string | null {
  if (!table || !id) return null;
  const encodedId = encodeURIComponent(id);
  if (directRoutes[table]) return `${directRoutes[table]}/${encodedId}`;
  if (["testimonials", "hero_slides", "service_areas", "landing_pages"].includes(table)) return `/admin/content/${table}/${encodedId}`;
  if (table === "faqs") return `/admin/faqs?record=${encodedId}`;
  if (table === "cms_pages") return `/admin/cms?page=${encodedId}`;
  if (table === "cms_sections" && typeof record?.page_id === "string") return `/admin/cms?page=${encodeURIComponent(record.page_id)}&section=${encodedId}`;
  if (table === "project_images" && typeof record?.project_id === "string") return `/admin/projects/${encodeURIComponent(record.project_id)}`;
  if (table === "site_pages" && record) return record.page_key === "promotions" ? "/admin/promotions" : `/admin/pages?record=${encodedId}`;
  if (table === "home_sections") {
    const tabs: Record<string, string> = { stats: "stats", why_choose_us: "why", brand_partners: "brands" };
    const tab = tabs[String(record?.section_key || "")];
    return tab ? `/admin/home?section=${tab}` : null;
  }
  if (table === "about_sections" && ["hero", "intro", "stats", "core_values", "team", "milestones", "office"].includes(String(record?.section_key))) return `/admin/about?section=${encodeURIComponent(String(record?.section_key))}`;
  if (table === "cta_blocks") return record?.block_key === "home_final" ? "/admin/home?section=cta" : record?.block_key === "about_final" ? "/admin/about?section=cta" : null;
  return null;
}
