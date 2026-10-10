import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory } from "../src/i18n/displayLabels";
import { getServiceContextLinks } from "../src/i18n/serviceContextLinks";
import { getMaterialSubcategoryGuidance } from "../src/i18n/materialSubcategoryGuidance";
import { servicesPageText } from "../src/i18n/servicesPageText";
import { materialCategoryPageText } from "../src/i18n/materialCategoryPageText";
import { materialSubcategoryPageText } from "../src/i18n/materialSubcategoryPageText";
import { isServiceConceptImage } from "../src/lib/serviceMedia";
import { quotePageText } from "../src/i18n/quotePageText";
import { furnitureCategoryName, furnitureCategoryPageCopy, furnitureSubcategoryName, furnitureText } from "../src/i18n/furnitureText";
import { furnitureListingPagePath, furnitureProductPath, localizeFurnitureProduct, type getFurnitureListingPage } from "../src/lib/furnitureCatalogPresentation";
import { findSelangorWarehouseIntroLink } from "../src/lib/selangorWarehouseIntroLink";
import { plainTextParagraphs } from "../src/lib/text";
// Same public content for every user agent; this fallback is rendered only without JS.
export const readableBodyPaths = ["/services/builtin", "/blog/renovation-materials-malaysia", "/projects/bangsar-walk-in-wardrobe-system", "/blog/small-condo-storage-design-ideas"] as const;
const allowedTags = new Set(["p", "h2", "h3", "h4", "strong", "em", "b", "i", "br", "ul", "ol", "li", "a", "blockquote"]);
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const decode = (s: string) => s.replace(/&#(x[\da-f]+|\d+);?|&(amp|lt|gt|quot|apos|colon|Tab|NewLine);/gi, (m, n: string, name: string) => {
  if (n) {
    const code = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  }
  return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", colon: ":", tab: "\t", newline: "\n" } as Record<string, string>)[name.toLowerCase()] || m;
});
const text = (v: unknown) => typeof v === "string" ? v : "";
export function buildReadableHomeFaqBody(key: string, faqs: readonly { question: string; answer: string }[], summary?: { title: string; description: string }) {
  if (!/^\/(en|zh)$/.test(key) || !faqs.length) return "";
  const lang = key === "/zh" ? "zh-CN" : "en";
  const title = lang === "en" ? "Frequently asked questions" : "常见问题";
  const overview = summary ? `<h1>${escape(summary.title)}</h1><p>${escape(summary.description)}</p>` : "";
  return `<main lang="${lang}">${overview}<section data-flashcast-readable-home-faq><h2>${title}</h2>${faqs.map(faq => `<h3>${escape(faq.question)}</h3><p>${escape(faq.answer)}</p>`).join("")}</section></main>`;
}
const plain = (v: unknown) => decode(text(v).replace(/<[^>]*>/g, "")).trim();

export function buildReadableFurnitureListingBody(key: string, listing: ReturnType<typeof getFurnitureListingPage> | null) {
  if (!listing?.validSelection || !listing.category) return "";
  const lang = key.startsWith("/zh/") ? "zh" : "en";
  const copy = furnitureText[lang];
  const categoryCopy = furnitureCategoryPageCopy(listing.category.key, lang, listing.subcategory?.key);
  const title = categoryCopy?.h1 || (listing.subcategory
    ? furnitureSubcategoryName(listing.subcategory.key, lang, listing.subcategory.name)
    : listing.category.key === "new" ? copy.title : furnitureCategoryName(listing.category.key, lang));
  const pageHref = (page: number) => `/${lang}${furnitureListingPagePath(listing.currentPath, page)}`;
  const cards = listing.visibleProducts.map((source) => {
    const product = localizeFurnitureProduct(source, lang);
    const description = (product.shortDescription || product.description || copy.listingDescriptionUnavailable).replace(/\s+/g, " ");
    return `<li><h2><a href="${escape(`/${lang}${furnitureProductPath(product)}`)}">${escape(product.name)}</a></h2><p>${escape(description)}</p><p>${escape(product.price || copy.priceOnRequest)}</p></li>`;
  }).join("");
  const label = copy.page.replace("{page}", String(listing.page)).replace("{total}", String(listing.totalPages));
  const navigation = listing.totalPages > 1
    ? `<nav aria-label="${escape(label)}"><a href="${escape(pageHref(1))}">${escape(copy.allProducts)}</a>${listing.page > 1 ? `<a href="${escape(pageHref(listing.page - 1))}">${escape(copy.previous)}</a>` : ""}<span>${escape(label)}</span>${listing.page < listing.totalPages ? `<a href="${escape(pageHref(listing.page + 1))}">${escape(copy.next)}</a>` : ""}</nav>` : "";
  return `<section data-flashcast-readable-furniture-listing lang="${lang === "zh" ? "zh-CN" : "en"}"><h1>${escape(title)}</h1><p>${escape(categoryCopy?.intro || copy.intro)}</p>${cards ? `<ul>${cards}</ul>` : `<p>${escape(copy.noProducts)}</p>`}${navigation}</section>`;
}

function publicHref(raw: string, lang: "en" | "zh") {
  const href = decode(raw).trim();
  if (!href || Array.from(href).some(char => char.charCodeAt(0) <= 32 || char === "\\") || href.startsWith("//")) return null;
  try {
    const url = new URL(href, "https://flashcast.com.my");
    if (url.protocol !== "https:" || url.origin !== "https://flashcast.com.my" || url.username || url.password) return null;
    if (url.pathname !== `/${lang}` && !url.pathname.startsWith(`/${lang}/`)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return null; }
}

// Renderer-owned copy, shared with the quote page; no CMS or form data.
export function buildQuotePreparationBody(key: string) {
  const match = key.match(/^\/(en|zh)\/quote$/);
  if (!match) return "";
  const lang = match[1] as "en" | "zh";
  const copy = quotePageText[lang].preparation;
  const href = publicHref(`/${lang}/blog/renovation-quotation-checklist-malaysia`, lang);
  if (!href) return "";
  return `<section data-flashcast-quote-preparation lang="${lang === "zh" ? "zh-CN" : "en"}" aria-labelledby="quote-preparation-fallback-title"><h3 id="quote-preparation-fallback-title">${escape(copy.heading)}</h3><p>${escape(copy.paragraphOne)}</p><p>${escape(copy.paragraphTwoBeforeLink)}<a href="${escape(href)}">${escape(copy.linkText)}</a>${escape(copy.paragraphTwoAfterLink)}</p></section>`;
}

export function sanitizeReadableContent(value: string, lang: "en" | "zh") {
  const source = value.replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(/<(script|style|iframe|object|svg|math|form)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, "");
  if (!/<[a-z][^>]*>/i.test(source)) {
    return source.split(/\n\s*\n/).filter(s => s.trim()).map(s => `<p>${escape(decode(s.trim()))}</p>`).join("");
  }
  return (source.match(/<[^>]*>|[^<]+|</g) || []).map(token => {
    if (!token.startsWith("<") || token === "<") return escape(decode(token));
    const match = token.match(/^<(\/?)([a-z][\w-]*)\b[^>]*>$/i);
    if (!match || !allowedTags.has(match[2].toLowerCase())) return "";
    const tag = match[2].toLowerCase();
    if (match[1]) return tag === "br" ? "" : `</${tag}>`;
    if (tag !== "a") return `<${tag}>`;
    const attr = token.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = attr ? publicHref(attr[1] ?? attr[2] ?? attr[3], lang) : null;
    return href ? `<a href="${escape(href)}">` : "<a>";
  }).join("");
}

const headings = {
  en: { suitable: "Suitable for", scope: "Scope", common: "Common projects", process: "Process", faq: "Frequently asked questions", highlights: "Design highlights", materials: "Material direction", label: "Design rendering" },
  zh: { suitable: "适用需求", scope: "范围", common: "常见项目", process: "流程", faq: "常见问题", highlights: "设计重点", materials: "材料方向", label: "设计效果图" },
};

type ReadableContactIdentity = { phone_e164?: unknown; email?: unknown };

// Only the four reviewed routes receive a structural CTA. CMS sanitization stays unchanged.
function buildReviewedCta(path: string, lang: "en" | "zh", identity?: ReadableContactIdentity | null) {
  if (path !== "/blog/renovation-materials-malaysia" && path !== "/projects/bangsar-walk-in-wardrobe-system") return "";
  const heading = lang === "zh"
    ? (path.startsWith("/blog/") ? "咨询装修材料需求" : "咨询类似衣帽间需求")
    : (path.startsWith("/blog/") ? "Discuss your material requirements" : "Discuss a similar wardrobe requirement");
  const quote = lang === "zh" ? "提交报价需求" : "Request a quotation";
  const contact = lang === "zh" ? "联系 FLASH CAST" : "Contact FLASH CAST";
  const links: string[] = [];
  if (identity?.phone_e164 === "+601128853888") links.push('<a href="tel:+601128853888">+60 11-2885 3888</a>');
  if (identity?.email === "support@flashcast.com.my") links.push('<a href="mailto:support@flashcast.com.my">support@flashcast.com.my</a>');
  return `<section data-flashcast-reviewed-cta aria-label="${heading}"><h2>${heading}</h2><p><a href="/${lang}/quote#quote-form">${quote}</a> · <a href="/${lang}/contact">${contact}</a></p>${links.length ? `<p>${links.join(" · ")}</p>` : ""}</section>`;
}

export function buildReadablePublicBody(key: string, row: Record<string, unknown> | null | undefined, identity?: ReadableContactIdentity | null) {
  const match = key.match(/^\/(en|zh)(\/.*)$/);
  const reviewedOffice = key === "/en/services/office-renovation";
  const reviewedSelangor = match?.[2] === "/locations/selangor";
  if (!match || (!reviewedOffice && !reviewedSelangor && !readableBodyPaths.some(path => path === match[2])) || row?.status !== "published") return "";
  const lang = match[1] as "en" | "zh";
  const path = match[2];
  if (row.slug !== path.split("/").pop()) return "";
  const field = (base: string) => row[`${base}_${lang}`];
  const title = plain(field("title"));
  if (reviewedSelangor) {
    const intro = text(field("content"));
    if (!title || !intro.trim() || intro.length > 131072) return "";
    const paragraphs = plainTextParagraphs(translateDisplayText(intro, lang));
    const link = findSelangorWarehouseIntroLink(paragraphs, text(row.slug), lang);
    if (!link) return "";
    const summary = plain(field("seo_description")) || plain(field("excerpt"));
    const body = `<h1>${escape(translateDisplayText(title, lang))}</h1>${summary ? `<p>${escape(translateDisplayText(summary, lang))}</p>` : ""}${paragraphs.map((paragraph, index) =>
      `<p>${link.paragraphIndex === index
        ? `${escape(link.before)}<a href="/${lang}${link.to}">${escape(link.anchor)}</a>${escape(link.after)}`
        : escape(paragraph)}</p>`
    ).join("")}`;
    return body.length <= 262144 ? `<main data-flashcast-readable-body lang="${lang === "zh" ? "zh-CN" : "en"}">${body}</main>` : "";
  }
  const content = text(field("content"));
  // A missing language/body is an input gap; do not claim a complete fallback from a summary.
  if (!title || !content.trim() || content.length > 131072) return "";
  const labels = headings[lang];
  const list = (name: string, value: unknown) => Array.isArray(value) && value.length
    ? `<section><h2>${escape(name)}</h2><ul>${value.filter(x => typeof x === "string" && x.trim()).map(x => `<li>${escape(translateDisplayText(plain(x), lang))}</li>`).join("")}</ul></section>` : "";
  let body = `<h1>${escape(title)}</h1>`;
  if (path.startsWith("/projects/") || (path.startsWith("/services/") && isServiceConceptImage(plain(field("alt"))))) body += `<p>${labels.label}</p>`;
  if (plain(field("excerpt"))) body += `<p>${escape(plain(field("excerpt")))}</p>`;
  body += sanitizeReadableContent(content, lang);
  if (path.startsWith("/services/")) {
    body += list(labels.suitable, field("suitable_for")) + list(labels.scope, field("scope_items")) + list(labels.common, field("common_projects"));
    const steps = field("process_steps");
    if (Array.isArray(steps) && steps.length) body += `<section><h2>${labels.process}</h2><ol>${steps.filter(x => x && typeof x === "object").map(x => `<li><h3>${escape(plain(x.title))}</h3><p>${escape(plain(x.desc))}</p></li>`).join("")}</ol></section>`;
    const faqs = field("faqs");
    if (Array.isArray(faqs) && faqs.length) body += `<section><h2>${labels.faq}</h2>${faqs.filter(x => x && typeof x === "object").map(x => `<h3>${escape(plain(x.q || x.question))}</h3><p>${escape(plain(x.a || x.answer))}</p>`).join("")}</section>`;
  } else if (path.startsWith("/projects/")) {
    body += list(labels.highlights, field("highlights")) + list(labels.scope, row.scope) + list(labels.materials, row.materials);
  }
  if (reviewedOffice) {
    body += buildContextLinks(getServiceContextLinks("office-renovation", lang), lang);
  }
  body += buildReviewedCta(path, lang, identity);
  if (body.length > 262144) return "";
  return `<main data-flashcast-readable-body lang="${lang === "zh" ? "zh-CN" : "en"}">${body}</main>`;
}

type PublicRow = Record<string, unknown>;
type ReadableCollectionSources = { services?: PublicRow[] | null; materials?: PublicRow[] | null; servicePage?: PublicRow | null };

// Four reviewed material URLs, not a global SSR or static fallback expansion.
export const isReviewedMaterialBodyPath = (key: string) =>
  /^\/(en|zh)\/materials\/category\/whole-house-custom(?:\/solid-wood-finish)?$/.test(key);

const slug = (value: unknown) => {
  const result = plain(value);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result) ? result : "";
};
const taxonomySlug = (value: unknown) => plain(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const paragraph = (value: string) => value ? `<p>${escape(value)}</p>` : "";
const localizedPlain = (row: PublicRow, field: string, lang: "en" | "zh") => plain(row[`${field}_${lang}`]);
const localizedParagraph = (row: PublicRow, field: string, lang: "en" | "zh") => paragraph(translateDisplayText(localizedPlain(row, field, lang), lang));
const wrapBody = (body: string, lang: "en" | "zh") => body.length <= 262144
  ? `<main data-flashcast-readable-body lang="${lang === "zh" ? "zh-CN" : "en"}">${body}</main>` : "";

function buildContextLinks(links: readonly { href: string; title: string; description: string }[], lang: "en" | "zh") {
  return `<section>${links.map(link => {
    const href = publicHref(`/${lang}${link.href}`, lang);
    return href ? `<h3><a href="${escape(href)}">${escape(link.title)}</a></h3>${paragraph(link.description)}` : "";
  }).join("")}</section>`;
}

export function buildReadableCollectionBody(key: string, sources: ReadableCollectionSources) {
  if (key === "/en/services") {
    const rows = sources.services?.filter(row => row.status === "published" && slug(row.slug) && localizedPlain(row, "title", "en")) || [];
    if (!rows.length) return "";
    const copy = servicesPageText.en;
    const page = sources.servicePage?.status === "published" && sources.servicePage.path === "/services" ? sources.servicePage : null;
    const title = page ? localizedPlain(page, "title", "en") || copy.title : copy.title;
    const description = page ? localizedPlain(page, "description", "en") || copy.intro : copy.intro;
    return wrapBody(`<h1>${escape(title)}</h1>${paragraph(description)}<section>${rows.map(row =>
      `<h2><a href="/en/services/${slug(row.slug)}">${escape(localizedPlain(row, "title", "en"))}</a></h2>${localizedParagraph(row, "excerpt", "en")}`
    ).join("")}</section>`, "en");
  }
  const match = key.match(/^\/(en|zh)\/materials\/category\/whole-house-custom(\/solid-wood-finish)?$/);
  if (!match) return "";
  const lang = match[1] as "en" | "zh";
  const rows = sources.materials?.filter(row => row.status === "published" && taxonomySlug(row.category) === "whole-house-custom" && slug(row.slug)) || [];
  if (!rows.length) return "";
  const categoryName = translateMaterialCategory(plain(rows[0].category), lang);
  const subcategoryRows = match[2] ? rows.filter(row => taxonomySlug(row.subcategory) === "solid-wood-finish") : rows;
  if (!subcategoryRows.length) return "";
  const source = subcategoryRows[0];
  const name = match[2] ? translateMaterialSubcategory(plain(source.subcategory), lang) : categoryName;
  let body = `<h1>${escape(name)}</h1>${localizedParagraph(source, "excerpt", lang)}`;
  if (match[2]) {
    // Reuse the currently visible selection guidance. Pending V14 answers are not a public source.
    const guidance = getMaterialSubcategoryGuidance("whole-house-custom", categoryName, name, lang);
    body += `<section><h2>${escape(guidance.checklistTitle)}</h2>${paragraph(guidance.checklistDescription)}<ol>${guidance.checklist.map(item =>
      `<li><h3>${escape(item.title)}</h3>${paragraph(item.description)}</li>`
    ).join("")}</ol></section><section><h2>${escape(materialSubcategoryPageText[lang].products(name))}</h2>`;
  } else {
    const subcategories = new Map<string, PublicRow>();
    rows.forEach(row => { const sub = taxonomySlug(row.subcategory); if (sub && !subcategories.has(sub)) subcategories.set(sub, row); });
    body += `<section><h2>${escape(materialCategoryPageText[lang].browseSubcategories)}</h2>${Array.from(subcategories, ([sub, row]) =>
      `<h3><a href="/${lang}/materials/category/whole-house-custom/${sub}">${escape(translateMaterialSubcategory(plain(row.subcategory), lang))}</a></h3>${localizedParagraph(row, "excerpt", lang)}`
    ).join("")}</section><section><h2>${escape(materialCategoryPageText[lang].allProducts(name))}</h2>`;
  }
  body += subcategoryRows.filter(row => localizedPlain(row, "title", lang)).map(row =>
    `<h3><a href="/${lang}/materials/${slug(row.slug)}">${escape(translateDisplayText(localizedPlain(row, "title", lang), lang))}</a></h3>`
  ).join("") + "</section>";
  if (match[2]) {
    const guidance = getMaterialSubcategoryGuidance("whole-house-custom", categoryName, name, lang);
    body += `<h2>${escape(guidance.relatedTitle)}</h2>${paragraph(guidance.relatedDescription)}${buildContextLinks(guidance.relatedLinks, lang)}`;
  }
  return wrapBody(body, lang);
}
