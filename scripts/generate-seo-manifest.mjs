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

const [projects, posts, materials, areas, landings, services] = await Promise.all([
  fetchRows("projects", "slug,title_en,title_zh,excerpt_en,excerpt_zh"),
  fetchRows("blog_posts", "slug,title_en,title_zh,excerpt_en,excerpt_zh"),
  fetchRows("materials", "slug,title_en,title_zh,excerpt_en,excerpt_zh,seo_description_en,seo_description_zh"),
  fetchRows("service_areas", "slug,title_en,title_zh,seo_description_en,seo_description_zh,excerpt_en,excerpt_zh"),
  fetchRows("landing_pages", "slug,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh,title_en,title_zh"),
  fetchRows("services", "slug,title_en,title_zh,seo_title_en,seo_title_zh,seo_description_en,seo_description_zh"),
]);

for (const lang of ["en", "zh"]) {
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
