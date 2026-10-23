// Shared by translation, admin saves, publishing and the offline content audit.
// Slugs identify records; only the language prefix is presentation data.
const origin = "https://flashcast.com.my";
const linkFields = /^(?:href|url|link|button_url|primary_url|secondary_url|website_url)$/i;
export const stableTranslationField = /^(?:id|slug|path|href|url|src|icon|image|sourceImages|images|sku|key|type|step|project_type|categoryKey|managedCategoryKey|managedSubcategoryKey|link|.+(?:_url|Url|Urls))$/;
const tagPattern = /<!--[\s\S]*?-->|<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi;
const hrefPattern = /\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const decode = value => value.replace(/&(?:amp|quot|apos|#39|#x[\da-f]+|#\d+);/gi, entity => {
  const named = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&#39;": "'" };
  if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
  const number = entity.match(/^&#(x[\da-f]+|\d+);$/i)?.[1];
  const code = number?.[0].toLowerCase() === "x" ? parseInt(number.slice(1), 16) : Number(number);
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
});

export function contentLinkUrl(href, language = "en", basePath = "/") {
  const raw = decode(String(href).trim());
  if (!raw || raw.startsWith("#") || /^(?:mailto|tel|sms):/i.test(raw)) return null;
  try {
    const url = new URL(raw, `${origin}/${language}${basePath === "/" ? "/" : basePath}`);
    if (!["http:", "https:"].includes(url.protocol) || !["flashcast.com.my", "www.flashcast.com.my"].includes(url.hostname)) return null;
    return url;
  } catch { return null; }
}

export function localizeContentLink(href, language) {
  const url = contentLinkUrl(href);
  if (!url || !/^\/(?:en|zh|ms)(?=\/|$)/.test(url.pathname)) return href;
  // Replace in the original string to retain entities, escaping, queries and fragments.
  return href.replace(/^(https?:\/\/(?:www\.)?flashcast\.com\.my)?\/(?:en|zh|ms)(?=\/|[?#]|$)/i,
    (_match, host = "") => `${host}/${language}`);
}

export function localizeHtmlLinks(html, language) {
  return html.replace(tagPattern, tag => /^<a\s/i.test(tag) ? tag.replace(hrefPattern,
    (attribute, double, single, bare) => {
      const href = double ?? single ?? bare;
      return attribute.replace(href, localizeContentLink(href, language));
    }) : tag);
}

export function collectContentLinks(value, options = {}) {
  const links = [];
  const visit = (child, field, language) => {
    if (Array.isArray(child)) return child.forEach((item, index) => visit(item, `${field}[${index}]`, language));
    if (child && typeof child === "object") return Object.entries(child).forEach(([key, item]) =>
      visit(item, field ? `${field}.${key}` : key, key.match(/_(en|zh|ms)$/)?.[1] || language));
    if (typeof child !== "string") return;
    let ignored = "";
    for (const match of child.matchAll(tagPattern)) {
      const tag = match[0];
      if (/^<!--/.test(tag)) continue;
      if (/^<\/(?:script|style)\b/i.test(tag)) { ignored = ""; continue; }
      if (/^<(?:script|style)\b/i.test(tag)) { ignored = tag; continue; }
      if (ignored || !/^<a\s/i.test(tag)) continue;
      const attr = tag.match(hrefPattern);
      if (attr) {
        const href = attr[1] ?? attr[2] ?? attr[3];
        const start = match.index + attr.index + attr[0].lastIndexOf(href);
        links.push({ field, language, href, start, end: start + href.length });
      }
    }
    if (linkFields.test(field.split(".").at(-1) || "")) links.push({ field, language, href: child, start: 0, end: child.length });
  };
  visit(value, options.field || "", options.language);
  return links;
}

const staticPaths = new Set(["/", "/about", "/services", "/services/old-house", "/materials", "/products",
  "/furniture", "/promotions", "/projects", "/before-after", "/process", "/faq", "/contact", "/quote",
  "/blog", "/locations", "/privacy", "/terms"]);
const detailTables = { services: "services", blog: "blog_posts", projects: "projects", materials: "materials",
  locations: "service_areas", landing: "landing_pages" };

export const linkedContentTables = new Set(["services", "blog_posts", "projects", "materials", "service_areas", "landing_pages",
  "site_pages", "cms_pages", "cms_sections", "cms_content_entries", "home_sections", "about_sections", "faqs",
  "cta_blocks", "hero_slides", "process_steps", "before_after_items", "brand_partners"]);

export function pendingContentPaths(table, record) {
  if (record.status !== "published") return [];
  const prefix = Object.keys(detailTables).find(key => detailTables[key] === table);
  if (table === "materials" && record.category === "furniture" && typeof record.slug === "string") return [`/furniture/product/${record.slug}`];
  if (prefix && typeof record.slug === "string") return [`/${prefix}/${record.slug}`];
  if (["cms_pages", "site_pages"].includes(table) && typeof record.path === "string") return [record.path];
  return [];
}

export function contentLinkTarget(href, language, basePath) {
  const url = contentLinkUrl(href, language, basePath);
  if (!url) return null;
  const path = url.pathname.replace(/\/$/, "") || "/";
  const locale = path.match(/^\/(en|zh|ms)(?=\/|$)/)?.[1];
  const canonicalPath = (path.replace(/^\/(?:en|zh|ms)(?=\/|$)/, "") || "/").replace(/^\/products\//, "/materials/");
  if (/^\/(?:images|assets|storage|videos|fonts)\//.test(canonicalPath) || /\.[a-z0-9]+$/i.test(canonicalPath)) return null;
  const match = canonicalPath.match(/^\/(services|blog|projects|materials|locations|landing)\/([^/]+)$/);
  const furniture = canonicalPath.match(/^\/furniture\/product\/([^/]+)$/);
  const materialCategory = /^\/materials\/category\/[^/]+(?:\/[^/]+)?$/.test(canonicalPath);
  const furnitureCategory = !furniture && /^\/furniture\/[^/]+(?:\/[^/]+)?$/.test(canonicalPath);
  return { path, canonicalPath, language: locale, static: staticPaths.has(canonicalPath),
    table: match ? detailTables[match[1]] : furniture ? "materials" : "cms_pages",
    key: materialCategory ? "material_category" : furnitureCategory ? "furniture_category" : furniture ? "furniture_product" : match ? "slug" : "path",
    value: match ? decodeURIComponent(match[2]) : furniture ? decodeURIComponent(furniture[1]) : canonicalPath };
}

export async function validateContentLinks(value, resolve, options = {}) {
  const cache = new Map();
  const issues = [];
  for (const link of collectContentLinks(value, options)) {
    let target;
    try { target = contentLinkTarget(link.href, link.language, options.basePath); }
    catch { issues.push({ ...link, reason: "invalid_url" }); continue; }
    if (!target) continue;
    if (link.language && target.language && target.language !== link.language) {
      issues.push({ ...link, reason: "wrong_language" });
      continue;
    }
    if (target.static || options.pendingPaths?.includes(target.canonicalPath)) continue;
    const key = `${target.table}:${target.value}`;
    if (!cache.has(key)) cache.set(key, Promise.resolve(resolve(target)));
    if (!await cache.get(key)) issues.push({ ...link, reason: "missing_published_target" });
  }
  return issues;
}
