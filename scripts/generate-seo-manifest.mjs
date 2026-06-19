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

for (const path of legacyRedirectPaths) {
  delete manifest[path];
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

const addDynamic = (lang, basePath, slug, title, description) => {
  const path = `${basePath}/${slug}`;
  const localized = `/${lang}${path}`;
  if (legacyRedirectPaths.has(localized)) return;
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
  const existing = manifest[localized] || {};
  manifest[localized] = {
    ...existing,
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
