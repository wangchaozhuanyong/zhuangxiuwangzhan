import {
  fetchAdminSeoAuditRows,
  type AdminSeoAuditTable,
} from "@/backend/modules/seo/repository/seoAuditRepository";
import { adminSeoSourceLabels } from "@/i18n/adminSeoManagerText";
import { getAdminLang } from "@/lib/adminLocale";

export const adminSeoSources = [
  { table: "site_pages" as const, route: "/admin/pages", front: "" },
  { table: "cms_pages" as const, route: "/admin/cms", front: "" },
  { table: "services" as const, route: "/admin/services", front: "/services" },
  { table: "projects" as const, route: "/admin/projects", front: "/projects" },
  { table: "materials" as const, route: "/admin/materials", front: "/materials" },
  { table: "blog_posts" as const, route: "/admin/blog", front: "/blog" },
  { table: "service_areas" as const, route: "/admin/content/service_areas", front: "/locations" },
  { table: "landing_pages" as const, route: "/admin/content/landing_pages", front: "/landing" },
];

type AdminSeoSourceBase = (typeof adminSeoSources)[number];
export type AdminSeoSource = AdminSeoSourceBase & { label: string };

export type AdminSeoAuditRow = Record<string, unknown> & {
  id?: string;
  table: string;
  source: AdminSeoSource;
  error?: string;
  slug?: string;
  page_key?: string;
  path?: string;
  status?: string;
  title_zh?: string;
  title_en?: string;
  name?: string;
  seo_title_zh?: string | null;
  seo_title_en?: string | null;
  seo_description_zh?: string | null;
  seo_description_en?: string | null;
  seo_keywords_zh?: string | null;
  seo_keywords_en?: string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  hero_image_url?: string | null;
  alt_zh?: string | null;
  alt_en?: string | null;
};

const getAdminSeoSourceLabel = (table: AdminSeoAuditTable) => adminSeoSourceLabels[getAdminLang()][table];

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error || "SEO audit failed"));

export async function loadAdminSeoAuditRows(): Promise<AdminSeoAuditRow[]> {
  const entries = await Promise.all(
    adminSeoSources.map(async (source) => {
      const sourceWithLabel = { ...source, label: getAdminSeoSourceLabel(source.table) };
      try {
        const rows = await fetchAdminSeoAuditRows(source.table);
        return rows.map((row) => ({ ...row, source: sourceWithLabel, table: source.table })) as AdminSeoAuditRow[];
      } catch (error) {
        return [{ table: source.table, source: sourceWithLabel, error: errorMessage(error) }] as AdminSeoAuditRow[];
      }
    }),
  );

  return entries.flat();
}
