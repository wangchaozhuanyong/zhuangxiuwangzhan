import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const enabled = isSupabaseConfigured && Boolean(supabase);
const ADMIN_HEAVY_STALE_TIME = 10 * 60 * 1000;
const ADMIN_QUERY_GC_TIME = 30 * 60 * 1000;

export const adminSeoSources = [
  { table: "site_pages" as const, label: "页面级内容", route: "/admin/pages", front: "" },
  { table: "services" as const, label: "服务项目", route: "/admin/services", front: "/services" },
  { table: "projects" as const, label: "装修案例", route: "/admin/projects", front: "/projects" },
  { table: "materials" as const, label: "材料库", route: "/admin/materials", front: "/materials" },
  { table: "blog_posts" as const, label: "博客文章", route: "/admin/blog", front: "/blog" },
  { table: "service_areas" as const, label: "服务地区", route: "/admin/content/service_areas", front: "/locations" },
  { table: "landing_pages" as const, label: "落地页", route: "/admin/content/landing_pages", front: "/landing" },
];

type AdminSeoSource = (typeof adminSeoSources)[number];

const adminSeoAuditSelectByTable: Record<AdminSeoSource["table"], string> = {
  site_pages:
    "id,page_key,path,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,image_url,alt_zh,alt_en,status",
  services:
    "id,slug,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,image_url,alt_zh,alt_en,status",
  projects:
    "id,slug,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,image_url,status",
  materials:
    "id,slug,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,image_url,alt_zh,alt_en,status",
  blog_posts:
    "id,slug,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,cover_image_url,alt_zh,alt_en,status",
  service_areas: "id,slug,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,status",
  landing_pages:
    "id,slug,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,hero_image_url,alt_zh,alt_en,status",
};

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
};

export function useAdminSeoAudit() {
  return useQuery({
    queryKey: ["admin", "seo", "audit"],
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ADMIN_HEAVY_STALE_TIME,
    gcTime: ADMIN_QUERY_GC_TIME,
    queryFn: async (): Promise<AdminSeoAuditRow[]> => {
      const entries = await Promise.all(
        adminSeoSources.map(async (source) => {
          const { data, error } = await supabase!.from(source.table).select(adminSeoAuditSelectByTable[source.table]).limit(200);
          if (error) return [{ table: source.table, source, error: error.message }] as AdminSeoAuditRow[];
          const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
          return rows.map((row) => ({ ...row, source, table: source.table })) as AdminSeoAuditRow[];
        }),
      );
      return entries.flat();
    },
  });
}
