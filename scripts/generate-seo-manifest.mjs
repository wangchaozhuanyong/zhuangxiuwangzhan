import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { buildStaticManifest, SITE_URL, OG_IMAGE, COMPANY } from "./seo-static-pages.mjs";
import { loadMaterialSeoCategories } from "./seo-material-pages.mjs";

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
const DRAFT_MARKER_REPLACEMENTS = [
  [
    /FLASH CAST image-rich draft for shop renovation and retail fit-out planning, including pre-opening preparation, customer flow, counter and storage planning, rendering concepts, FAQ, and consultation CTA\./gi,
    "FLASH CAST plans shop renovation and retail fit-out for shoplots, retail stores, clinics, beauty front areas, F&B spaces, display flow, counter storage, material direction, and quotation preparation.",
  ],
  [
    /FLASH CAST 店铺装修图文内容草案，包含开店前准备、展示动线、柜台收纳、材料方向、效果图方案、FAQ 和咨询 CTA。/g,
    "FLASH CAST 提供店铺装修与零售空间规划，适合 shoplot、零售门店、诊所前区、beauty 前场和小型餐饮空间，重点整理展示动线、柜台收纳、材料方向和报价前准备。",
  ],
  [
    /FLASH CAST 店铺装修双语图文草案，覆盖 shoplot、零售门店、展示空间、柜台收纳、开店前准备、效果图方案、FAQ 和咨询路径。/g,
    "FLASH CAST 提供店铺装修与零售空间规划，覆盖 shoplot、零售门店、展示动线、柜台收纳、开店前准备、效果图方案和咨询路径。",
  ],
  [
    /FLASH CAST image-rich draft for shop renovation and retail fit-out planning/gi,
    "FLASH CAST shop renovation and retail fit-out planning guide",
  ],
  [
    /Bilingual shop renovation and retail fit-out planning content for FLASH CAST, covering/gi,
    "Plan shop renovation and retail fit-out with FLASH CAST, covering",
  ],
  [/image-rich draft/gi, "image-rich guide"],
  [/FLASH CAST 店铺装修双语图文草案/g, "FLASH CAST 店铺装修与零售空间规划服务"],
  [/FLASH CAST 店铺装修图文内容草案/g, "FLASH CAST 店铺装修与零售空间规划指南"],
  [/双语图文草案/g, "双语服务指南"],
  [/图文内容草案/g, "图文内容指南"],
  [/图文草案/g, "服务规划指南"],
  [/works best when/gi, "works well when"],
  [/warranty, and exclusions/gi, "after-sales terms, and exclusions"],
  [/保修和不包含项目/g, "售后条款和不包含项目"],
  [/第一印象/g, "入口观感"],
  [/第一眼/g, "入口观感"],
];

const sanitizeSeoText = (value = "") =>
  DRAFT_MARKER_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    String(value || ""),
  );

const legacyRedirectPaths = new Set([
  "/en/materials/acrylic-high-gloss-white",
  "/zh/materials/acrylic-high-gloss-white",
  "/en/materials/melamine-grey-oak",
  "/zh/materials/melamine-grey-oak",
  "/en/materials/spc-vinyl-natural-oak",
  "/zh/materials/spc-vinyl-natural-oak",
  "/en/services/office",
  "/zh/services/office",
  "/en/services/shoplot",
  "/zh/services/shoplot",
]);
const redirectOnlyPaths = new Set([
  "/products",
]);
const redirectOnlyLandingSlugs = new Set([
  "office-renovation",
  "shop-renovation",
  "bathroom-renovation",
  "old-house-renovation",
  "custom-built-in",
  "warehouse-shelving",
  "kitchen-cabinet",
  "flooring",
]);

for (const path of legacyRedirectPaths) {
  delete manifest[path];
}

for (const path of redirectOnlyPaths) {
  for (const lang of ["en", "zh"]) {
    delete manifest[`/${lang}${path}`];
  }
}

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

const addDynamic = (lang, basePath, slug, title, description, metadata = {}) => {
  const path = `${basePath}/${slug}`;
  const localized = `/${lang}${path}`;
  if (legacyRedirectPaths.has(localized)) return;
  const enPath = `/en${path}`;
  const zhPath = `/zh${path}`;
  const rawTitle = title || COMPANY;
  const safeTitle = sanitizeSeoText(rawTitle.includes("FLASH CAST") ? rawTitle : `${rawTitle} | ${COMPANY}`);
  const safeDescription = sanitizeSeoText(description || rawTitle).slice(0, 300);
  const dynamicOgImage = metadata.ogImage
    ? (String(metadata.ogImage).startsWith("http") ? metadata.ogImage : `${SITE_URL}${metadata.ogImage}`)
    : OG_IMAGE;
  manifest[localized] = {
    lang,
    path,
    title: safeTitle,
    description: safeDescription,
    canonical: `${SITE_URL}${localized}`,
    hreflang: {
      en: `${SITE_URL}${enPath}`,
      zh: `${SITE_URL}${zhPath}`,
      xDefault: `${SITE_URL}${enPath}`,
    },
    ogImage: dynamicOgImage,
    schemaType: metadata.schemaType || undefined,
    headline: metadata.headline || undefined,
    datePublished: metadata.datePublished || undefined,
    dateModified: metadata.dateModified || undefined,
    articleSection: metadata.articleSection || undefined,
    imageAlt: metadata.imageAlt || undefined,
    keywords: metadata.keywords || undefined,
  };
};

const addSitePage = (lang, row) => {
  if (!row.path || row.path.includes(":") || redirectOnlyPaths.has(row.path)) return;
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
  const existing = manifest[localized] || {};
  const rawTitle = title || COMPANY;
  const safeTitle = sanitizeSeoText(rawTitle.includes("FLASH CAST") ? rawTitle : `${rawTitle} | ${COMPANY}`);
  const safeDescription = sanitizeSeoText(description || rawTitle || COMPANY).slice(0, 300);
  manifest[localized] = {
    ...existing,
    lang,
    path: row.path || "/",
    title: safeTitle,
    description: safeDescription,
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
  fetchRows("blog_posts", "slug,title_en,title_zh,excerpt_en,excerpt_zh,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh,category,tags,cover_image_url,alt_en,alt_zh,published_at,updated_at"),
  fetchRows("materials", "slug,title_en,title_zh,excerpt_en,excerpt_zh,seo_description_en,seo_description_zh"),
  fetchRows("service_areas", "slug,title_en,title_zh,seo_description_en,seo_description_zh,excerpt_en,excerpt_zh"),
  fetchRows("landing_pages", "slug,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh,title_en,title_zh"),
  fetchRows("services", "slug,title_en,title_zh,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh"),
  fetchRows("site_pages", "page_key,path,title_en,title_zh,description_en,description_zh,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh,seo_keywords_en,seo_keywords_zh,image_url"),
]);
const materialCategories = await loadMaterialSeoCategories();

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
    const title = lang === "zh" ? row.title_zh || row.title_en : row.title_en || row.title_zh;
    const seoTitle = lang === "zh"
      ? row.seo_title_zh || row.seo_title_en || title
      : row.seo_title_en || row.seo_title_zh || title;
    const excerpt = lang === "zh" ? row.excerpt_zh || row.excerpt_en : row.excerpt_en || row.excerpt_zh;
    const seoDescription = lang === "zh"
      ? row.seo_description_zh || row.seo_description_en || excerpt
      : row.seo_description_en || row.seo_description_zh || excerpt;
    const imageAlt = lang === "zh" ? row.alt_zh || row.alt_en || title : row.alt_en || row.alt_zh || title;
    addDynamic(
      lang,
      "/blog",
      row.slug,
      seoTitle,
      seoDescription,
      {
        schemaType: "BlogPosting",
        headline: title,
        datePublished: row.published_at,
        dateModified: row.updated_at || row.published_at,
        articleSection: row.category,
        imageAlt,
        ogImage: row.cover_image_url,
        keywords: Array.isArray(row.tags) ? row.tags.join(", ") : "",
      },
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
    for (const subcategory of row.subcategories) {
      addDynamic(
        lang,
        `/materials/category/${row.slug}`,
        subcategory.slug,
        lang === "zh" ? subcategory.title_zh : subcategory.title_en,
        lang === "zh" ? subcategory.description_zh : subcategory.description_en,
      );
    }
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
    if (redirectOnlyLandingSlugs.has(row.slug)) continue;
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
