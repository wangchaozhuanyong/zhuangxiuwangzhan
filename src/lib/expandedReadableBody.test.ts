import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { buildExpandedReadableBody } from "../../functions/expandedReadableBody";
import { buildReadableCollectionBody, buildReadablePublicBody } from "../../functions/readablePublicBody";
import { getServiceProjectGuidance } from "@/i18n/serviceDetailPageText";
import { loadMalayContent } from "@/i18n/malayContentRuntime";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";
import { beforeAfterPageText } from "@/i18n/beforeAfterPageText";
import { mediaLabels } from "@/i18n/mediaLabels";
import { processPageText } from "@/i18n/processPageText";
import { designServicePageText } from "@/i18n/designServicePageText";
import { surfaceRepairPageText } from "@/i18n/surfaceRepairPageText";
import { getMaterialCategoryGuidance, materialCategoryPageText } from "@/i18n/materialCategoryPageText";
import { materialSubcategoryPageText } from "@/i18n/materialSubcategoryPageText";

const row = { slug: "current", status: "published", title_en: "Current title", title_zh: "当前标题", excerpt_en: "Current summary", excerpt_zh: "当前摘要",
  content_en: '<h2>Full section</h2><p>Full body <a href="/en/quote">Enquire</a></p>', content_zh: '<h2>完整章节</h2><p>完整正文 <a href="/zh/quote">咨询</a></p>',
  category: "flooring", subcategory: "vinyl", scope: ["Published scope"], materials: [], highlights_en: [], highlights_zh: [],
};
it.each(["en", "zh", "ms"] as const)("exposes the %s planning comparisons in the initial HTML", lang => {
  const dom = new JSDOM(buildExpandedReadableBody(`/${lang}/before-after`, {}));
  const main: HTMLElement = dom.window.document.querySelector("main[data-flashcast-readable-body]");
  const copy = beforeAfterPageText[lang];
  expect(main.querySelector("h1")?.textContent).toBe(copy.heroTitle);
  expect(main.textContent).toContain(mediaLabels[lang].renderingConcept);
  expect(Array.from(main.querySelectorAll("h3"), heading => heading.textContent))
    .toEqual(copy.fallbackItems.map(item => item.title));
  expect(main.querySelector(`a[href="/${lang}/quote#quote-form"]`)).toBeTruthy();
  dom.window.close();
});
it.each(["en", "zh", "ms"] as const)("links the %s digital-lock service to the existing KL guide", async lang => {
  if (lang === "ms") await loadMalayContent();
  const key = `/${lang}/services/digital-lock`;
  const body = buildExpandedReadableBody(key, {
    row: { status: "published", slug: "digital-lock", [`title_${lang}`]: "Digital Lock", [`content_${lang}`]: "<p>Door fit.</p>" },
  });
  expect(body).toContain(`href="/${lang}/locations/kuala-lumpur/digital-lock"`);
  expect(body).not.toContain("/locations/cheras/digital-lock");
});

describe.each(["en", "zh"] as const)("expanded %s raw HTML", lang => {
  it.each(["services", "blog", "projects", "materials"])("outputs the current published %s body, safely and without another language", kind => {
    const html = buildExpandedReadableBody(`/${lang}/${kind}/current`, { row });
    const dom = new JSDOM(html); const main = dom.window.document.querySelector("main")!;
    expect(main.querySelectorAll("h1")).toHaveLength(1);
    expect(main.textContent).toContain(lang === "en" ? "Full body" : "完整正文");
    expect(main.textContent).not.toContain(lang === "en" ? "完整正文" : "Full body");
    expect(main.querySelectorAll("nav a").length).toBeGreaterThan(0);
    expect(main.querySelector("script,iframe,form,img")).toBeNull();
    dom.window.close();
    expect(buildExpandedReadableBody(`/${lang}/${kind}/current`, { row: { ...row, status: "draft" } })).toBe("");
    expect(buildExpandedReadableBody(`/${lang}/${kind}/current`, { row: { ...row, slug: "other" } })).toBe("");
    expect(buildExpandedReadableBody(`/${lang}/${kind}/current`, { row: { ...row, [`content_${lang}`]: "", [`excerpt_${lang}`]: "" } })).toBe("");
  });
  it("uses the actual old-house renderer copy, its planning answers and published FAQ locale", () => {
    const html = buildExpandedReadableBody(`/${lang}/services/old-house`, { row: { status: "published", [`faqs_${lang}`]: [{ q: "Published FAQ", a: "Published answer" }] } });
    const dom = new JSDOM(html); const body = dom.window.document.body.textContent;
    expect(body).toContain(oldHouseRenovationPageText[lang].title);
    expect(body).toContain(oldHouseRenovationPageText[lang].planningAnswers[0].paragraph);
    expect(body).toContain("Published answer");
    expect(body).not.toContain(oldHouseRenovationPageText[lang].faqs[0].q);
    dom.window.close();
  });
  it("uses published process steps and retains the visible supplementary details", () => {
    const html = buildExpandedReadableBody(`/${lang}/process`, { processSteps: [{ status: "published", [`title_${lang}`]: "Published step", [`description_${lang}`]: "Published step description" }] });
    const dom = new JSDOM(html);
    expect(dom.window.document.body.textContent).toContain("Published step description");
    expect(dom.window.document.body.textContent).toContain(processPageText[lang].steps[0].details[0]);
    dom.window.close();
  });
  it("projects the dedicated design and repair editorial sections from their actual bilingual sources", () => {
    for (const slug of ["design", "surface-repair"]) {
      const html = buildExpandedReadableBody(`/${lang}/services/${slug}`, { row: { ...row, slug } });
      const dom = new JSDOM(html);
      const expected = slug === "design" ? designServicePageText[lang].materialLinen : surfaceRepairPageText[lang].damageExamples[0].boundary;
      expect(dom.window.document.body.textContent).toContain(expected);
      expect(dom.window.document.querySelectorAll("h1")).toHaveLength(1);
      dom.window.close();
    }
  });
  it.each(["services", "projects", "materials", "blog", "materials/category/flooring/vinyl"])("provides language scoped navigation for the %s collection", kind => {
    const html = buildExpandedReadableBody(`/${lang}/${kind}`, { services: [row], projects: [row], materials: [row], blogPosts: [row] });
    const dom = new JSDOM(html);
    expect(dom.window.document.querySelector(`a[href="/${lang}/${kind.startsWith("materials/") ? "materials" : kind}/current"]`)).not.toBeNull();
    dom.window.close();
  });
  it("strips executable HTML and unsafe or cross-language links from authored content", () => {
    const html = buildExpandedReadableBody(`/${lang}/blog/current`, { row: { ...row, [`content_${lang}`]: `<p>Safe</p><script>bad()</script><a href="javascript:bad()">Bad</a><a href="/${lang === "en" ? "zh" : "en"}/quote">Other language</a></noscript>` } });
    expect(html).not.toMatch(/<script|javascript:|<\/noscript>|bad\(\)/);
    expect(new JSDOM(html).window.document.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});

it("includes a distinct guide on every reviewed Chinese category and leaves other languages alone", () => {
  const slugs = [
    "kitchen-cabinets", "whole-house-custom", "furniture", "bathroom", "countertops-stone-surfaces",
    "flooring", "doors-windows", "wall-panels", "art-paint",
  ];
  const headings = new Set<string>();
  for (const slug of slugs) {
    const path = `/materials/category/${slug}`;
    const guidance = getMaterialCategoryGuidance(slug, "zh");
    expect(guidance).toBeDefined();
    const html = buildExpandedReadableBody(`/zh${path}`, { materials: [] });
    expect(html).toContain(guidance!.title);
    for (const paragraph of guidance!.paragraphs) expect(html).toContain(paragraph);
    expect(buildExpandedReadableBody(`/en${path}`, { materials: [] })).not.toContain(guidance!.title);
    expect(buildExpandedReadableBody(`/ms${path}`, { materials: [] })).not.toContain(guidance!.title);
    headings.add(guidance!.title);
  }
  expect(headings.size).toBe(slugs.length);
});

it("appends the top-level guide to published material markup without changing subcategory copy", () => {
  const guidance = getMaterialCategoryGuidance("flooring", "zh")!;
  const flooring = { materials: [row] };
  const path = "/zh/materials/category/flooring";
  expect(buildExpandedReadableBody(path, flooring)).toContain(guidance.title);
  expect(buildExpandedReadableBody(path, flooring)).toContain('href="/zh/materials/current"');
  expect(buildExpandedReadableBody(`${path}/vinyl`, flooring)).not.toContain(guidance.title);

  const joinery = { materials: [{ ...row, category: "whole-house-custom", subcategory: "solid-wood-finish" }] };
  const joineryPath = "/zh/materials/category/whole-house-custom";
  const joineryGuide = getMaterialCategoryGuidance("whole-house-custom", "zh")!;
  expect(buildReadableCollectionBody(joineryPath, joinery)).toContain(joineryGuide.title);
  expect(buildReadableCollectionBody(`${joineryPath}/solid-wood-finish`, joinery)).not.toContain(joineryGuide.title);
});

describe.each(["en", "zh"] as const)("static material taxonomy in initial %s HTML", lang => {
  it("renders real furniture subcategories without inventory from the independent store", () => {
    const path = `/${lang}/materials/category/furniture`;
    const html = buildExpandedReadableBody(path, { materials: [], resolveMaterialLink: href => href });
    const dom = new JSDOM(html);
    const document = dom.window.document;
    expect(document.body.textContent).toContain(materialCategoryPageText[lang].browseSubcategories);
    expect(document.querySelectorAll(`a[href^="${path}/"]`)).toHaveLength(6);
    expect(document.querySelector(`a[href^="/${lang}/furniture"]`)).toBeNull();
    dom.window.close();
  });

  it("uses the actual cabinet fallback products and points to their canonical links", () => {
    const path = `/${lang}/materials/category/whole-house-custom/kitchen-cabinets`;
    const canonicalLinks: Record<string, string> = {
      [`/${lang}/materials/melamine-grey-oak`]: `/${lang}/materials/melamine-cabinet-grey-oak`,
      [`/${lang}/materials/acrylic-high-gloss-white`]: `/${lang}/materials/acrylic-cabinet-gloss-white`,
    };
    const html = buildExpandedReadableBody(path, {
      materials: [{ ...row, category: "Whole House Custom", subcategory: "kitchen-cabinets", status: "draft" }],
      resolveMaterialLink: href => canonicalLinks[href],
    });
    const dom = new JSDOM(html);
    const document = dom.window.document;
    expect([...document.querySelectorAll("li h3 a")].map((anchor) => anchor.getAttribute("href"))).toEqual(Object.values(canonicalLinks));
    expect(document.querySelector('a[href*="built-in-cabinet-cost"]')).toBeNull();
    expect(document.body.textContent).not.toContain(row[`title_${lang}`]);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    dom.window.close();
  });

  it("retains the visible planning guidance for an empty subcategory and ignores unknown routes", () => {
    const path = `/${lang}/materials/category/bathroom/toilet`;
    const html = buildExpandedReadableBody(path, { materials: [], resolveMaterialLink: href => href });
    const dom = new JSDOM(html);
    const document = dom.window.document;
    expect(document.body.textContent).toContain(materialSubcategoryPageText[lang].comingSoon);
    expect(document.querySelector(`a[href="/${lang}/services/bathroom"]`)).not.toBeNull();
    expect(document.querySelector("li h3 a")).toBeNull();
    dom.window.close();
    expect(buildExpandedReadableBody(`/${lang}/materials/category/unknown`, { materials: [] })).toBe("");
    expect(buildExpandedReadableBody(`/${lang}/materials/category/furniture/unknown`, { materials: [] })).toBe("");
  });
});

describe("shop project guidance in initial HTML", () => {
  beforeAll(async () => { await loadMalayContent(); });

  const shop = {
    ...row, slug: "shop-renovation",
    title_ms: "Kedai", content_ms: "<p>Kandungan kedai asal</p>",
    process_steps_en: [{ title: "Scope & material review", desc: "Existing English process" }],
    process_steps_zh: [{ title: "原有范围确认", desc: "原有中文流程" }],
    process_steps_ms: [{ title: "Langkah asal", desc: "Butiran asal" }],
    faqs_en: [{ q: "Existing question?", a: "Existing answer." }],
    faqs_zh: [{ q: "原有问题？", a: "原有回答。" }],
  };

  it.each(["en", "zh"] as const)("includes the exact existing %s copy once through the middleware renderer selection", lang => {
    const before = JSON.stringify(shop);
    const route = `/${lang}/services/shop-renovation`;
    const html = buildReadablePublicBody(route, shop) || buildExpandedReadableBody(route, { row: shop });
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const [block] = getServiceProjectGuidance(shop.slug, lang);
    const headings = [...document.querySelectorAll("h2")].filter(item => item.textContent === block.heading);
    expect(headings).toHaveLength(1);
    const section = headings[0].parentElement!;
    expect([...section.querySelectorAll("p")].map(item => item.textContent)).toEqual(block.body.split("\n"));
    expect(section.querySelectorAll("p")).toHaveLength(6);
    expect(section.textContent).not.toContain(getServiceProjectGuidance(shop.slug, lang === "en" ? "zh" : "en")[0].heading);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toBe(shop[`title_${lang}`]);
    const process = [...document.querySelectorAll("h3")].find(item => item.textContent === shop[`process_steps_${lang}`][0].title)!;
    expect(process).toBeDefined();
    expect(process.compareDocumentPosition(section) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(document.body.textContent).toContain(lang === "en" ? "Full body" : "完整正文");
    expect(document.body.textContent).toContain(shop[`faqs_${lang}`][0].a);
    expect(document.querySelector("script,iframe,form,img")).toBeNull();
    expect(JSON.stringify(shop)).toBe(before);
    dom.window.close();
  });

  it.each(["en", "zh"] as const)("retains published, slug and body guards for %s shop content", lang => {
    const invalidRows = [
      { ...shop, status: "draft" }, { ...shop, status: "archived" },
      { ...shop, slug: "office-renovation" },
      { ...shop, [`title_${lang}`]: "" },
      { ...shop, [`content_${lang}`]: "", [`excerpt_${lang}`]: "" },
      { ...shop, [`content_${lang}`]: "x".repeat(131073) },
    ];
    for (const invalid of invalidRows) {
      expect(buildExpandedReadableBody(`/${lang}/services/shop-renovation`, { row: invalid })).toBe("");
    }
  });

  it.each([
    ["ms", "shop-renovation"], ["en", "office-renovation"], ["zh", "office-renovation"],
    ["ms", "office-renovation"], ["en", "current"], ["zh", "current"], ["ms", "current"],
  ] as const)("does not add shop guidance to %s/%s", (lang, slug) => {
    const html = buildExpandedReadableBody(`/${lang}/services/${slug}`, { row: { ...shop, slug } });
    expect(html).not.toBe("");
    for (const locale of ["en", "zh"] as const) {
      expect(html).not.toContain(getServiceProjectGuidance(shop.slug, locale)[0].heading);
    }
  });
});
