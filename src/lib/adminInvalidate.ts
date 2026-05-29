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
export function invalidatePublishedContent(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: ["published"] });
}

export async function invalidateAfterAdminContentSave(qc: QueryClient) {
  await Promise.all([invalidateAdminContentLists(qc), invalidatePublishedContent(qc)]);
}

/** Refresh a single admin editor record after save or English generation. */
export function invalidateAdminContentDetail(qc: QueryClient, table: string, id: string) {
  return qc.invalidateQueries({ queryKey: ["admin", table, "detail", id] });
}
