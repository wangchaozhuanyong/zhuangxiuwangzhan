import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { buildExpandedReadableBody } from "../../functions/expandedReadableBody";
import { oldHouseRenovationPageText } from "@/i18n/oldHouseRenovationPageText";
import { processPageText } from "@/i18n/processPageText";
import { designServicePageText } from "@/i18n/designServicePageText";
import { surfaceRepairPageText } from "@/i18n/surfaceRepairPageText";

const row = { slug: "current", status: "published", title_en: "Current title", title_zh: "当前标题", excerpt_en: "Current summary", excerpt_zh: "当前摘要",
  content_en: '<h2>Full section</h2><p>Full body <a href="/en/quote">Enquire</a></p>', content_zh: '<h2>完整章节</h2><p>完整正文 <a href="/zh/quote">咨询</a></p>',
  category: "flooring", subcategory: "vinyl", scope: ["Published scope"], materials: [], highlights_en: [], highlights_zh: [],
};
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
