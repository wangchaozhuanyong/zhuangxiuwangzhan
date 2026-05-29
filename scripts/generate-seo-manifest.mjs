import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildStaticManifest, SITE_URL, OG_IMAGE, COMPANY } from "./seo-static-pages.mjs";

const loadEnv = () => {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!process.env[key]) process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const manifest = buildStaticManifest();

const materialCategories = [
  {
    slug: "kitchen-cabinets",
    title_en: "Kitchen Cabinets Materials",
    title_zh: "厨房橱柜材料",
    description_en: "Premium custom kitchen cabinets in melamine, acrylic, lacquer, and solid wood finishes for Kuala Lumpur and Selangor renovation projects.",
    description_zh: "提供美耐板、亚克力、烤漆与实木等厨房橱柜选择，适合吉隆坡与雪兰莪装修项目。",
  },
  {
    slug: "whole-house-custom",
    title_en: "Whole House Custom Furniture Materials",
    title_zh: "全屋定制材料",
    description_en: "Custom kitchen cabinets, wardrobes, TV consoles, and storage systems tailored to residential and commercial spaces.",
    description_zh: "定制厨房橱柜、衣柜、电视柜与收纳系统，根据现场尺寸规划，提升空间使用效率。",
  },
  {
    slug: "furniture",
    title_en: "Furniture Materials and Selections",
    title_zh: "家具材料与搭配",
    description_en: "Sofas, beds, dining tables, and accent furniture selections to complete renovation projects.",
    description_zh: "沙发、床、餐桌与搭配家具，适合住宅装修后期软装与空间完善。",
  },
  {
    slug: "bathroom",
    title_en: "Bathroom Materials",
    title_zh: "浴室材料",
    description_en: "Bathtubs, basins, toilets, shower systems, and vanity cabinets for bathroom renovation projects.",
    description_zh: "浴缸、洗手盆、马桶、淋浴系统与浴室柜，适合完整浴室装修和局部升级。",
  },
  {
    slug: "countertops-stone-surfaces",
    title_en: "Countertops and Stone Surfaces",
    title_zh: "台面与石材表面",
    description_en: "Quartz, sintered stone, solid surface, and porcelain slab options for kitchen counters, islands, vanities, and commercial counters.",
    description_zh: "石英石、岩板、人造石与大板瓷砖台面，适合厨房、岛台、浴室柜和商业柜台。",
  },
  {
    slug: "flooring",
    title_en: "Flooring Materials",
    title_zh: "地板材料",
    description_en: "SPC vinyl, laminate, engineered wood, and vinyl plank flooring for residential and commercial spaces.",
    description_zh: "SPC 地板、复合地板、工程木地板与 PVC 地板，适合住宅和商业空间使用。",
  },
  {
    slug: "doors-windows",
    title_en: "Doors and Windows Materials",
    title_zh: "门窗材料",
    description_en: "Solid timber, laminate, barn, aluminium sliding, and frameless glass doors for homes and commercial interiors.",
    description_zh: "实木门、复合门、谷仓门、铝合金推拉门与无框玻璃门，适合不同房间与商业空间。",
  },
  {
    slug: "wall-panels",
    title_en: "Wall Panels and Feature Wall Materials",
    title_zh: "墙面与饰板材料",
    description_en: "Fluted panels, timber cladding, feature wall tiles, and decorative wall panels for interior feature walls.",
    description_zh: "格栅板、木饰面、背景墙砖与装饰墙板，适合电视墙、卧室和商业空间重点墙面。",
  },
  {
    slug: "art-paint",
    title_en: "Art Paint and Decorative Coatings",
    title_zh: "艺术涂料与装饰涂层",
    description_en: "Decorative art paint, microcement, metallic paint, and textured plaster finishes for premium interiors.",
    description_zh: "艺术涂料、微水泥、金属漆与纹理漆，适合特色墙、天花和高级室内空间。",
  },
];

const fetchRows = async (table, select) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&status=eq.published`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) {
    console.warn(`[seo-manifest] skip ${table}: ${response.status}`);
    return [];
  }
  return response.json();
};

const addDynamic = (lang, basePath, slug, title, description) => {
  const path = `${basePath}/${slug}`;
  const localized = `/${lang}${path}`;
  const enPath = `/en${path}`;
  const zhPath = `/zh${path}`;
  manifest[localized] = {
    lang,
    path,
    title: title.includes("FLASH CAST") ? title : `${title} | ${COMPANY}`,
    description: (description || title).slice(0, 300),
    canonical: `${SITE_URL}${localized}`,
    hreflang: {
      en: `${SITE_URL}${enPath}`,
      zh: `${SITE_URL}${zhPath}`,
      xDefault: `${SITE_URL}${enPath}`,
    },
    ogImage: OG_IMAGE,
  };
};

const addSitePage = (lang, row) => {
  if (!row.path || row.path.includes(":")) return;
  const path = row.path === "/" ? "" : row.path;
  const localized = path ? `/${lang}${path}` : `/${lang}`;
  const enPath = path ? `/en${path}` : "/en";
  const zhPath = path ? `/zh${path}` : "/zh";
  const title =
    lang === "zh"
      ? row.seo_title_zh || row.title_zh || row.seo_title_en || row.title_en
      : row.seo_title_en || row.title_en || row.seo_title_zh || row.title_zh;
  const description =
    lang === "zh"
      ? row.seo_description_zh || row.description_zh || row.seo_description_en || row.description_en
      : row.seo_description_en || row.description_en || row.seo_description_zh || row.description_zh;
  if (!title && !description) return;
  const ogImage = row.image_url
    ? (String(row.image_url).startsWith("http") ? row.image_url : `${SITE_URL}${row.image_url}`)
    : OG_IMAGE;
  manifest[localized] = {
    lang,
    path: row.path || "/",
    title: (title || COMPANY).includes("FLASH CAST") ? title || COMPANY : `${title} | ${COMPANY}`,
    description: (description || title || COMPANY).slice(0, 300),
    keywords: lang === "zh" ? row.seo_keywords_zh || row.seo_keywords_en || "" : row.seo_keywords_en || row.seo_keywords_zh || "",
    canonical: `${SITE_URL}${localized}`,
    hreflang: {
      en: `${SITE_URL}${enPath}`,
      zh: `${SITE_URL}${zhPath}`,
      xDefault: `${SITE_URL}${enPath}`,
    },
    ogImage,
  };
};

const [projects, posts, materials, areas, landings, services, sitePages] = await Promise.all([
  fetchRows("projects", "slug,title_en,title_zh,excerpt_en,excerpt_zh"),
  fetchRows("blog_posts", "slug,title_en,title_zh,excerpt_en,excerpt_zh"),
  fetchRows("materials", "slug,title_en,title_zh,excerpt_en,excerpt_zh,seo_description_en,seo_description_zh"),
  fetchRows("service_areas", "slug,title_en,title_zh,seo_description_en,seo_description_zh,excerpt_en,excerpt_zh"),
  fetchRows("landing_pages", "slug,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh,title_en,title_zh"),
  fetchRows("services", "slug,title_en,title_zh,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh"),
  fetchRows("site_pages", "page_key,path,title_en,title_zh,description_en,description_zh,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh,seo_keywords_en,seo_keywords_zh,image_url"),
]);

for (const lang of ["en", "zh"]) {
  for (const row of sitePages) addSitePage(lang, row);
  for (const row of projects) {
    addDynamic(
      lang,
      "/projects",
      row.slug,
      lang === "zh" ? row.title_zh || row.title_en : row.title_en || row.title_zh,
      lang === "zh" ? row.excerpt_zh || row.excerpt_en : row.excerpt_en || row.excerpt_zh,
    );
  }
  for (const row of posts) {
    addDynamic(
      lang,
      "/blog",
      row.slug,
      lang === "zh" ? row.title_zh || row.title_en : row.title_en || row.title_zh,
      lang === "zh" ? row.excerpt_zh || row.excerpt_en : row.excerpt_en || row.excerpt_zh,
    );
  }
  for (const row of materialCategories) {
    addDynamic(
      lang,
      "/materials/category",
      row.slug,
      lang === "zh" ? row.title_zh : row.title_en,
      lang === "zh" ? row.description_zh : row.description_en,
    );
  }
  for (const row of materials) {
    addDynamic(
      lang,
      "/materials",
      row.slug,
      lang === "zh" ? row.title_zh || row.title_en : row.title_en || row.title_zh,
      lang === "zh"
        ? row.seo_description_zh || row.excerpt_zh || row.seo_description_en || row.excerpt_en
        : row.seo_description_en || row.excerpt_en || row.seo_description_zh || row.excerpt_zh,
    );
  }
  for (const row of areas) {
    addDynamic(
      lang,
      "/locations",
      row.slug,
      lang === "zh" ? row.title_zh || row.title_en : row.title_en || row.title_zh,
      lang === "zh"
        ? row.seo_description_zh || row.excerpt_zh || row.seo_description_en || row.excerpt_en
        : row.seo_description_en || row.excerpt_en || row.seo_description_zh || row.excerpt_zh,
    );
  }
  for (const row of landings) {
    const title =
      lang === "zh"
        ? row.seo_title_zh || row.title_zh || row.seo_title_en || row.title_en
        : row.seo_title_en || row.title_en || row.seo_title_zh || row.title_zh;
    const description =
      lang === "zh"
        ? row.seo_description_zh || row.seo_description_en
        : row.seo_description_en || row.seo_description_zh;
    addDynamic(lang, "/landing", row.slug, title, description);
  }
  for (const row of services) {
    const title =
      lang === "zh"
        ? row.seo_title_zh || row.title_zh || row.seo_title_en || row.title_en
        : row.seo_title_en || row.title_en || row.seo_title_zh || row.title_zh;
    const description =
      lang === "zh"
        ? row.seo_description_zh || row.seo_description_en
        : row.seo_description_en || row.seo_description_zh;
    addDynamic(lang, "/services", row.slug, title, description);
  }
}

mkdirSync("functions", { recursive: true });
const output = JSON.stringify(manifest, null, 0);
writeFileSync("functions/seo-manifest.json", output, "utf8");
writeFileSync("public/seo-manifest.json", output, "utf8");
console.log(JSON.stringify({ ok: true, routes: Object.keys(manifest).length }, null, 2));
