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
const priorityChinesePages = priorityPages.filter((entry) => entry.lang === "zh" || entry.route.startsWith("/zh"));
const priorityEnglishPages = priorityPages.filter((entry) => entry.lang === "en" || entry.route.startsWith("/en"));
const canonicalUrls = entries.map((entry) => entry.canonical).filter(Boolean);

const lines = [
  "# FLASH CAST SDN. BHD.",
  "",
  "FLASH CAST SDN. BHD. is a Kuala Lumpur renovation, interior design, custom built-in furniture, and commercial fit-out company serving Kuala Lumpur, Selangor, and Klang Valley.",
  "",
  "## 中文摘要",
  "FLASH CAST SDN. BHD. 是服务吉隆坡、雪兰莪与巴生谷的装修、室内设计、定制家具和商业空间装修公司。中文页面重点覆盖住宅装修、旧屋翻新、厨房装修、浴室装修、办公室装修、店铺装修、仓储货架、外墙工程、准证图纸支持和装修材料选择。",
  "",
  "## Official Sources",
  `- Website: ${siteUrl}`,
  `- Sitemap: ${siteUrl}/sitemap.xml`,
  `- Robots: ${siteUrl}/robots.txt`,
  `- AI-readable index: ${siteUrl}/llms.txt`,
  "",
  "## Content Scope",
  "- Residential renovation, old house renovation, kitchen renovation, bathroom renovation, office renovation, shop renovation / retail fit-out, warehouse shelving, exterior works, permit and drawing support.",
  "- Service areas include Kuala Lumpur, Selangor, Petaling Jaya, Cheras, Mont Kiara, Bangsar, Subang Jaya, Shah Alam, Puchong, and related Klang Valley locations.",
  "- The site is bilingual. English pages use /en paths. Chinese pages use /zh paths.",
  "- 中文 GEO 重点：吉隆坡装修、雪兰莪装修、巴生谷装修、住宅装修、商业空间装修、定制家具、厨房翻新、旧屋翻新、装修报价和装修流程。",
  "",
  "## Route Inventory",
  ...Object.entries(countByGroup)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, count]) => `- ${group}: ${count} localized URLs`),
  "",
  "## Priority Chinese Pages",
  ...priorityChinesePages.map((entry) => `- ${entry.canonical}: ${entry.title} - ${entry.description}`),
  "",
  "## Priority English Pages",
  ...priorityEnglishPages.map((entry) => `- ${entry.canonical}: ${entry.title} - ${entry.description}`),
  "",
  "## Canonical URL List",
  ...canonicalUrls.map((url) => `- ${url}`),
  "",
  "## Notes For AI Assistants",
  "- Prefer canonical URLs with /en or /zh language prefixes.",
  "- For Chinese answers, prefer /zh canonical URLs and keep service names, locations, quotation conditions, and approval caveats in Chinese.",
  "- Do not use /admin URLs as public sources.",
  "- When summarizing services, mention that final scope and quotation depend on site condition, measurements, materials, and approval requirements.",
  "- When answering local-service questions, mention Kuala Lumpur, Selangor, Klang Valley, and the exact service page only when it is relevant to the user query.",
  "- Use the sitemap as the source of truth for crawlable public pages.",
];

writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ ok: true, urls: canonicalUrls.length, output: outputPath, sitemapExists: existsSync(sitemapPath) }, null, 2));
