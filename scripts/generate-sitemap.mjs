import { readFileSync, writeFileSync, existsSync } from "node:fs";

const loadEnv = () => {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
};

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = (process.env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");

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

const staticPaths = [
  "/",
  "/about",
  "/services",
  "/services/renovation",
  "/services/design",
  "/services/builtin",
  "/services/kitchen",
  "/services/bathroom",
  "/services/shoplot",
  "/services/artistic-coating",
  "/services/old-house",
  "/services/approval",
  "/materials",
  "/projects",
  "/process",
  "/faq",
  "/contact",
  "/quote",
  "/blog",
  "/privacy",
  "/terms",
];

const materialCategorySlugs = [
  "kitchen-cabinets",
  "whole-house-custom",
  "furniture",
  "bathroom",
  "countertops-stone-surfaces",
  "flooring",
  "doors-windows",
  "wall-panels",
  "art-paint",
];

const escapeXml = (value) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fetchSlugs = async (table) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=slug&status=eq.published`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${table} for sitemap: ${await response.text()}`);
  }
  return response.json();
};

const urlEntry = (localizedPath) => {
  const basePath = localizedPath.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
  const enPath = `/en${basePath === "/" ? "" : basePath}`;
  const zhPath = `/zh${basePath === "/" ? "" : basePath}`;
  const loc = `${SITE_URL}${localizedPath}`;
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${SITE_URL}${enPath}`)}" />
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(`${SITE_URL}${zhPath}`)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}${enPath}`)}" />
  </url>`;
};

const unique = (items) => [...new Set(items)];

const [projects, posts, materials, areas, landingPages, services] = await Promise.all([
  fetchSlugs("projects"),
  fetchSlugs("blog_posts"),
  fetchSlugs("materials"),
  fetchSlugs("service_areas"),
  fetchSlugs("landing_pages"),
  fetchSlugs("services"),
]);

const paths = unique([
  ...staticPaths,
  ...projects.map((item) => `/projects/${item.slug}`),
  ...posts.map((item) => `/blog/${item.slug}`),
  ...materialCategorySlugs.map((slug) => `/materials/category/${slug}`),
  ...materials.map((item) => `/materials/${item.slug}`),
  ...areas.map((item) => `/locations/${item.slug}`),
  ...landingPages.map((item) => `/landing/${item.slug}`),
  ...services.map((item) => `/services/${item.slug}`),
]);

const localizedPaths = paths
  .flatMap((path) => [`/en${path === "/" ? "" : path}`, `/zh${path === "/" ? "" : path}`])
  .filter((path) => !legacyRedirectPaths.has(path));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localizedPaths.map(urlEntry).join("\n")}
</urlset>
`;

writeFileSync("public/sitemap.xml", xml, "utf8");
console.log(JSON.stringify({ ok: true, urls: localizedPaths.length, output: "public/sitemap.xml" }, null, 2));
