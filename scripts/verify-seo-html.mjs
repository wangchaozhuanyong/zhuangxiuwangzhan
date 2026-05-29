/**
 * Fetch key URLs and assert raw HTML contains expected SEO tags (no JS).
 */
const BASE = (process.env.PREVIEW_URL || process.env.SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");

const paths = [
  "/zh",
  "/en",
  "/zh/services",
  "/en/projects",
  "/zh/materials",
  "/zh/contact",
  "/zh/quote",
  "/zh/blog",
];

const failures = [];

for (const path of paths) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: { "user-agent": "flashcast-seo-verify" } });
  const html = await res.text();
  const lang = path.startsWith("/zh") ? "zh" : "en";
  const expectedLang = lang === "zh" ? 'lang="zh-CN"' : 'lang="en"';

  if (!res.ok) failures.push(`${path}: HTTP ${res.status}`);
  if (!html.includes("<title")) failures.push(`${path}: missing <title>`);
  if (!html.includes('name="description"')) failures.push(`${path}: missing description`);
  if (!html.includes('rel="canonical"')) failures.push(`${path}: missing canonical`);
  if (!html.includes('hreflang="en"') || !html.includes('hreflang="zh-CN"')) failures.push(`${path}: missing hreflang`);
  if (!html.includes(expectedLang)) failures.push(`${path}: expected ${expectedLang} on <html>`);
  if (!html.includes('property="og:title"')) failures.push(`${path}: missing og:title`);
}

if (failures.length) {
  console.error("[verify-seo-html] failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: paths.length, base: BASE }, null, 2));
