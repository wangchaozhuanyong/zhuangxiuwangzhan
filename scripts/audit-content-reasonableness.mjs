import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const SITE_URL = (process.argv.find((arg) => /^https?:\/\//i.test(arg)) || process.env.SITE_URL || "https://flashcast.com.my").replace(/\/$/, "");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[audit-content-reasonableness] Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const REST_BASE = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

const tables = [
  "services",
  "projects",
  "materials",
  "blog_posts",
  "landing_pages",
  "service_areas",
  "site_pages",
  "home_sections",
  "about_sections",
  "faqs",
  "brand_partners",
  "before_after_items",
  "cta_blocks",
  "cms_pages",
];

const genericPatterns = [
  /的服务范围、施工重点和报价建议/,
  /服务，包含现场评估、材料建议、施工范围、预算规划和免费报价/,
  /Scope and quotation are confirmed/i,
  /Quote by size/i,
  /material only/i,
  /coming soon|lorem ipsum|TODO|TBD/i,
];

const importantTextFields = [
  "title_zh",
  "excerpt_zh",
  "content_zh",
  "client_need_zh",
  "seo_title_zh",
  "seo_description_zh",
  "title_en",
  "excerpt_en",
  "content_en",
  "seo_title_en",
  "seo_description_en",
  "description_zh",
  "description_en",
  "question_zh",
  "answer_zh",
];

const arrayExpectation = {
  services: ["suitable_for_zh", "common_projects_zh", "process_steps_zh", "scope_items_zh", "faqs_zh"],
  projects: ["highlights_zh"],
  materials: ["suitable_spaces_zh", "pros_zh", "cons_zh"],
  landing_pages: ["benefits_zh", "faqs_zh", "related_projects"],
  service_areas: ["property_types", "common_needs", "projects", "faqs_zh"],
};

function rowName(row) {
  return row.title_zh || row.title_en || row.name || row.area_name || row.question_zh || row.section_key || row.page_key || row.slug || row.id;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUrl(value) {
  if (!value || typeof value !== "string") return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return null;
}

async function rest(table) {
  const response = await fetch(`${REST_BASE}/${table}?select=*&order=created_at.desc&limit=1000`, { headers });
  if (!response.ok) {
    throw new Error(`${table} ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

async function urlOk(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const cleanUrl = url.replace(/\?.*$/, "");
    let response = await fetch(cleanUrl, { method: "HEAD", signal: controller.signal });
    if (!response.ok || response.status === 405) response = await fetch(cleanUrl, { method: "GET", signal: controller.signal });
    return response.ok && response.headers.get("content-type")?.startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function collectImageRefs(value, refs = [], trail = []) {
  if (!value || typeof value !== "object") return refs;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImageRefs(item, refs, [...trail, index]));
    return refs;
  }
  for (const [key, child] of Object.entries(value)) {
    const keyLooksLikeImage = /(^image$|image_url|_image_url$|cover|logo|before_image_url|after_image_url)/i.test(key);
    if (keyLooksLikeImage && typeof child === "string" && child.trim()) {
      refs.push({ fieldPath: [...trail, key].join("."), value: child });
    }
    collectImageRefs(child, refs, [...trail, key]);
  }
  return refs;
}

function textValueIssues(table, row) {
  const issues = [];
  for (const field of importantTextFields) {
    const value = row[field];
    if (typeof value !== "string" || !value.trim()) continue;
    for (const pattern of genericPatterns) {
      if (pattern.test(value)) {
        issues.push({ severity: "review", type: "generic_copy", table, id: row.id, name: rowName(row), field, value });
        break;
      }
    }
    if (/content_zh|content_en|answer_zh|answer_en/.test(field) && value.trim().length < 45) {
      issues.push({ severity: "review", type: "thin_text", table, id: row.id, name: rowName(row), field, value });
    }
  }
  return issues;
}

function arrayIssues(table, row) {
  const issues = [];
  for (const field of arrayExpectation[table] || []) {
    const value = row[field];
    if (!Array.isArray(value) || value.length === 0) {
      issues.push({ severity: "review", type: "empty_module", table, id: row.id, name: rowName(row), field });
      continue;
    }
    if (["related_projects", "projects"].includes(field)) {
      const missingImages = value.filter((item) => item && typeof item === "object" && !normalizeUrl(item.image || item.image_url));
      const missingTitles = value.filter((item) => item && typeof item === "object" && !(item.title || item.title_zh || item.title_en || item.name));
      if (missingImages.length) issues.push({ severity: "review", type: "module_missing_image", table, id: row.id, name: rowName(row), field, count: missingImages.length });
      if (missingTitles.length) issues.push({ severity: "review", type: "module_missing_title", table, id: row.id, name: rowName(row), field, count: missingTitles.length });
    }
  }
  return issues;
}

const rowsByTable = {};
const issues = [];
const imageRefs = [];
const textIndex = new Map();

for (const table of tables) {
  const rows = await rest(table);
  rowsByTable[table] = rows;
  for (const row of rows) {
    issues.push(...textValueIssues(table, row));
    issues.push(...arrayIssues(table, row));
    for (const ref of collectImageRefs(row)) {
      const url = normalizeUrl(ref.value);
      if (url) imageRefs.push({ table, id: row.id, name: rowName(row), fieldPath: ref.fieldPath, value: ref.value, url });
    }
    for (const field of importantTextFields) {
      const value = typeof row[field] === "string" ? row[field].trim().replace(/\s+/g, " ") : "";
      if (value.length < 34) continue;
      const key = `${field}:${value}`;
      const list = textIndex.get(key) || [];
      list.push({ table, id: row.id, name: rowName(row), field, value });
      textIndex.set(key, list);
    }
  }
}

for (const [key, rows] of textIndex.entries()) {
  if (rows.length >= 4) {
    const [field, value] = key.split(/:(.*)/s);
    issues.push({
      severity: "review",
      type: "duplicate_copy",
      field,
      value,
      count: rows.length,
      rows: rows.map(({ table, id, name }) => ({ table, id, name })).slice(0, 12),
    });
  }
}

const uniqueImages = new Map();
for (const ref of imageRefs) {
  if (!uniqueImages.has(ref.url)) uniqueImages.set(ref.url, []);
  uniqueImages.get(ref.url).push(ref);
}

const brokenImages = [];
for (const [url, refs] of uniqueImages.entries()) {
  if (!(await urlOk(url))) {
    brokenImages.push({ url, references: refs.slice(0, 12), referenceCount: refs.length });
  }
}

const counts = Object.fromEntries(Object.entries(rowsByTable).map(([table, rows]) => [table, rows.length]));
const report = {
  siteUrl: SITE_URL,
  generatedAt: new Date().toISOString(),
  counts,
  issueCount: issues.length,
  brokenImageCount: brokenImages.length,
  issues,
  brokenImages,
};

const reportDir = path.join(process.cwd(), "tmp");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, `content-reasonableness-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

const byType = issues.reduce((acc, item) => {
  acc[item.type] = (acc[item.type] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({ reportPath, counts, issueCount: issues.length, byType, brokenImageCount: brokenImages.length, topIssues: issues.slice(0, 30), brokenImages }, null, 2));

if (brokenImages.length) process.exitCode = 1;
