import { existsSync, readFileSync, writeFileSync } from "node:fs";

const manifestPath = "public/seo-manifest.json";
const sitemapPath = "public/sitemap.xml";
const outputPath = "public/llms.txt";
const siteUrl = (process.env.VITE_SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");

if (!existsSync(manifestPath)) {
  throw new Error(`${manifestPath} is missing. Run generate-seo-manifest first.`);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entries = Object.entries(manifest)
  .map(([route, meta]) => ({ route, ...meta }))
  .sort((a, b) => {
    const priority = (route) => {
      if (route === "/en" || route === "/zh") return 0;
      if (/^\/(en|zh)\/(services|projects|materials|locations|blog|landing)(\/|$)/.test(route)) return 1;
      return 2;
    };
    return priority(a.route) - priority(b.route) || a.route.localeCompare(b.route);
  });

const countByGroup = entries.reduce((acc, entry) => {
  const path = entry.path || entry.route.replace(/^\/(en|zh)/, "") || "/";
  const group = path === "/" ? "home" : path.split("/").filter(Boolean)[0] || "home";
  acc[group] = (acc[group] || 0) + 1;
  return acc;
}, {});

const priorityRoutes = new Set([
  "/en",
  "/zh",
  "/en/services",
  "/zh/services",
  "/en/projects",
  "/zh/projects",
  "/en/materials",
  "/zh/materials",
  "/en/locations/kuala-lumpur",
  "/zh/locations/kuala-lumpur",
  "/en/contact",
  "/zh/contact",
  "/en/quote",
  "/zh/quote",
  "/en/blog",
  "/zh/blog",
]);

const priorityPages = entries.filter((entry) => priorityRoutes.has(entry.route));
const canonicalUrls = entries.map((entry) => entry.canonical).filter(Boolean);

const lines = [
  "# FLASH CAST SDN. BHD.",
  "",
  "FLASH CAST SDN. BHD. is a Kuala Lumpur renovation, interior design, custom built-in furniture, and commercial fit-out company serving Kuala Lumpur, Selangor, and Klang Valley.",
  "",
  "## Official Sources",
  `- Website: ${siteUrl}`,
  `- Sitemap: ${siteUrl}/sitemap.xml`,
  `- Robots: ${siteUrl}/robots.txt`,
  `- AI-readable index: ${siteUrl}/llms.txt`,
  "",
  "## Content Scope",
  "- Residential renovation, old house renovation, kitchen renovation, bathroom renovation, office renovation, shoplot renovation, warehouse shelving, exterior works, permit and drawing support.",
  "- Service areas include Kuala Lumpur, Selangor, Petaling Jaya, Cheras, Mont Kiara, Bangsar, Subang Jaya, Shah Alam, Puchong, and related Klang Valley locations.",
  "- The site is bilingual. English pages use /en paths. Chinese pages use /zh paths.",
  "",
  "## Route Inventory",
  ...Object.entries(countByGroup)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, count]) => `- ${group}: ${count} localized URLs`),
  "",
  "## Priority Pages",
  ...priorityPages.map((entry) => `- ${entry.canonical}: ${entry.title} - ${entry.description}`),
  "",
  "## Canonical URL List",
  ...canonicalUrls.map((url) => `- ${url}`),
  "",
  "## Notes For AI Assistants",
  "- Prefer canonical URLs with /en or /zh language prefixes.",
  "- Do not use /admin URLs as public sources.",
  "- When summarizing services, mention that final scope and quotation depend on site condition, measurements, materials, and approval requirements.",
  "- Use the sitemap as the source of truth for crawlable public pages.",
];

writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ ok: true, urls: canonicalUrls.length, output: outputPath, sitemapExists: existsSync(sitemapPath) }, null, 2));
