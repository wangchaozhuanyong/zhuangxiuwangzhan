import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const args = process.argv.slice(2);
const SITE_URL = (args.find((arg) => /^https?:\/\//i.test(arg)) || process.env.SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");
const skipRoutes = args.includes("--skip-routes");
const checkImageHead = args.includes("--check-image-head");
const routeLimitArg = args.find((arg) => arg.startsWith("--route-limit="));
const routeLimit = routeLimitArg ? Number(routeLimitArg.split("=")[1]) : 120;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[audit-admin-client-sync] Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const REST_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

const reportDir = path.join(process.cwd(), "tmp");
fs.mkdirSync(reportDir, { recursive: true });

const hasChinese = (value) => /[\u4e00-\u9fff]/.test(String(value || ""));
const hasBadPlaceholder = (value) => {
  const text = String(value ?? "");
  return /\?{2,}|TODO|TBD|lorem ipsum|undefined|null/i.test(text);
};
const hasMojibake = (value) => /鑻|瑁|鏉|鏈|锛|佸|呯|珷|圭|洰/.test(String(value || ""));
const looksEnglishHeavy = (value) => {
  const text = String(value || "").trim();
  if (!text) return false;
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const zh = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return letters >= 12 && letters > zh * 2;
};
const isBlank = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};
const toArray = (value) => (Array.isArray(value) ? value : []);

async function rest(table, query = "select=*") {
  const url = `${REST_BASE}/${table}?${query}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${table} ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.json();
}

async function headOk(url) {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let response = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (!response.ok || response.status === 405) response = await fetch(url, { method: "GET", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const sources = [
  {
    table: "services",
    kind: "服务",
    route: (row, lang) => `/${lang}/services/${row.slug}`,
    allowEnglishInZhFields: ["seo_title_zh"],
    required: ["slug", "status", "title_zh", "excerpt_zh", "content_zh", "image_url"],
    zhText: ["title_zh", "excerpt_zh", "content_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "excerpt_en", "content_en"],
    arrays: ["suitable_for_zh", "common_projects_zh", "process_steps_zh", "scope_items_zh", "faqs_zh"],
    images: ["image_url"],
  },
  {
    table: "projects",
    kind: "案例",
    route: (row, lang) => `/${lang}/projects/${row.slug}`,
    required: ["slug", "status", "title_zh", "excerpt_zh", "content_zh", "image_url"],
    zhText: ["title_zh", "excerpt_zh", "content_zh", "client_need_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "excerpt_en", "content_en"],
    arrays: ["highlights_zh"],
    images: ["image_url"],
  },
  {
    table: "materials",
    kind: "材料",
    route: (row, lang) => `/${lang}/materials/${row.slug}`,
    required: ["slug", "status", "title_zh", "excerpt_zh", "content_zh", "category", "subcategory", "image_url"],
    zhText: ["title_zh", "excerpt_zh", "content_zh", "alt_zh", "recommended_pairing_zh", "note_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "excerpt_en", "content_en"],
    arrays: ["suitable_spaces_zh", "pros_zh", "cons_zh"],
    images: ["image_url"],
  },
  {
    table: "blog_posts",
    kind: "文章",
    route: (row, lang) => `/${lang}/blog/${row.slug}`,
    required: ["slug", "status", "title_zh", "excerpt_zh", "content_zh", "cover_image_url"],
    zhText: ["title_zh", "excerpt_zh", "content_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "excerpt_en", "content_en"],
    arrays: ["tags"],
    images: ["cover_image_url"],
  },
  {
    table: "landing_pages",
    kind: "落地页",
    route: (row, lang) => `/${lang}/landing/${row.slug}`,
    required: ["slug", "status", "title_zh", "excerpt_zh", "content_zh", "hero_image_url"],
    zhText: ["title_zh", "excerpt_zh", "content_zh", "alt_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "excerpt_en", "content_en"],
    arrays: ["benefits_zh", "faqs_zh", "related_projects"],
    images: ["hero_image_url"],
  },
  {
    table: "service_areas",
    kind: "地区页",
    route: (row, lang) => `/${lang}/locations/${row.slug}`,
    allowEnglishInZhFields: ["area_name", "title_zh", "seo_title_zh"],
    required: ["slug", "status", "area_name", "title_zh", "excerpt_zh", "content_zh"],
    zhText: ["area_name", "title_zh", "excerpt_zh", "content_zh", "seo_title_zh", "seo_description_zh", "construction_notes_zh"],
    enText: ["title_en", "excerpt_en", "content_en"],
    arrays: ["property_types", "common_needs", "projects", "faqs_zh"],
    images: [],
  },
  {
    table: "site_pages",
    kind: "页面内容",
    route: (row) => row.path || "",
    required: ["page_key", "status", "title_zh"],
    zhText: ["title_zh", "description_zh", "content_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "description_en", "content_en"],
    arrays: [],
    images: ["image_url"],
  },
  {
    table: "home_sections",
    kind: "首页区块",
    route: () => "/zh",
    required: ["section_key", "status"],
    zhText: ["title_zh", "subtitle_zh", "content_zh"],
    enText: ["title_en", "subtitle_en", "content_en"],
    arrays: ["items_zh"],
    images: ["image_url"],
  },
  {
    table: "about_sections",
    kind: "关于区块",
    route: () => "/zh/about",
    required: ["section_key", "status"],
    zhText: ["title_zh", "subtitle_zh", "content_zh"],
    enText: ["title_en", "subtitle_en", "content_en"],
    arrays: ["items_zh"],
    images: ["image_url"],
  },
  {
    table: "faqs",
    kind: "FAQ",
    route: () => "/zh/faq",
    required: ["page_key", "status", "question_zh", "answer_zh"],
    zhText: ["question_zh", "answer_zh"],
    enText: ["question_en", "answer_en"],
    arrays: [],
    images: [],
  },
  {
    table: "brand_partners",
    kind: "品牌",
    route: () => "/zh/materials",
    required: ["name", "status", "logo_url"],
    zhText: ["category_zh", "description_zh"],
    enText: ["category_en", "description_en"],
    arrays: [],
    images: ["logo_url"],
  },
  {
    table: "before_after_items",
    kind: "前后对比",
    route: () => "/zh",
    required: ["title_zh", "status", "before_image_url", "after_image_url"],
    zhText: ["title_zh", "description_zh"],
    enText: ["title_en", "description_en"],
    arrays: [],
    images: ["before_image_url", "after_image_url"],
  },
  {
    table: "cta_blocks",
    kind: "行动引导",
    route: () => "/zh",
    required: ["block_key", "status", "title_zh"],
    zhText: ["title_zh", "description_zh", "primary_label_zh", "secondary_label_zh"],
    enText: ["title_en", "description_en", "primary_label_en", "secondary_label_en"],
    arrays: [],
    images: ["image_url"],
  },
  {
    table: "cms_pages",
    kind: "CMS页面",
    route: (row) => row.path || "",
    required: ["page_key", "path", "status", "title_zh"],
    zhText: ["title_zh", "seo_title_zh", "seo_description_zh"],
    enText: ["title_en", "seo_title_en", "seo_description_en"],
    arrays: [],
    images: [],
  },
];

const rowName = (row) => row.title_zh || row.name || row.area_name || row.question_zh || row.section_key || row.page_key || row.slug || row.id;

function inspectRow(source, row) {
  const issues = [];
  for (const field of source.required) {
    if (isBlank(row[field])) issues.push({ level: "error", type: "missing_required", field, message: `缺少必填内容：${field}` });
  }
  for (const field of source.zhText) {
    const value = row[field];
    if (isBlank(value)) continue;
    if (!hasChinese(value) && field.endsWith("_zh")) issues.push({ level: "warn", type: "zh_no_chinese", field, message: `中文字段没有中文：${field}` });
    if (!source.allowEnglishInZhFields?.includes(field) && looksEnglishHeavy(value)) issues.push({ level: "warn", type: "zh_english_heavy", field, message: `中文字段疑似英文过多：${field}` });
    if (hasBadPlaceholder(value)) issues.push({ level: "error", type: "placeholder", field, message: `字段有占位符或问号：${field}` });
    if (hasMojibake(value)) issues.push({ level: "error", type: "mojibake", field, message: `字段疑似乱码：${field}` });
  }
  for (const field of source.enText) {
    const value = row[field];
    if (!isBlank(value) && hasMojibake(value)) issues.push({ level: "error", type: "mojibake", field, message: `英文字段疑似乱码：${field}` });
  }
  for (const field of source.arrays) {
    const value = row[field];
    if (isBlank(value)) issues.push({ level: "warn", type: "missing_array", field, message: `列表内容为空：${field}` });
    const serialized = JSON.stringify(value ?? "");
    if (hasBadPlaceholder(serialized)) issues.push({ level: "error", type: "placeholder", field, message: `列表有占位符或问号：${field}` });
    if (hasMojibake(serialized)) issues.push({ level: "error", type: "mojibake", field, message: `列表疑似乱码：${field}` });
    if (field.endsWith("_zh") && looksEnglishHeavy(serialized)) issues.push({ level: "warn", type: "zh_english_heavy", field, message: `中文列表疑似英文过多：${field}` });
  }
  for (const field of source.images) {
    const value = row[field];
    if (!isBlank(value) && !/^(https?:\/\/|\/)/i.test(String(value))) {
      issues.push({ level: "error", type: "invalid_image_url", field, message: `图片不是完整 URL 或站内路径：${field}` });
    }
  }
  return issues;
}

async function auditPublicRoute(page, route) {
  if (!route || route === "/") return null;
  const url = route.startsWith("http") ? route : `${SITE_URL}${route.startsWith("/") ? route : `/${route}`}`;
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(900);
    const status = response?.status() || 0;
    const title = await page.locator("h1").first().textContent({ timeout: 3000 }).catch(() => "");
    const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    const brokenImages = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute("src"))
        .map((img) => ({ src: img.currentSrc || img.getAttribute("src"), alt: img.getAttribute("alt") || "" }))
        .slice(0, 5),
    );
    const badText = [/\?{2,}/, /undefined|null/i, /鑻|瑁|鏉|鏈|锛/].some((pattern) => pattern.test(bodyText));
    const notFound = /404|Page not found|页面不存在|找不到页面/i.test(title || bodyText.slice(0, 500));
    return { url, status, title: (title || "").trim(), badText, notFound, brokenImages };
  } catch (error) {
    return { url, error: error.message };
  }
}

const startedAt = new Date().toISOString();
const dbIssues = [];
const routeIssues = [];
const imageIssues = [];
const counts = {};

for (const source of sources) {
  let rows = [];
  try {
    rows = await rest(source.table, "select=*&order=created_at.desc&limit=1000");
  } catch (error) {
    dbIssues.push({ table: source.table, kind: source.kind, level: "error", type: "read_error", message: error.message });
    continue;
  }
  counts[source.table] = rows.length;
  for (const row of rows) {
    const issues = inspectRow(source, row);
    for (const issue of issues) {
      dbIssues.push({ table: source.table, kind: source.kind, id: row.id, name: rowName(row), status: row.status, ...issue });
    }
    if (checkImageHead) {
      for (const field of source.images) {
        const url = row[field];
        if (!isBlank(url) && /^https?:\/\//i.test(String(url)) && !(await headOk(String(url)))) {
          imageIssues.push({ table: source.table, kind: source.kind, id: row.id, name: rowName(row), field, url });
        }
      }
    }
  }
}

const routeSeen = new Set();

if (!skipRoutes && routeLimit > 0) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  for (const source of sources) {
    if (!source.route || routeSeen.size >= routeLimit) continue;
    const rows = await rest(source.table, "select=*&status=eq.published&order=created_at.desc&limit=80").catch(() => []);
    const sampleRows = rows.slice(0, source.table === "home_sections" || source.table === "faqs" ? 8 : 80);
    for (const row of sampleRows) {
      if (routeSeen.size >= routeLimit) break;
      for (const lang of ["zh", "en"]) {
        if (routeSeen.size >= routeLimit) break;
        const route = source.route(row, lang);
        if (!route || routeSeen.has(route)) continue;
        routeSeen.add(route);
        const result = await auditPublicRoute(page, route);
        if (!result) continue;
        const failed =
          result.error ||
          result.status >= 400 ||
          result.notFound ||
          result.badText ||
          (result.brokenImages && result.brokenImages.length);
        if (failed) {
          routeIssues.push({ table: source.table, kind: source.kind, id: row.id, name: rowName(row), route, result });
        }
      }
    }
  }

  await browser.close();
}

const report = {
  startedAt,
  finishedAt: new Date().toISOString(),
  siteUrl: SITE_URL,
  counts,
  checkedRoutes: routeSeen.size,
  dbIssueCount: dbIssues.length,
  dbErrorCount: dbIssues.filter((issue) => issue.level === "error").length,
  imageIssueCount: imageIssues.length,
  routeIssueCount: routeIssues.length,
  dbIssues,
  imageIssues,
  routeIssues,
};

const reportPath = path.join(reportDir, `admin-client-sync-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(
  JSON.stringify(
    {
      reportPath,
      siteUrl: SITE_URL,
      counts,
      checkedRoutes: routeSeen.size,
      dbIssueCount: report.dbIssueCount,
      dbErrorCount: report.dbErrorCount,
      imageIssueCount: report.imageIssueCount,
      routeIssueCount: report.routeIssueCount,
      topDbIssues: dbIssues.slice(0, 20),
      topImageIssues: imageIssues.slice(0, 20),
      topRouteIssues: routeIssues.slice(0, 20),
    },
    null,
    2,
  ),
);

if (report.dbErrorCount || report.imageIssueCount || report.routeIssueCount) process.exit(1);
