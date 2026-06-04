import { requireSupabase } from "@/lib/supabase";

export const adminSeoAuditSelectByTable = {
  site_pages:
    "id,page_key,path,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,seo_keywords_zh,seo_keywords_en,image_url,alt_zh,alt_en,status",
  cms_pages:
    "id,page_key,path,title_zh,title_en,seo_title_zh,seo_title_en,seo_description_zh,seo_description_en,seo_keywords_zh,seo_keywords_en,status",
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
} as const;

export type AdminSeoAuditTable = keyof typeof adminSeoAuditSelectByTable;

export async function fetchAdminSeoAuditRows(table: AdminSeoAuditTable) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.from(table).select(adminSeoAuditSelectByTable[table]).limit(200);
  if (error) throw error;

  return (data ?? []) as unknown as Array<Record<string, unknown>>;
}
