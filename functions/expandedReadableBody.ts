import { readableBodyPaths, sanitizeReadableContent } from "./readablePublicBody";
import { oldHouseRenovationPageText } from "../src/i18n/oldHouseRenovationPageText";
import { processPageText } from "../src/i18n/processPageText";
import { designServicePageText } from "../src/i18n/designServicePageText";
import { surfaceRepairPageText } from "../src/i18n/surfaceRepairPageText";
import { servicesPageText } from "../src/i18n/servicesPageText";
import { projectsPageText } from "../src/i18n/projectsPageText";
import { materialsPageText } from "../src/i18n/materialsPageText";
import { blogPageText } from "../src/i18n/blogPageText";
import { serviceDetailPageText } from "../src/i18n/serviceDetailPageText";
import { materialDetailPageText } from "../src/i18n/materialDetailPageText";
import { projectDetailPageText } from "../src/i18n/projectDetailPageText";
import { mediaLabels } from "../src/i18n/mediaLabels";
import { getServiceContextLinks } from "../src/i18n/serviceContextLinks";
import { translateDisplayText, translateMaterialCategory, translateMaterialSubcategory, translateProjectScopedLabel, translateSpaceLabel } from "../src/i18n/displayLabels";
import { getMaterialSubcategoryGuidance } from "../src/i18n/materialSubcategoryGuidance";
import { mapPublicServiceFaqs } from "../src/lib/publicServiceFaqs";
import { isRenderingConceptProject } from "../src/lib/projectContentClassification";
import { stripHtml } from "../src/lib/text";

type Row = Record<string, unknown>;
type Lang = "en" | "zh";
type Sources = { row?: Row | null; services?: Row[] | null; materials?: Row[] | null; projects?: Row[] | null; blogPosts?: Row[] | null; processSteps?: Row[] | null };
const text = (value: unknown) => typeof value === "string" ? value : "";
const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const plain = (value: unknown, lang: Lang) => stripHtml(translateDisplayText(text(value), lang));
const paragraph = (value: string) => value ? `<p>${escape(value)}</p>` : "";
const heading = (value: string) => value ? `<h2>${escape(value)}</h2>` : "";
const taxonomy = (value: unknown) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const safeSlug = (value: unknown) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text(value)) ? text(value) : "";
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const records = (value: unknown): Row[] => Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const list = (label: string, values: string[]) => values.length ? `${heading(label)}<ul>${values.map(value => `<li>${escape(value)}</li>`).join("")}</ul>` : "";
const faqs = (label: string, values: { question: string; answer: string }[]) => values.length
  ? `${heading(label)}${values.map(value => `<h3>${escape(value.question)}</h3>${paragraph(value.answer)}`).join("")}` : "";
const link = (path: string, label: string, lang: Lang) => `<a href="/${lang}${escape(path)}">${escape(label)}</a>`;
const navigation = (lang: Lang) => `<nav>${[
  link("/services", servicesPageText[lang].title, lang), link("/projects", projectsPageText[lang].title, lang),
  link("/materials", materialsPageText[lang].title, lang), link("/blog", blogPageText[lang].title, lang),
].join(" · ")}</nav>`;
const wrap = (body: string, lang: Lang) => body && body.length <= 262144
  ? `<main data-flashcast-readable-body lang="${lang === "zh" ? "zh-CN" : "en"}">${body}${navigation(lang)}</main>` : "";

function oldHouseBody(row: Row | null | undefined, lang: Lang) {
  const copy = oldHouseRenovationPageText[lang];
  const faqItems = mapPublicServiceFaqs(row?.status === "published" ? row[`faqs_${lang}`] : copy.faqs);
  let body = `<h1>${escape(copy.title)}</h1>${paragraph(mediaLabels[lang].renderingConcept)}${paragraph(copy.description)}`;
  body += heading(copy.introTitle) + copy.intro.map(paragraph).join("");
  body += heading(copy.comparisonsTitle) + paragraph(copy.comparisonsDescription)
    + copy.comparisons.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.meta)}${paragraph(item.description)}`).join("");
  body += heading(copy.challengesTitle) + paragraph(copy.challengesDescription)
    + copy.challenges.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.desc)}`).join("");
  body += paragraph(copy.scopeDescription) + list(copy.scopeTitle, [...copy.scope]);
  body += heading(copy.processTitle) + paragraph(copy.processDescription)
    + copy.process.map(item => `<h3>${escape(item.title)}</h3>${paragraph(item.desc)}`).join("");
  body += heading(copy.priceTitle) + paragraph(copy.priceDescription)
    + copy.prices.map(item => `<h3>${escape(item.type)}</h3>${paragraph(item.range)}${paragraph(item.desc)}`).join("");
  body += heading(copy.resourceTitle) + paragraph(copy.resourceDescription)
    + getServiceContextLinks("old-house", lang).map(item => heading(item.title) + paragraph(item.description) + link(item.href, item.title, lang)).join("");
  body += copy.planningAnswers.map(item => heading(item.title) + paragraph(item.paragraph)).join("");
  body += faqs(copy.faqTitle, faqItems) + heading(copy.ctaTitle) + paragraph(copy.ctaDescription);
  body += `<nav>${copy.internalLinks.map(item => link(item.to, item.label, lang)).join(" · ")}</nav>`;
  return wrap(body, lang);
}

function processBody(sources: Sources, lang: Lang) {
  const copy = processPageText[lang];
  const row = sources.row?.status === "published" ? sources.row : null;
  const field = (name: string) => plain(row?.[`${name}_${lang}`], lang);
  const steps = sources.processSteps?.filter(step => step.status === "published");
  const visible = steps?.length ? steps.map((step, index) => ({
    title: plain(step[`title_${lang}`], lang), desc: plain(step[`description_${lang}`], lang),
    details: copy.steps[index]?.details?.length ? [...copy.steps[index].details] : [plain(step[`description_${lang}`], lang)],
  })) : copy.steps;
  return wrap(`<h1>${escape(field("title") || copy.title)}</h1>${paragraph(field("description") || copy.description)}${heading(copy.sectionTitle)}${paragraph(field("content") || copy.sectionDescription)}<ol>${visible.map(step =>
    `<li><h3>${escape(step.title)}</h3>${paragraph(step.desc)}${list("", [...step.details])}</li>`
  ).join("")}</ol>`, lang);
}

// This supplements the existing reviewed renderers without rewriting their
// frozen source or falling back to a different language or an unpublished row.
export function buildExpandedReadableBody(key: string, sources: Sources) {
  const match = key.match(/^\/(en|zh)(\/.*)$/);
  if (!match) return "";
  const lang = match[1] as Lang, path = match[2];
  if (path === "/services/old-house") return oldHouseBody(sources.row, lang);
  if (path === "/process") return processBody(sources, lang);
  if (readableBodyPaths.some(reviewed => reviewed === path)) return "";
  const detail = path.match(/^\/(services|blog|projects|materials)\/([^/]+)$/);
  const row = sources.row;
  if (detail && row?.status === "published" && row.slug === decodeURIComponent(detail[2])) {
    const kind = detail[1];
    const field = (name: string) => plain(row[`${name}_${lang}`], lang);
    const title = field("title");
    const content = text(row[`content_${lang}`]) || text(row[`excerpt_${lang}`]);
    if (!title || !content.trim() || content.length > 131072) return "";
    let body = `<h1>${escape(title)}</h1>`;
    if (kind === "projects" && isRenderingConceptProject({ ...row, images: records(row.project_images).map(image => text(image.image_url)) })) body += paragraph(mediaLabels[lang].renderingConcept);
    if (field("excerpt")) body += paragraph(field("excerpt"));
    // Project and material pages display plain paragraphs; preserve that same
    // text. Blogs/services retain their authored headings and safe links.
    body += kind === "projects" || kind === "materials"
      ? paragraph(plain(content, lang)) : sanitizeReadableContent(content, lang);
    const values = (name: string) => strings(row[`${name}_${lang}`]).map(item => plain(item, lang)).filter(Boolean);
    if (kind === "services") {
      const copy = serviceDetailPageText[lang];
      if (detail[2] === "design") {
        const design = designServicePageText[lang];
        body += heading(design.worksTitle) + paragraph(design.worksSummary)
          + paragraph(design.conceptDisclosure) + heading(design.courtyardTitle) + paragraph(design.courtyardDescription)
          + heading(design.readingTitle) + paragraph(design.readingDescription)
          + heading(design.approachTitle) + paragraph(design.approachSummary)
          + heading(design.designReasons3) + paragraph(design.designReasons4)
          + heading(design.designReasons) + paragraph(design.designReasons2)
          + heading(design.designReasons5) + paragraph(design.designReasons6)
          + heading(design.materialsTitle) + paragraph(design.materialsSummary)
          + heading(design.woodMaterialTitle) + paragraph(design.materialWood)
          + heading(design.stoneMaterialTitle) + paragraph(design.materialStone)
          + heading(design.linenMaterialTitle) + paragraph(design.materialLinen)
          + heading(design.bronzeMaterialTitle) + paragraph(design.materialBronze)
          + heading(design.servicesTitle) + paragraph(design.servicesSummary);
        body += [[design.serviceItem, design.serviceContent], [design.serviceItem2, design.serviceContent2],
          [design.serviceItem3, design.serviceContent3], [design.serviceItem4, design.serviceContent4],
          [design.processTitle, design.processSummary], [design.processGrid, design.processGrid2],
          [design.processGrid3, design.processGrid4], [design.processGrid5, design.processGrid6],
          [design.processGrid7, design.processGrid8], [design.processGrid9, design.processGrid10],
          [design.processGrid11, design.processGrid12]].map(([title, description]) => heading(title) + paragraph(description)).join("");
        return wrap(body + faqs(design.faqTitle, mapPublicServiceFaqs(row[`faqs_${lang}`])), lang);
      }
      if (detail[2] === "surface-repair") {
        const repair = surfaceRepairPageText[lang];
        body += heading(repair.scopeTitle) + repair.damageExamples.map(item =>
          heading(item.title) + paragraph(item.condition) + paragraph(item.approach) + paragraph(item.boundary)).join("");
        body += heading(repair.allScopeTitle) + repair.services.map(item => heading(item.title) + paragraph(item.summary)
          + paragraph(item.problems) + paragraph(item.direction) + paragraph(item.boundary)).join("");
        body += heading(repair.assessmentTitle) + paragraph(repair.assessmentDescription)
          + repair.assessment.map(item => heading(item.title) + paragraph(item.description) + paragraph(item.label) + paragraph(item.details)).join("");
        const steps = records(row[`process_steps_${lang}`]);
        body += heading(repair.processTitle) + paragraph(repair.processDescription)
          + (steps.length ? steps.map(item => heading(plain(item.title, lang)) + paragraph(plain(item.desc, lang)))
            : repair.process.map(item => heading(item.title) + paragraph(item.description))).join("");
        body += paragraph(repair.situations) + heading(repair.priceTitle)
          + repair.priceFactors.map(item => heading(item.title) + paragraph(item.description)).join("")
          + faqs(repair.faqTitle, mapPublicServiceFaqs(row[`faqs_${lang}`]))
          + heading(repair.consultTitle) + paragraph(repair.consultDescription)
          + repair.photoGuide.map(item => heading(item.title) + paragraph(item.description)).join("")
          + heading(repair.relatedTitle) + paragraph(repair.relatedDescription)
          + repair.related.map(item => link(item.path, item.title, lang)).join(" · ");
        return wrap(body, lang);
      }
      body += list(copy.suitableFor, values("suitable_for")) + list(copy.offer, values("scope_items")) + list(copy.commonProjects, values("common_projects"));
      body += records(row[`process_steps_${lang}`]).map(step => `<h3>${escape(plain(step.title, lang))}</h3>${paragraph(plain(step.desc, lang))}`).join("");
      body += faqs(copy.faq, mapPublicServiceFaqs(row[`faqs_${lang}`]));
      body += getServiceContextLinks(detail[2], lang).map(item => heading(item.title) + paragraph(item.description) + link(item.href, item.title, lang)).join("");
    } else if (kind === "projects") {
      const copy = projectDetailPageText[lang];
      body += heading(copy.clientRequirements) + paragraph(field("client_need"));
      body += list(copy.solution, values("highlights"));
      body += list(copy.scope, strings(row.scope).map(value => translateProjectScopedLabel(value, lang, detail[2], "scope")));
      body += list(copy.materials, strings(row.materials).map(value => translateProjectScopedLabel(value, lang, detail[2], "materials")));
    } else if (kind === "materials") {
      const copy = materialDetailPageText[lang];
      body += list(copy.suitableSpaces, strings(row[`suitable_spaces_${lang}`]).map(value => translateSpaceLabel(value, lang)));
      body += list(copy.pros, values("pros")) + list(copy.cons, values("cons"));
      body += paragraph(field("recommended_pairing")) + paragraph(field("note"));
    }
    return wrap(body, lang);
  }
  const category = path.match(/^\/materials\/category\/([^/]+)(?:\/([^/]+))?$/);
  const kind = path.slice(1);
  const collection = ({ services: sources.services, projects: sources.projects, materials: sources.materials, blog: sources.blogPosts } as Record<string, Row[] | null | undefined>)[category ? "materials" : kind];
  if (!collection) return "";
  const rows = collection.filter(item => item.status === "published" && safeSlug(item.slug) && text(item[`title_${lang}`]).trim()
    && (!category || taxonomy(item.category) === category[1] && (!category[2] || taxonomy(item.subcategory) === category[2])));
  if (!rows.length) return "";
  const copy = ({ services: servicesPageText, projects: projectsPageText, materials: materialsPageText, blog: blogPageText } as const)[category ? "materials" : kind as "services" | "projects" | "materials" | "blog"];
  if (!copy) return "";
  const categoryName = category ? translateMaterialCategory(text(rows[0].category), lang) : "";
  const categoryTitle = category?.[2] ? translateMaterialSubcategory(text(rows[0].subcategory), lang) : categoryName;
  let body = `<h1>${escape(categoryTitle || copy[lang].title)}</h1>${paragraph(category ? plain(rows[0][`excerpt_${lang}`], lang) : copy[lang].intro)}`;
  if (category?.[2]) {
    const guidance = getMaterialSubcategoryGuidance(category[1], categoryName, categoryTitle, lang);
    body += heading(guidance.checklistTitle) + paragraph(guidance.checklistDescription)
      + guidance.checklist.map(item => heading(item.title) + paragraph(item.description)).join("")
      + heading(guidance.relatedTitle) + paragraph(guidance.relatedDescription)
      + guidance.relatedLinks.map(item => link(item.href, item.title, lang)).join(" · ");
  }
  body += `<ul>${rows.map(item =>
    `<li><h2>${link(`/${category ? "materials" : kind}/${safeSlug(item.slug)}`, plain(item[`title_${lang}`], lang), lang)}</h2>${paragraph(plain(item[`excerpt_${lang}`], lang))}</li>`
  ).join("")}</ul>`;
  return wrap(body, lang);
}
