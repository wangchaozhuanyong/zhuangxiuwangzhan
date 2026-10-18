// Portable published-source contract shared by generation and runtime discovery.
export const sourceKinds = {projects:"project",blog_posts:"blog",materials:"material",service_areas:"service_area",landing_pages:"landing_page",services:"service",site_pages:"site_page",cms_pages:"cms_page"};
export const sourceFields = {
 projects:"seo_title_ms,seo_description_ms,id,status,slug,title_en,title_ms,title_zh,excerpt_en,excerpt_ms,excerpt_zh,content_en,content_ms,content_zh,highlights_en,highlights_ms,highlights_zh",
 blog_posts:"id,status,slug,title_en,title_ms,title_zh,excerpt_en,excerpt_ms,excerpt_zh,content_en,content_ms,content_zh,seo_title_en,seo_title_ms,seo_title_zh,seo_description_en,seo_description_ms,seo_description_zh,category,tags,cover_image_url,alt_en,alt_ms,alt_zh,published_at,updated_at",
 materials:"seo_title_ms,id,status,slug,title_en,title_ms,title_zh,excerpt_en,excerpt_ms,excerpt_zh,content_en,content_ms,content_zh,pros_en,pros_ms,pros_zh,suitable_spaces_en,suitable_spaces_ms,suitable_spaces_zh,seo_description_en,seo_description_ms,seo_description_zh,category,subcategory,image_url",
 service_areas:"seo_title_ms,id,status,slug,title_en,title_ms,title_zh,content_en,content_ms,content_zh,seo_description_en,seo_description_ms,seo_description_zh,excerpt_en,excerpt_ms,excerpt_zh,construction_notes_en,construction_notes_ms,faqs_en,faqs_ms",
 landing_pages:"id,status,slug,title_en,title_ms,title_zh,content_en,content_ms,content_zh,benefits_en,benefits_ms,benefits_zh,faqs_en,faqs_ms,faqs_zh,seo_title_en,seo_title_ms,seo_title_zh,seo_description_en,seo_description_ms,seo_description_zh",
 services:"id,status,slug,title_en,title_ms,title_zh,content_en,content_ms,content_zh,scope_items_en,scope_items_ms,scope_items_zh,process_steps_en,process_steps_ms,process_steps_zh,faqs_en,faqs_ms,faqs_zh,seo_title_en,seo_title_ms,seo_title_zh,seo_description_en,seo_description_ms,seo_description_zh",
 site_pages:"id,status,page_key,path,title_en,title_ms,title_zh,content_en,content_ms,content_zh,items_en,items_ms,items_zh,description_en,description_ms,description_zh,seo_title_en,seo_title_ms,seo_title_zh,seo_description_en,seo_description_ms,seo_description_zh,seo_keywords_en,seo_keywords_ms,seo_keywords_zh,image_url",
 cms_pages:"id,status,path,title_en,title_ms,title_zh,seo_title_en,seo_title_ms,seo_title_zh,seo_description_en,seo_description_ms,seo_description_zh,seo_keywords_en,seo_keywords_ms,seo_keywords_zh,deleted_at,cms_sections(status,deleted_at,content_en,content_ms,content_zh)",
};
const present = value => typeof value === "string" ? Boolean(value.replace(/<[^>]*>/g," ").replace(/&(?:nbsp|#160);/g," ").trim()) : Array.isArray(value) ? value.some(present) : value && typeof value === "object" ? Object.values(value).some(present) : false;
export const hasCompleteMalayContent = row => {
 if (!row || ["title","seo_title","seo_description"].some(field=>!present(row[`${field}_ms`]))) return false;
 const fields=["content","description","excerpt","items","scope_items","faqs","process_steps","suitable_for","common_projects","highlights","client_need","pros","cons","suitable_spaces","benefits","construction_notes","recommended_pairing","note","price_scope","price_note"];
 if(fields.some(field=>present(row[`${field}_en`])&&!present(row[`${field}_ms`])))return false;
 return (Array.isArray(row.cms_sections)?row.cms_sections:[]).filter(section=>section.status==="published"&&!section.deleted_at)
  .every(section=>!present(section.content_en)||present(section.content_ms));
};
export const qualifiesLocale = (row,kind,lang) => {
 if (row.status !== "published" || row.deleted_at) return false;
 const title=present(row[`title_${lang}`]);
 if(kind === "cms_page") {
  const sections=(Array.isArray(row.cms_sections)?row.cms_sections:[]).filter(s=>s.status === "published"&&!s.deleted_at);
  return (title||sections.some(s=>present(s[`content_${lang}`]?.title))) && sections.some(s=>["rich_text","content","text","items"].some(f=>present(s[`content_${lang}`]?.[f])));
 }
 const core={service:["scope_items","process_steps","faqs"],project:["highlights"],material:["excerpt","pros","suitable_spaces"],landing_page:["benefits","faqs"],site_page:["items"]};
 return title && (present(row[`content_${lang}`]) || (core[kind]||[]).some(f=>present(row[`${f}_${lang}`])));
};
export const serializeSourcePath = path => path.split("/").map(segment => {
 try { return encodeURIComponent(decodeURIComponent(segment)); }
 catch { return encodeURIComponent(segment); }
}).join("/");
export const currentSourcePath = (row,kind) => {
 const prefix={project:"/projects",blog:"/blog",material:row.category==="furniture"?"/furniture/product":"/materials",service_area:"/locations",landing_page:"/landing",service:"/services"}[kind];
 if(prefix) return typeof row.slug==="string" && row.slug.trim() && !/[/?#]/.test(row.slug) ? serializeSourcePath(`${prefix}/${row.slug}`) : null;
 const path=row.path;
 return typeof path==="string" && path.startsWith("/") && !/[\\:#?]/.test(path) && !/^\/(?:admin|en|zh|ms)(?:\/|$)/.test(path) && !/\.[a-z0-9]+$/i.test(path) && !path.includes("..") ? serializeSourcePath(path) : null;
};
// Published route definitions are source records, not indexable page instances.
// Keep only these exact table-specific definitions in the complete snapshot/hash;
// currentSourcePath still excludes them from canonical pages and generated documents.
export const knownSourceTemplates = {
 site_pages:new Set(["/materials/category/:categorySlug", "/services/:slug"]),
 cms_pages:new Set(["/materials/category/:categorySlug", "/services/:slug"]),
};
// Dedicated sources own their route before language qualification. A generic
// page must not revive the same row after its selected-language body is absent.
export function pickPublicSourceOwners(rows) {
 const owners=new Map();
 for(const [table,kind] of Object.entries(sourceKinds)) for(const row of rows[table]||[]) {
  const path=currentSourcePath(row,kind);
  if(path&&!owners.has(path))owners.set(path,{row,kind});
 }
 return owners;
}
