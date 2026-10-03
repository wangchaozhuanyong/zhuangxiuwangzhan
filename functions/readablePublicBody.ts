import { translateDisplayText } from "../src/i18n/displayLabels";
import { isServiceConceptImage } from "../src/lib/serviceMedia";
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
  if (!match || !readableBodyPaths.some(path => path === match[2]) || row?.status !== "published") return "";
  const lang = match[1] as "en" | "zh";
  const path = match[2];
  if (row.slug !== path.split("/").pop()) return "";
  const field = (base: string) => row[`${base}_${lang}`];
  const title = plain(field("title"));
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
  body += buildReviewedCta(path, lang, identity);
  if (body.length > 262144) return "";
  return `<main data-flashcast-readable-body lang="${lang === "zh" ? "zh-CN" : "en"}">${body}</main>`;
}
