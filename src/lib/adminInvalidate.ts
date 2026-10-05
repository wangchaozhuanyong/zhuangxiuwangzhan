import { notifyQueryInvalidation } from "@/lib/queryInvalidationEvents";
import type { QueryClient } from "@tanstack/react-query";

/** Refresh admin CMS list caches after create/update in editors. */
export function invalidateAdminContentLists(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["admin", "services"] }),
    qc.invalidateQueries({ queryKey: ["admin", "projects"] }),
    qc.invalidateQueries({ queryKey: ["admin", "materials"] }),
    qc.invalidateQueries({ queryKey: ["admin", "blog_posts"] }),
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    qc.invalidateQueries({ queryKey: ["admin", "seo", "audit"] }),
  ]);
}

export function invalidateSiteSettings(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: ["site-settings"] });
}

/** Refresh public site caches after CMS content changes. */
export async function invalidatePublishedContent(qc: QueryClient) {
  await qc.invalidateQueries({ queryKey: ["published"] });
  notifyQueryInvalidation({ resources: [], published: true, settings: false });
}

export async function invalidateAfterAdminContentSave(qc: QueryClient) {
  await Promise.all([invalidateAdminContentLists(qc), invalidatePublishedContent(qc)]);
}

/** Refresh a single admin editor record after save or English generation. */
export function invalidateAdminContentDetail(qc: QueryClient, table: string, id: string) {
  return qc.invalidateQueries({ queryKey: ["admin", table, "detail", id] });
}

/** A resource write invalidates its lists, records, dependent aggregates and delivery. */
export async function invalidateAdminResource(qc: QueryClient, table: string, published = true) {
  const aliases: Record<string, string[]> = {
    blog_posts: ["blog_posts", "blog"], quote_requests: ["quotes"], leads: ["leads"],
    home_sections: ["home", "home_editor"], about_sections: ["about", "about_editor"],
    cms_sections: ["cms_sections", "cms_pages", "cms_revisions"],
    project_images: ["projects", "project_images"], material_images: ["materials", "material_images"],
  };
  const resources = [...new Set([table, ...(aliases[table] || []), "dashboard", "content_health", "publish_center", "seo", "home-editor", "about-editor"])];
  const settings = table === "site_settings";
  await qc.invalidateQueries({ predicate: (query) => {
    const [surface, resource] = query.queryKey;
    return surface === "admin" && resources.includes(String(resource)) || published && surface === "published" || settings && surface === "site-settings";
  } }, { cancelRefetch: false });
  notifyQueryInvalidation({ resources, published, settings });
}
