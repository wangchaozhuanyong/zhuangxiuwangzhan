import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchemeASection } from "@/components/scheme-a/SchemeARoutePrimitives";
import { findSelangorWarehouseIntroLink } from "./selangorWarehouseIntroLink";

const approved = {
  en: "For warehouse-related needs, the confirmed scope is limited to racking, aisle planning, floor marking, and storage zoning; exact work is subject to a site review and quotation.",
  zh: "仓储相关服务仅限货架、通道规划、地面标线及存储分区，具体范围以现场评估与报价为准。",
};

describe("Selangor warehouse link within the existing qualified paragraph", () => {
  it.each(["en", "zh"] as const)("preserves every %s paragraph and the existing section structure", language => {
    const paragraphs = ["Existing introduction.", approved[language], "Existing final paragraph."];
    const link = findSelangorWarehouseIntroLink(paragraphs, "selangor", language)!;
    expect(link.paragraphIndex).toBe(1);
    expect(link.before + link.anchor + link.after).toBe(approved[language]);
    expect(link.anchor).toBe(language === "en" ? "warehouse-related needs" : "仓储相关服务");
    const render = (linked: boolean) => renderToStaticMarkup(
      <SchemeASection title="Existing title" description={paragraphs.map((paragraph, index) => linked && index === link.paragraphIndex
        ? <>{link.before}<a href={`/${language}${link.to}`}>{link.anchor}</a>{link.after}</> : paragraph)}>
        <ul><li>Existing feature</li></ul>
      </SchemeASection>,
    );
    const before = render(false);
    const after = render(true);
    expect(after).toContain(`href="/${language}/services/warehouse"`);
    expect(after.replace(/<a[^>]*>|<\/a>/g, "")).toBe(before);
  });

  it.each(["en", "zh"] as const)("leaves %s missing, ambiguous, incomplete and other-location text unlinked", language => {
    const paragraph = approved[language];
    const link = findSelangorWarehouseIntroLink([paragraph], "selangor", language)!;
    for (const paragraphs of [[], ["Plain introduction"], [paragraph, paragraph], [paragraph + link.anchor], [paragraph.replace(language === "en" ? "floor marking" : "地面标线", "")]]) {
      expect(findSelangorWarehouseIntroLink(paragraphs, "selangor", language)).toBeNull();
    }
    expect(findSelangorWarehouseIntroLink([paragraph], "kuala-lumpur", language)).toBeNull();
    expect(findSelangorWarehouseIntroLink([paragraph], undefined, language)).toBeNull();
  });
});
